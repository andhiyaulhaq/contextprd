'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { FileNode } from '../types/project';
import { traditionalSearch } from '../lib/search/traditionalSearch';
import { semanticSearchManager, SearchWorkerStatus } from '../lib/search/semanticSearchManager';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SearchResult {
  fileId: string;
  fileName: string;
  excerpt: string;
  /** keyword match score (0 = no keyword match) */
  keywordScore: number;
  /** semantic similarity [0–1], null if model not ready */
  semanticScore: number | null;
  /** merged rank score */
  rankScore: number;
}

function flattenMarkdownFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === 'markdown') result.push(node);
    if (node.children) result.push(...flattenMarkdownFiles(node.children));
  }
  return result;
}

/**
 * Hook to access semantic search. Handles file tree subscription,
 * automatic encoding updates, worker status synchronization, and query merging.
 */
export function useSemanticSearch() {
  const [workerStatus, setWorkerStatus] = useState<SearchWorkerStatus>('idle');

  const projects        = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const project         = activeProjectId ? projects[activeProjectId] : null;
  const allFiles        = useMemo(() => project ? flattenMarkdownFiles(project.fileTree) : [], [project?.fileTree]);

  // Sync worker status with singleton manager
  useEffect(() => {
    const unsubscribe = semanticSearchManager.addStatusListener((status) => {
      setWorkerStatus(status);
    });
    return unsubscribe;
  }, []);

  // Automatically trigger model preload / worker initialization on mount
  useEffect(() => {
    // This will trigger immediately, but semanticSearchManager already handles
    // the 10-second delay. However, if the user renders search, we will force initialize it.
    // So this just listens.
  }, []);

  // Debounced auto-indexing of files when project files change
  const encodeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (workerStatus !== 'ready' || allFiles.length === 0) return;

    if (encodeTimerRef.current) clearTimeout(encodeTimerRef.current);
    encodeTimerRef.current = setTimeout(() => {
      semanticSearchManager.encodeFiles(
        allFiles.map((f) => ({ id: f.id, name: f.name, content: f.content }))
      );
    }, 1500);

    return () => {
      if (encodeTimerRef.current) clearTimeout(encodeTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workerStatus, allFiles.map((f) => f.id + f.content.length).join(',')]);

  // Unified hybrid search query executor
  const search = useCallback(
    async (query: string): Promise<SearchResult[]> => {
      if (!query.trim() || !project) return [];

      // 1. Force initialize worker immediately if the user is actively searching
      if (semanticSearchManager.getStatus() === 'idle') {
        semanticSearchManager.initialize();
      }

      // 2. Perform traditional keyword search (instant)
      const keywordMatches = traditionalSearch(query, project.fileTree);
      const keywordMap = new Map(keywordMatches.map((m) => [m.fileId, m]));

      // 3. Build baseline results
      const base = new Map<string, SearchResult>();
      for (const km of keywordMatches) {
        base.set(km.fileId, {
          fileId: km.fileId,
          fileName: km.fileName,
          excerpt: km.excerpt,
          keywordScore: km.score,
          semanticScore: null,
          rankScore: km.score * 10,
        });
      }

      // If semantic model is not ready, return traditional results immediately
      const currentStatus = semanticSearchManager.getStatus();
      if (currentStatus !== 'ready') {
        return Array.from(base.values());
      }

      // 4. Perform semantic search (asynchronous)
      const fileIds = allFiles.map((f) => f.id);
      const semanticResults = await semanticSearchManager.search(query, fileIds);

      const fileMap = new Map(allFiles.map((f) => [f.id, f]));
      for (const r of semanticResults) {
        const file = fileMap.get(r.fileId);
        if (!file) continue;

        const existing = base.get(r.fileId);
        const kw = keywordMap.get(r.fileId);
        const semanticWeight = r.score * 100;
        const keywordWeight  = (kw?.score ?? 0) * 10;

        if (existing) {
          existing.semanticScore = r.score;
          existing.rankScore     = keywordWeight + semanticWeight;
        } else if (r.score > 0.35) {
          // Include highly relevant semantic-only results
          base.set(r.fileId, {
            fileId: r.fileId,
            fileName: file.name,
            excerpt: file.content.slice(0, 120).replace(/\n+/g, ' ').trim() + '...',
            keywordScore: 0,
            semanticScore: r.score,
            rankScore: semanticWeight,
          });
        }
      }

      return Array.from(base.values()).sort((a, b) => b.rankScore - a.rankScore);
    },
    [project, allFiles]
  );

  return { search, workerStatus };
}
