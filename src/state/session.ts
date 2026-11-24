import { useCallback, useState } from 'react';

/**
 * State that survives switching pages (a quiz round, the card queue) but not a reload.
 * Each page keeps its in-progress session here so leaving and coming back resumes it.
 */
const store = new Map<string, unknown>();

export function useSession<T>(key: string, init: () => T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (!store.has(key)) store.set(key, init());
    return store.get(key) as T;
  });
  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      store.set(key, v);
      return v;
    });
  }, [key]);
  return [value, set];
}

export function clearSessions() { store.clear(); }
