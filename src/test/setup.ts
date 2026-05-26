import '@testing-library/jest-dom';
import { vi } from 'vitest';

const store = new Map<string, any>();

vi.mock('idb-keyval', () => ({
  get: vi.fn((key) => Promise.resolve(store.get(key))),
  set: vi.fn((key, value) => {
    store.set(key, value);
    return Promise.resolve();
  }),
  del: vi.fn((key) => {
    store.delete(key);
    return Promise.resolve();
  }),
  clear: vi.fn(() => {
    store.clear();
    return Promise.resolve();
  }),
}));
