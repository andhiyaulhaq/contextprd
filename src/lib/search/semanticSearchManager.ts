'use client';

import { FileNode } from '../../types/project';

export type SearchWorkerStatus = 'idle' | 'loading' | 'ready' | 'unavailable';

export interface SemanticSearchResult {
  fileId: string;
  score: number;
}

class SemanticSearchManager {
  private worker: Worker | null = null;
  private status: SearchWorkerStatus = 'idle';
  private statusListeners = new Set<(status: SearchWorkerStatus) => void>();
  private preloadTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingSearchResolve: ((value: SemanticSearchResult[]) => void) | null = null;
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Start silent background preload after 10 seconds
    if (typeof window !== 'undefined') {
      this.preloadTimer = setTimeout(() => {
        this.initialize();
      }, 10000);
    }
  }

  public addStatusListener(listener: (status: SearchWorkerStatus) => void) {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private setStatus(newStatus: SearchWorkerStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((l) => l(newStatus));
  }

  public getStatus(): SearchWorkerStatus {
    return this.status;
  }

  /**
   * Initializes the Web Worker immediately.
   * Clears the preload timer if it was pending.
   */
  public initialize() {
    if (this.worker || this.status === 'loading' || this.status === 'ready') {
      return;
    }

    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer);
      this.preloadTimer = null;
    }

    this.setStatus('loading');

    try {
      this.worker = new Worker(
        new URL('./semanticWorker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = (event: MessageEvent<{ type: string; payload?: any }>) => {
        const { type, payload } = event.data;

        if (type === 'READY') {
          this.setStatus('ready');
        } else if (type === 'SEARCH_RESULT') {
          if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
          }
          if (this.pendingSearchResolve) {
            this.pendingSearchResolve(payload.results);
            this.pendingSearchResolve = null;
          }
        } else if (type === 'SEARCH_ERROR' || type === 'ERROR') {
          console.error('[Semantic Search Error]:', payload);
          if (this.pendingSearchResolve) {
            this.pendingSearchResolve([]);
            this.pendingSearchResolve = null;
          }
        }
      };

      this.worker.onerror = (err) => {
        console.error('[Semantic Worker Error]:', err);
        this.setStatus('unavailable');
      };

      this.worker.postMessage({ type: 'INIT' });
    } catch (err) {
      console.error('[Semantic Worker Init Failed]:', err);
      this.setStatus('unavailable');
    }
  }

  public encodeFiles(files: { id: string; name: string; content: string }[]) {
    if (this.status !== 'ready' || !this.worker) return;
    this.worker.postMessage({
      type: 'ENCODE_FILES',
      payload: { files },
    });
  }

  public search(query: string, fileIds: string[]): Promise<SemanticSearchResult[]> {
    return new Promise((resolve) => {
      // Force init if not done yet
      if (this.status === 'idle') {
        this.initialize();
      }

      if (this.status !== 'ready' || !this.worker) {
        resolve([]);
        return;
      }

      // Handle outstanding search resolves (if any)
      if (this.pendingSearchResolve) {
        this.pendingSearchResolve([]);
      }

      this.pendingSearchResolve = resolve;

      this.worker.postMessage({
        type: 'SEARCH',
        payload: { query, fileIds },
      });

      // 5 second fallback timeout
      this.searchTimeout = setTimeout(() => {
        if (this.pendingSearchResolve) {
          this.pendingSearchResolve([]);
          this.pendingSearchResolve = null;
        }
      }, 5000);
    });
  }

  public terminate() {
    if (this.preloadTimer) {
      clearTimeout(this.preloadTimer);
    }
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.status = 'idle';
  }
}

// Export a singleton instance
export const semanticSearchManager = new SemanticSearchManager();
