import { useProgress } from '../state/progress';

const RAYS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const long = i % 2 === 0;
  const r1 = 15.5, r2 = long ? 21 : 19;
  return { x1: 32 + Math.cos(a) * r1, y1: 27 + Math.sin(a) * r1, x2: 32 + Math.cos(a) * r2, y2: 27 + Math.sin(a) * r2 };
});

/** Daytime badge: smiling sun over a little cloud on a sky-blue disc. */
function DayBadge() {
  return (
    <svg className="tt-badge tt-day" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="tt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#9BD8FF" />
          <stop offset="1" stopColor="#3FA7F3" />
        </linearGradient>
        <clipPath id="tt-clip-day"><circle cx="32" cy="32" r="32" /></clipPath>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#tt-sky)" />
      <g clipPath="url(#tt-clip-day)">
        <g className="tt-rays" stroke="#FFD84D" strokeWidth="2.6" strokeLinecap="round">
          {RAYS.map((r, i) => <line key={i} x1={r.x1} y1={r.y1} x2={r.x2} y2={r.y2} />)}
        </g>
        <circle cx="32" cy="27" r="12.5" fill="#FFE36E" stroke="#F6C42F" strokeWidth="1.2" />
        <circle cx="27.6" cy="25.4" r="1.4" fill="#5B3B16" />
        <circle cx="36.4" cy="25.4" r="1.4" fill="#5B3B16" />
        <ellipse cx="25" cy="29.6" rx="2.2" ry="1.3" fill="#FF9DA6" opacity=".85" />
        <ellipse cx="39" cy="29.6" rx="2.2" ry="1.3" fill="#FF9DA6" opacity=".85" />
        <path d="M27.8 30.2 Q32 34.6 36.2 30.2" fill="none" stroke="#5B3B16" strokeWidth="1.5" strokeLinecap="round" />
        <g className="tt-cloud">
          <g fill="#D6ECFB" transform="translate(0 1.6)">
            <circle cx="22" cy="49" r="6.5" /><circle cx="30.5" cy="45.5" r="8.5" /><circle cx="40.5" cy="48.5" r="6.5" />
            <rect x="14" y="48" width="34" height="8" rx="4" />
          </g>
          <g fill="#FFFFFF">
            <circle cx="22" cy="49" r="6.5" /><circle cx="30.5" cy="45.5" r="8.5" /><circle cx="40.5" cy="48.5" r="6.5" />
            <rect x="14" y="48" width="34" height="8" rx="4" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Night badge: a sleeping crescent moon, a few z's and twinkling stars on a navy disc. */
function NightBadge() {
  return (
    <svg className="tt-badge tt-night" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <radialGradient id="tt-dusk" cx=".35" cy=".3" r=".8">
          <stop offset="0" stopColor="#3E4FC4" />
          <stop offset="1" stopColor="#1A2268" />
        </radialGradient>
        <mask id="tt-crescent">
          <rect width="64" height="64" fill="#fff" />
          <circle cx="27" cy="24.5" r="13.5" fill="#000" />
        </mask>
      </defs>
      <circle cx="32" cy="32" r="32" fill="url(#tt-dusk)" />
      <g className="tt-stars" fill="#FFE9A3">
        <path d="M14 15l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z" />
        <path d="M50 12l.8 1.8 1.8.8-1.8.8-.8 1.8-.8-1.8-1.8-.8 1.8-.8z" />
        <path d="M54 30l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z" />
        <path d="M18 49l.7 1.5 1.5.7-1.5.7-.7 1.5-.7-1.5-1.5-.7 1.5-.7z" />
        <circle cx="44" cy="54" r="1" /><circle cx="9" cy="33" r=".9" /><circle cx="38" cy="8" r=".9" />
      </g>
      <g mask="url(#tt-crescent)">
        <circle cx="34.5" cy="32" r="16" fill="#FFE36E" stroke="#F6C42F" strokeWidth="1.2" />
      </g>
      <path d="M37.6 34.6 Q40 36.6 42.4 34.4" fill="none" stroke="#5B3B16" strokeWidth="1.4" strokeLinecap="round" />
      <ellipse cx="44.6" cy="38.4" rx="2" ry="1.2" fill="#FF9DA6" opacity=".85" />
      <path d="M39.4 40.6 Q42 42.6 44.6 40.8" fill="none" stroke="#5B3B16" strokeWidth="1.4" strokeLinecap="round" />
      <g className="tt-zzz" fill="none" stroke="#E6EBFF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 31h3.4l-3.4 4h3.4" />
        <path d="M19.6 26h2.8l-2.8 3.3h2.8" />
        <path d="M23.4 21.6h2.2l-2.2 2.6h2.2" />
      </g>
    </svg>
  );
}

/** Day/night switch: shows the sky you're in now; tap to swap it. */
export function ThemeToggle() {
  const { state, setSettings } = useProgress();
  const isDark = state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <button type="button" className={'theme-toggle' + (isDark ? ' is-dark' : '')}
      aria-label={isDark ? 'ตอนนี้ธีมมืด กดเพื่อเปลี่ยนเป็นธีมสว่าง' : 'ตอนนี้ธีมสว่าง กดเพื่อเปลี่ยนเป็นธีมมืด'}
      title={isDark ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
      onClick={() => setSettings({ theme: isDark ? 'light' : 'dark' })}>
      <DayBadge />
      <NightBadge />
    </button>
  );
}
