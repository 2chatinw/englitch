import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { useAuth } from '../state/auth';
import { prefersReducedMotion } from '../lib/util';
import { DiscordMark, FacebookMark, GoogleMark } from './Login';

type Provider = 'discord' | 'facebook' | 'google';
const ITEMS: { id: Provider; label: string; mark: ReactNode }[] = [
  { id: 'discord', label: 'Discord', mark: <DiscordMark /> },
  { id: 'facebook', label: 'Facebook', mark: <FacebookMark /> },
  { id: 'google', label: 'Google', mark: <GoogleMark /> },
];

/**
 * The sign-in pill in the top bar. Tapping it unrolls a little rope ladder straight down from under the pill,
 * with the Discord, Facebook and Google badges tied on one below the other; tapping a badge signs in with it.
 */
export function SignInDrop({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { error, google, facebook, discord } = useAuth();
  const [busy, setBusy] = useState<Provider | ''>('');
  const [shown, setShown] = useState(open); // stays true while the ladder rolls back up
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  if (open && !shown) setShown(true);

  // unroll / roll up
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el || !shown) return;
    const ladder = el.querySelector<HTMLElement>('.ladder');
    if (open) {
      ladder?.classList.remove('is-swaying');
      if (prefersReducedMotion()) return;
      tl.current?.kill();
      const t = gsap.timeline({ onComplete: () => ladder?.classList.add('is-swaying') });
      el.querySelectorAll<HTMLElement>('.rung').forEach((step) => {
        // each rope section unrolls downward, then its badge pops onto the end of it
        t.fromTo(step.querySelector('.rope'), { scaleY: 0 }, { scaleY: 1, duration: 0.16, ease: 'none' })
          .fromTo(step.querySelector('.hang-badge'), { scale: 0.2, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.42, ease: 'back.out(2.6)' }, '-=0.02')
          .fromTo(step.querySelector('.hang-label'), { x: 8, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.25 }, '<0.1');
      });
      t.fromTo(el.querySelector('.drop-note'), { y: -6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3 }, '-=0.1');
      // a little bounce at the bottom of the drop, like a ladder that just fell open
      t.fromTo(ladder, { rotation: 0 }, { keyframes: { rotation: [3, -2, 1, 0] }, duration: 0.9, ease: 'sine.out' }, '-=0.5');
      tl.current = t;
    } else {
      ladder?.classList.remove('is-swaying');
      const t = tl.current;
      if (prefersReducedMotion() || !t) { setShown(false); return; }
      t.eventCallback('onReverseComplete', () => setShown(false));
      t.timeScale(2.6).reverse();
    }
  }, [open, shown]);

  useEffect(() => () => { tl.current?.kill(); }, []);

  // close on a tap outside or on Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) onOpenChange(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, onOpenChange]);

  const go = async (p: Provider) => {
    setBusy(p);
    if (p === 'discord') { discord(); return; } // leaves the page for Discord
    await (p === 'google' ? google() : facebook());
    setBusy('');
  };

  return (
    <div className="signin-drop" ref={wrap}>
      <button type="button" className={'glass-cta' + (open ? ' is-open' : '')} aria-expanded={open} aria-controls="signin-drop-panel"
        onClick={() => onOpenChange(!open)}>
        <i className="cta-cloud" aria-hidden="true"><i /></i>
        <i className="glass-stars" aria-hidden="true" />
        <span>เข้าสู่ระบบ</span>
      </button>
      {shown ? (
        <div className="drop-panel" id="signin-drop-panel" ref={panel} role="group" aria-label="เลือกวิธีเข้าสู่ระบบ">
          <div className="ladder">
            {ITEMS.map((it) => (
              <div key={it.id} className="rung">
                <span className="rope" aria-hidden="true" />
                <div className="hang">
                  <span className="hang-label" aria-hidden="true">{it.label}</span>
                  <button type="button" className={'hang-badge hang-' + it.id + (busy === it.id ? ' is-busy' : '')}
                    disabled={!!busy} onClick={() => go(it.id)} aria-label={'เข้าสู่ระบบด้วย ' + it.label}>
                    {it.mark}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="drop-note">
            {error ? <span className="drop-error" role="alert">{error}</span> : (
              <span>ไม่ต้องตั้งรหัสผ่าน · <a href="./privacy.html" target="_blank" rel="noopener">ความเป็นส่วนตัว</a></span>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
