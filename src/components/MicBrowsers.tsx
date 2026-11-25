import type { ReactElement } from 'react';
import { currentBrowser, type BrowserId } from '../lib/speech';

/* Hand-drawn, simplified browser marks (not the official artwork), 24×24. */
const LOGOS: Record<Exclude<BrowserId, 'other'>, ReactElement> = {
  chrome: (
    <>
      <path d="M12 12 2.47 6.5A11 11 0 0 1 21.53 6.5z" fill="#EA4335" />
      <path d="M12 12 21.53 6.5A11 11 0 0 1 12 23z" fill="#FBBC04" />
      <path d="M12 12 12 23A11 11 0 0 1 2.47 6.5z" fill="#34A853" />
      <circle cx="12" cy="12" r="5.3" fill="#FFFFFF" />
      <circle cx="12" cy="12" r="4.1" fill="#4285F4" />
    </>
  ),
  edge: (
    <>
      <defs>
        <linearGradient id="mb-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#35C1F1" /><stop offset=".55" stopColor="#1171D6" /><stop offset="1" stopColor="#3BD171" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#mb-edge)" />
      <path d="M5.2 13.2C5.6 8.6 9 6 12.6 6c3.5 0 6 2.3 6 5 0 1.8-1.4 3-3.4 3H9.6c.4 2.3 2.4 3.8 5 3.8 1.5 0 2.8-.4 3.9-1.1"
        fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  safari: (
    <>
      <defs>
        <linearGradient id="mb-safari" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1AD6FF" /><stop offset="1" stopColor="#1E5BF0" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11" fill="url(#mb-safari)" />
      <circle cx="12" cy="12" r="8.6" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="1 1.7" opacity=".85" />
      <path d="M12 12 17.3 6.7 13.4 13.4z" fill="#FF3B30" />
      <path d="M12 12 6.7 17.3 10.6 10.6z" fill="#FFFFFF" />
    </>
  ),
  firefox: (
    <>
      <defs>
        <linearGradient id="mb-firefox" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD43B" /><stop offset=".45" stopColor="#FF6A2C" /><stop offset="1" stopColor="#E2245C" />
        </linearGradient>
      </defs>
      <circle cx="12.6" cy="11.4" r="7.2" fill="#7B3FE4" />
      <path d="M3.2 9.8C4.3 5.3 8.4 2 12.8 2.4c-1.6 1-2.4 2.3-2.5 3.6 3.6-.5 7.4 1.6 8.1 5.5.8 4.6-2.7 8.6-7.3 8.6-3.3 0-6-2.1-6.9-4.9 1.8 1.6 4.6 2 6.6.6 2-1.4 2.2-4 .4-5.4C9 9 6.5 9.6 5.4 11.6c-.5-.8-.6-1.8-.4-2.8-.6.2-1.2.6-1.8 1z"
        fill="url(#mb-firefox)" />
    </>
  ),
  brave: (
    <>
      <defs>
        <linearGradient id="mb-brave" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF7A1A" /><stop offset="1" stopColor="#FF3A12" />
        </linearGradient>
      </defs>
      <path d="M12 1.8 16.4 3l2.6 2.6-.9 3.2 1.1 2.1-1.9 7-5.3 4.3-5.3-4.3-1.9-7 1.1-2.1L4.9 5.6 7.6 3z" fill="url(#mb-brave)" />
      <path d="M8.2 9.6 10.4 11l-.7 2.5 2.3 1.8 2.3-1.8-.7-2.5 2.2-1.4" fill="none" stroke="#FFFFFF" strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
};

const NAMES: Record<Exclude<BrowserId, 'other'>, string> = {
  chrome: 'Chrome', edge: 'Edge', safari: 'Safari', firefox: 'Firefox', brave: 'Brave',
};
const LIST: { id: Exclude<BrowserId, 'other'>; ok: boolean }[] = [
  { id: 'chrome', ok: true }, { id: 'edge', ok: true }, { id: 'safari', ok: true },
  { id: 'brave', ok: false }, { id: 'firefox', ok: false },
];

/**
 * Which browsers can use the on-page mic, shown as a row of tilted browser "stickers" instead of a sentence:
 * a green tick on the ones that work, greyed with a red cross on the ones that don't, and a bouncing marker
 * over the browser being used right now.
 */
export function MicBrowsers() {
  const me = currentBrowser();
  const yes = LIST.filter((b) => b.ok).map((b) => NAMES[b.id]).join(', ');
  const no = LIST.filter((b) => !b.ok).map((b) => NAMES[b.id]).join(', ');
  return (
    <div className="mb" role="img" aria-label={'ไมค์บนเว็บใช้ได้ใน ' + yes + ' แต่ใช้ไม่ได้ใน ' + no + (me !== 'other' ? ' ตอนนี้คุณใช้ ' + NAMES[me] : '')}>
      <span className="mb-mic" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
        </svg>
      </span>
      <span className="mb-dots" aria-hidden="true" />
      {LIST.map((b, i) => (
        <span key={b.id} className={'mb-st' + (b.ok ? ' is-ok' : ' is-no') + (b.id === me ? ' is-me' : '')}
          style={{ ['--i' as string]: i }} title={NAMES[b.id] + (b.ok ? ' ✓' : ' ✗')} aria-hidden="true">
          {b.id === me ? <span className="mb-here" /> : null}
          <svg className="mb-logo" viewBox="0 0 24 24">{LOGOS[b.id]}</svg>
          <span className="mb-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              {b.ok ? <path d="M5 12.5 10 17.5 19.5 7" /> : <path d="M7 7l10 10M17 7 7 17" />}
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}
