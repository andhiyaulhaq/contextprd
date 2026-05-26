import { get, set, del } from 'idb-keyval';
import { createJSONStorage } from 'zustand/middleware';

/**
 * A shared IndexedDB-backed storage adapter for Zustand's `persist` middleware.
 * Uses `idb-keyval` as a lightweight promise-based wrapper over the native
 * IndexedDB API, replacing the synchronous `localStorage` default.
 *
 * Benefits over localStorage:
 * - Storage ceiling: gigabytes (vs. 5MB hard limit)
 * - Async: does not block the main UI thread
 */
export const idbStorage = createJSONStorage(() => ({
  getItem: (name: string): Promise<string | null> =>
    get<string>(name).then((val) => val ?? null),
  setItem: (name: string, value: string) => set(name, value),
  removeItem: (name: string) => del(name),
}));
