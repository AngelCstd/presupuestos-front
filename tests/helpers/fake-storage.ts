import type { DraftStorage } from '@/features/capture/stores/draft-store';

/** Storage en memoria para testear el ciclo del borrador sin sessionStorage real. */
export function createFakeStorage(): DraftStorage {
  const data = new Map<string, string>();
  return {
    getItem: (key) => (data.has(key) ? (data.get(key) ?? null) : null),
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
}
