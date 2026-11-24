import { useSyncExternalStore } from 'react';
import type { IconName } from '../components/Icon';

export const ROUTES = ['today', 'cards', 'listen', 'speak', 'quiz', 'chat'] as const;
export type Route = (typeof ROUTES)[number];

export const PAGES: Record<Route, { th: string; short: string; en: string; icon: IconName }> = {
  today: { th: 'ล็อบบี้วันนี้', short: 'วันนี้', en: 'Lobby', icon: 'home' },
  cards: { th: 'การ์ดคำศัพท์', short: 'การ์ด', en: 'Flashcards', icon: 'cards' },
  listen: { th: 'ฝึกฟัง', short: 'ฟัง', en: 'Listen', icon: 'headphones' },
  speak: { th: 'ฝึกพูด', short: 'พูด', en: 'Speak', icon: 'mic' },
  quiz: { th: 'ควิซสถานการณ์', short: 'ควิซ', en: 'Quiz', icon: 'target' },
  chat: { th: 'คุยกับ AI', short: 'แชต', en: 'Chat', icon: 'chat' },
};

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  return (ROUTES as readonly string[]).includes(h) ? (h as Route) : 'today';
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
