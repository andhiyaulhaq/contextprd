/**
 * semanticWorker.ts — runs as a dedicated Web Worker.
 *
 * Responsibilities:
 *  1. Load the Xenova/all-MiniLM-L6-v2 quantized model on INIT.
 *  2. Batch-encode project files into 384-dim embeddings (ENCODE_FILES).
 *     - Checks in-memory cache first (same hash = skip).
 *     - Falls back to IndexedDB cache keyed by `fileId:hash`.
 *     - Only encodes files whose content has actually changed.
 *  3. Encode a query and cosine-compare against all stored embeddings (SEARCH).
 *
 * Message API (main → worker):
 *   { type: 'INIT' }
 *   { type: 'ENCODE_FILES', payload: { files: { id, name, content }[] } }
 *   { type: 'SEARCH', payload: { query: string, fileIds: string[] } }
 *
 * Message API (worker → main):
 *   { type: 'READY' }
 *   { type: 'ERROR', payload: string }
 *   { type: 'ENCODE_COMPLETE', payload: { count: number } }
 *   { type: 'SEARCH_RESULT', payload: { results: { fileId: string; score: number }[] } }
 */

// @ts-ignore — loaded as ES module worker
import { pipeline } from '@huggingface/transformers';

// ─── Types ───────────────────────────────────────────────────────────────────

type FeatureExtractionPipeline = (
  text: string,
  opts: { pooling: string; normalize: boolean }
) => Promise<{ data: Float32Array }>;

// ─── Utilities ───────────────────────────────────────────────────────────────

/** FNV-1a 32-bit hash encoded as a base-36 string — fast & collision-resistant for caching. */
function fnvHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(36);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// ─── IDB helpers (no external deps, raw IDB API) ─────────────────────────────

const IDB_NAME    = 'contextprd-embeddings';
const IDB_STORE   = 'embeddings';
const IDB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(IDB_STORE)) {
        req.result.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function idbGet(key: string): Promise<number[] | null> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx  = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror   = () => resolve(null);
    });
  } catch { return null; }
}

async function idbSet(key: string, value: number[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror    = () => resolve();
    });
  } catch { /* best-effort */ }
}

// ─── State ───────────────────────────────────────────────────────────────────

let extractor: FeatureExtractionPipeline | null = null;

/** In-memory map: fileId → { hash, embedding } */
const store = new Map<string, { hash: string; embedding: number[] }>();

async function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      dtype: 'fp32',
    }) as FeatureExtractionPipeline;
  }
  return extractor!;
}

async function embed(text: string): Promise<number[]> {
  const ext = await getExtractor();
  // Truncate to ~500 tokens worth of chars to keep encoding fast
  const truncated = text.slice(0, 2000);
  const out = await ext(truncated, { pooling: 'mean', normalize: true });
  return Array.from(out.data);
}

// ─── Message handler ─────────────────────────────────────────────────────────

self.onmessage = async (event: MessageEvent<{ type: string; payload?: unknown }>) => {
  const { type, payload } = event.data;

  // ── INIT: load the model ──────────────────────────────────────────────────
  if (type === 'INIT') {
    try {
      await getExtractor();
      self.postMessage({ type: 'READY' });
    } catch (e) {
      self.postMessage({ type: 'ERROR', payload: String(e) });
    }
    return;
  }

  // ── ENCODE_FILES: batch-encode project files ──────────────────────────────
  if (type === 'ENCODE_FILES') {
    const { files } = payload as { files: { id: string; name: string; content: string }[] };
    let encoded = 0;

    for (const file of files) {
      const hash     = fnvHash(file.name + file.content);
      const cacheKey = `${file.id}:${hash}`;

      // 1. In-memory hit
      const mem = store.get(file.id);
      if (mem && mem.hash === hash) { encoded++; continue; }

      // 2. IDB hit
      const cached = await idbGet(cacheKey);
      if (cached) {
        store.set(file.id, { hash, embedding: cached });
        encoded++;
        continue;
      }

      // 3. Encode fresh
      const text      = `${file.name}\n${file.content}`;
      const embedding = await embed(text);
      store.set(file.id, { hash, embedding });
      await idbSet(cacheKey, embedding);
      encoded++;
    }

    self.postMessage({ type: 'ENCODE_COMPLETE', payload: { count: encoded } });
    return;
  }

  // ── SEARCH: query vs stored embeddings ───────────────────────────────────
  if (type === 'SEARCH') {
    const { query, fileIds } = payload as { query: string; fileIds: string[] };
    try {
      const queryVec = await embed(query);
      const results = fileIds
        .map((id) => {
          const entry = store.get(id);
          if (!entry) return null;
          return { fileId: id, score: cosineSimilarity(queryVec, entry.embedding) };
        })
        .filter((r): r is { fileId: string; score: number } => r !== null)
        .sort((a, b) => b.score - a.score);

      self.postMessage({ type: 'SEARCH_RESULT', payload: { results } });
    } catch (e) {
      self.postMessage({ type: 'SEARCH_ERROR', payload: String(e) });
    }
  }
};
