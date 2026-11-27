import { useEffect, useId, useRef, useState } from 'react';
import { useProgress } from '../state/progress';
import { canSpeak, hasAccent, onVoicesChanged, previewAccent, type Accent } from '../lib/speech';

/**
 * Accent of the reading voice, as a chip in the lobby under the level bar (owner picked design 4 of 6, Nov 2026).
 * Tapping it opens a small menu; picking one says a short sample in that accent. Accents this device has no
 * voice for are greyed out.
 */
const ACCENTS: { k: Accent; label: string }[] = [
  { k: 'us', label: 'อเมริกัน' },
  { k: 'uk', label: 'บริทิช' },
  { k: 'au', label: 'ออสเตรเลีย' },
  { k: 'in', label: 'อินเดีย' },
  { k: 'auto', label: 'อัตโนมัติ' },
];

const JACK = (
  <>
    <rect width="60" height="40" fill="#22408F" />
    <path d="M0 0L60 40M60 0L0 40" stroke="#FFFFFF" strokeWidth="8" />
    <path d="M0 0L60 40M60 0L0 40" stroke="#C8313E" strokeWidth="2.6" />
    <path d="M30 0V40M0 20H60" stroke="#FFFFFF" strokeWidth="12" />
    <path d="M30 0V40M0 20H60" stroke="#C8313E" strokeWidth="7" />
  </>
);
const STARS_US = [[5, 4], [12, 4], [19, 4], [8.5, 9], [15.5, 9], [22, 9], [5, 14], [12, 14], [19, 14], [8.5, 18.5], [15.5, 18.5]];

export function AccentFlag({ k }: { k: Accent }) {
  if (k === 'auto') {
    return (
      <span className="ac-flag is-auto" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3z" />
        </svg>
      </span>
    );
  }
  return (
    <span className="ac-flag" aria-hidden="true">
      <svg viewBox={k === 'us' ? '8 0 40 40' : k === 'uk' || k === 'in' ? '10 0 40 40' : '0 0 40 40'} preserveAspectRatio="xMidYMid slice">
        {k === 'in' ? (
          <>
            <rect width="60" height="13.4" fill="#FF9933" />
            <rect y="13.3" width="60" height="13.4" fill="#FFFFFF" />
            <rect y="26.6" width="60" height="13.4" fill="#138808" />
            <circle cx="30" cy="20" r="5" fill="none" stroke="#0B2A8A" strokeWidth="1.2" />
            <circle cx="30" cy="20" r="1.1" fill="#0B2A8A" />
            <path d="M30 15V25M25 20H35M26.5 16.5L33.5 23.5M33.5 16.5L26.5 23.5" stroke="#0B2A8A" strokeWidth=".6" />
          </>
        ) : k === 'us' ? (
          <>
            <rect width="60" height="40" fill="#FFFFFF" />
            {[0, 2, 4, 6, 8, 10, 12].map((i) => <rect key={i} y={(i * 40) / 13} width="60" height="3.08" fill="#C8313E" />)}
            <rect width="27" height="21.5" fill="#22408F" />
            <g fill="#FFFFFF">{STARS_US.map(([x, y]) => <circle key={x + '-' + y} cx={x} cy={y} r="1.2" />)}</g>
          </>
        ) : k === 'uk' ? JACK : (
          <>
            <rect width="60" height="40" fill="#22408F" />
            <g transform="scale(.5)">{JACK}</g>
            <g fill="#FFFFFF"><circle cx="15" cy="31" r="3.4" /><circle cx="33" cy="9" r="1.6" /><circle cx="37" cy="19" r="1.6" /><circle cx="30" cy="25" r="1.6" /><circle cx="34" cy="34" r="1.6" /></g>
          </>
        )}
      </svg>
    </span>
  );
}

export function AccentChip() {
  const { state, setSettings } = useProgress();
  const [open, setOpen] = useState(false);
  const [, redraw] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const chip = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const cur = state.settings.accent;

  // voices arrive late in some browsers: redraw so the greyed-out ones are right
  useEffect(() => onVoicesChanged(() => redraw((n) => n + 1)), []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); chip.current?.focus(); } };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', key);
    // focus the chosen option so the keyboard starts there
    box.current?.querySelector<HTMLButtonElement>('.ac-opt[aria-checked="true"]')?.focus();
    return () => { document.removeEventListener('pointerdown', away); document.removeEventListener('keydown', key); };
  }, [open]);

  if (!canSpeak) return null;

  const pick = (k: Accent) => {
    setOpen(false);
    chip.current?.focus();
    setSettings({ accent: k, voiceURI: '' });
    previewAccent(k);
  };
  const moveFocus = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const opts = [...(box.current?.querySelectorAll<HTMLButtonElement>('.ac-opt:not(:disabled)') ?? [])];
    const i = opts.indexOf(document.activeElement as HTMLButtonElement);
    opts[(i + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length]?.focus();
  };
  const label = ACCENTS.find((a) => a.k === cur)?.label ?? 'อัตโนมัติ';

  return (
    <div className="ac" ref={box}>
      <button ref={chip} type="button" className="ac-chip" aria-haspopup="menu" aria-expanded={open} aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}>
        <AccentFlag k={cur} />
        <span className="ac-chip-k">สำเนียง:</span>
        <b>{label}</b>
        <svg className="ac-chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open ? (
        <div className="ac-menu" id={menuId} role="menu" aria-label="สำเนียงเสียงอ่าน" onKeyDown={moveFocus}>
          {ACCENTS.map((a) => {
            const ok = hasAccent(a.k);
            return (
              <button key={a.k} type="button" role="menuitemradio" aria-checked={cur === a.k} disabled={!ok}
                className={'ac-opt' + (cur === a.k ? ' is-on' : '')} onClick={() => pick(a.k)}>
                <AccentFlag k={a.k} />
                <span className="ac-opt-t">{a.label}{ok ? null : <small>เครื่องนี้ไม่มีเสียงนี้</small>}</span>
                {cur === a.k ? (
                  <span className="ac-tick" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
