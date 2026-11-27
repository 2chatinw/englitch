import { useSyncExternalStore } from 'react';
import type { IconName } from '../components/Icon';

export const ROUTES = ['today', 'listen', 'speak', 'read', 'write'] as const;
export type Route = (typeof ROUTES)[number];

export const PAGES: Record<Route, { th: string; short: string; en: string; icon: IconName }> = {
  today: { th: 'ล็อบบี้วันนี้', short: 'วันนี้', en: 'Lobby', icon: 'home' },
  listen: { th: 'ฝึกฟัง', short: 'ฟัง', en: 'Listen', icon: 'headphones' },
  speak: { th: 'ฝึกพูด', short: 'พูด', en: 'Speak', icon: 'mic' },
  read: { th: 'ฝึกอ่าน', short: 'อ่าน', en: 'Read', icon: 'book' },
  write: { th: 'ฝึกเขียน', short: 'เขียน', en: 'Write', icon: 'pen' },
};

/** Old links: pages that were removed (quiz, cards, the AI chat). */
const MOVED: Record<string, Route> = { quiz: 'read', cards: 'today', chat: 'today' };

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(h) ? (h as Route) : MOVED[h] ?? 'today';
}
function subscribe(fn: () => void) {
  window.addEventListener('hashchange', fn);
  return () => window.removeEventListener('hashchange', fn);
}
export function useRoute(): Route {
  return useSyncExternalStore(subscribe, parse, () => 'today');
}
export function navigate(r: Route) {
  if (parse() !== r || !window.location.hash) window.location.hash = r;
}
