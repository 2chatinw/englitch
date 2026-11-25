import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { useAuth } from '../state/auth';
import { prefersReducedMotion } from '../lib/util';
import { DiscordMark, FacebookMark, GoogleMark } from './Login';

type Provider = 'discord' | 'facebook' | 'google';
const ITEMS: { id: Provider; label: string; mark: ReactNode; len: number; tilt: number }[] = [
  { id: 'discord', label: 'Discord', mark: <DiscordMark />, len: 22, tilt: -22 },
  { id: 'facebook', label: 'Facebook', mark: <FacebookMark />, len: 46, tilt: 16 },
  { id: 'google', label: 'Google', mark: <GoogleMark />, len: 32, tilt: -14 },
];

/**
 * The sign-in pill in the top bar. Tapping it lets the three sign-in badges (Discord, Facebook, Google)
 * drop down on little strings and swing into place underneath; tapping a badge signs in with that service.
 */
export function SignInDrop({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { error, google, facebook, discord } = useAuth();
  const [busy, setBusy] = useState<Provider | ''>('');
  const [shown, setShown] = useState(open); // stays true while the badges are pulled back up
  const wrap = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  if (open && !shown) setShown(true);

  // drop in / pull up
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el || !shown) return;
    const hangs = el.querySelectorAll<HTMLElement>('.hang');
    const extras = el.querySelectorAll<HTMLElement>('.drop-rail, .drop-note');
    const still = prefersReducedMotion();
    gsap.killTweensOf([hangs, extras]);
    if (open) {
      hangs.forEach((h) => h.classList.remove('is-swaying'));
      if (still) { gsap.set([hangs, extras], { clearProps: 'all' }); return; }
      gsap.fromTo(el.querySelector('.drop-rail'), { scaleX: 0, autoAlpha: 0 }, { scaleX: 1, autoAlpha: 1, duration: 0.3, ease: 'power2.out' });
      gsap.fromTo(hangs,
        { y: -64, autoAlpha: 0, rotation: (i: number) => ITEMS[i].tilt },
        {
          y: 0, autoAlpha: 1, rotation: 0, duration: 1.25, ease: 'elastic.out(1, 0.32)', stagger: 0.13, delay: 0.08,
          onComplete: () => hangs.forEach((h) => h.classList.add('is-swaying')),
        });
      gsap.fromTo(el.querySelector('.drop-note'), { y: -6, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, delay: 0.55 });
    } else {
      hangs.forEach((h) => h.classList.remove('is-swaying'));
      if (still) { setShown(false); return; }
      gsap.to(el.querySelector('.drop-note'), { autoAlpha: 0, duration: 0.15 });
      gsap.to(hangs, {
        y: -48, autoAlpha: 0, rotation: (i: number) => -ITEMS[i].tilt / 2, duration: 0.26, ease: 'power2.in',
        stagger: { each: 0.05, from: 'end' },
      });
      gsap.to(el.querySelector('.drop-rail'), { scaleX: 0, autoAlpha: 0, duration: 0.2, delay: 0.2, onComplete: () => setShown(false) });
    }
  }, [open, shown]);

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
          <span className="drop-rail" aria-hidden="true" />
          <div className="drop-hangs">
            {ITEMS.map((it, i) => (
              <div key={it.id} className="hang" style={{ ['--len' as string]: it.len + 'px', ['--sway-delay' as string]: (-i * 0.7) + 's' }}>
                <span className="hang-string" aria-hidden="true" />
                <button type="button" className={'hang-badge hang-' + it.id + (busy === it.id ? ' is-busy' : '')}
                  disabled={!!busy} onClick={() => go(it.id)} aria-label={'เข้าสู่ระบบด้วย ' + it.label}>
                  {it.mark}
                </button>
                <span className="hang-label" aria-hidden="true">{it.label}</span>
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
