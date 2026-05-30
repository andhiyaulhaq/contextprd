# ADR-001: In-Browser Semantic Search via Transformer Embeddings

**Date:** 2026-05-30  
**Status:** Accepted  
**Deciders:** @andhiyaulhaq  
**Category:** Search & AI Architecture  

---

## Context

ContextPRD is a local-first PRD orchestrator where users can accumulate 20+ interconnected markdown files per project. The existing `@mention` system in the AI chat requires users to already know which file is relevant to their query. As projects scale, this becomes increasingly difficult.

We need a way for users to **discover relevant files by intent** (e.g., *"find files about authentication"*) rather than by exact filename recall.

---

## Decision

We will implement **hybrid in-browser search** combining:

1. **Traditional full-text search** — synchronous, instant, zero dependencies.
2. **Semantic vector search** — using `@huggingface/transformers` with the `all-MiniLM-L6-v2` model (384-dim, ~5MB WASM, Apache-2.0 licensed), running entirely in a browser **Web Worker**.

---

## Alternatives Considered

### Option A: Traditional Search Only
- ✅ Zero dependencies, instant, offline-native
- ❌ Vocabulary mismatch: "login" won't match "authentication"
- ❌ No relevance ranking; all results are equally weighted
- **Rejected:** Insufficient for intent-based cross-document discovery

### Option B: Server-side RAG (Pinecone / Supabase Vector)
- ✅ State-of-the-art embedding quality
- ❌ Breaks local-first, no-server architectural principle
- ❌ Requires API keys, network, external billing
- ❌ Privacy: user document content would be sent to third-party
- **Rejected:** Violates core product constraint

### Option C: In-Browser WASM Embeddings (Chosen)
- ✅ Fully local — no server, no API, no data leakage
- ✅ Works offline after the model is cached
- ✅ Vocabulary-independent, intent-aware
- ⚠️ ~5MB model download on first session (cached via browser)
- ⚠️ Web Worker initialization overhead (~300-500ms on first use)
- **Accepted**

---

## Consequences

### Positive
- Users can search files by **meaning**, not just exact keywords
- Semantic embeddings can be reused in the future for **automatic context selection** (feeding the most relevant files to the AI without explicit `@mention`)
- Maintains the **local-first, privacy-first** product principle unconditionally

### Negative / Mitigations
- **Bundle / download size:** The `all-MiniLM-L6-v2` WASM binary (~5MB) is downloaded on first use. Mitigation: cached by the browser indefinitely; silent background preload begins 10 seconds after initial page render.
- **CPU cost of re-encoding:** Encoding a file into a 384-dim vector takes ~10-50ms per file. Mitigation: embeddings are persisted in IndexedDB keyed by `fileId:sha256(content)`. Only changed or new files are re-encoded on subsequent loads.

---

## Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Model | `all-MiniLM-L6-v2` | Best balance of quality vs size (5MB); well-suited for sentence similarity |
| Runtime | `@huggingface/transformers` | Pure JS/WASM, no native bindings, no Node.js required |
| Threading | Web Worker | Keeps embedding computations off the main UI thread |
| Cold start | Silent preload after 10s | Prioritizes critical UI render; model ready before first user search |
| Embedding cache | IndexedDB by `fileId:contentHash` | Near-zero re-encoding cost after first session |
| Search strategy | Hybrid (traditional + semantic, merged) | Instant keyword feedback + intelligent semantic ranking |

---

## Links & References
- [huggingface/transformers.js](https://github.com/huggingface/transformers.js)
- [all-MiniLM-L6-v2 on HuggingFace](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [Implementation Plan](../brain/fbd5d608-bedf-4633-b03c-a7890a0216b8/implementation_plan.md)
