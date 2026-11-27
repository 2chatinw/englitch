import { useSyncExternalStore } from 'react';

/**
 * Whether a category has been opened in the lobby since the app was loaded. Until then the lobby shows only
 * the eight category circles and the practice menus (side rail, bottom bar) stay hidden; a full reload resets it.
 */
let opened = false;
const subs = new Set<() => void>();

export function setCategoryOpen(on: boolean) {
  if (opened === on) return;
  opened = on;
  subs.forEach((f) => f());
}
export const isCategoryOpen = () => opened;
export function useCategoryOpen() {
  return useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f); }; }, isCategoryOpen, isCategoryOpen);
}
