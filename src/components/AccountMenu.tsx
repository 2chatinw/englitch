import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Icon } from './Icon';
import { Avatar, PROVIDER } from './Account';
import { useAuth } from '../state/auth';
import { useProgress } from '../state/progress';
import { useToast } from '../state/toast';
import { prefersReducedMotion } from '../lib/util';

const Chevron = () => (
  <svg className="acct-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);
const Moon = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></svg>
);
const Sun = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" /></svg>
);
const Logout = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    strokeLinejoin="round" aria-hidden="true"><path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15" /></svg>
);
const User = () => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
    aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
);

/**
 * Signed-in account pill (avatar + chevron) with a drop-down, after the scholarship site's user menu:
 * name first, then account, settings and theme, and a red sign-out last.
 * Opens with a small GSAP pop; Escape, Tab, a click outside or picking an item closes it; arrow keys move between items.
 */
export function AccountMenu({ onAccount, onSettings }: { onAccount: () => void; onSettings: () => void }) {
  const auth = useAuth();
  const { state, setSettings } = useProgress();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const focusFirst = useRef(false);
  const closing = useRef(false);

  const items = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []).filter((el) => el.offsetParent !== null);

  const close = (refocus = false) => {
    const el = menu.current;
    if (!open || closing.current) return;
    if (refocus) btn.current?.focus();
    if (!el || prefersReducedMotion()) { setOpen(false); return; }
    closing.current = true;
    const done = () => {
      if (!closing.current) return;
      closing.current = false;
      gsap.killTweensOf(el);
      setOpen(false);
    };
    gsap.to(el, { autoAlpha: 0, y: -6, scale: 0.96, duration: 0.14, ease: 'power2.in', onComplete: done });
    window.setTimeout(done, 200); // in case animation frames are paused (background tab)
  };

  // pop in, and put focus on the first item when it was opened from the keyboard
  useLayoutEffect(() => {
    const el = menu.current;
    if (!open || !el) return;
    if (focusFirst.current) { items()[0]?.focus(); focusFirst.current = false; }
    if (prefersReducedMotion()) { gsap.set(el, { autoAlpha: 1, y: 0, scale: 1 }); return; }
    gsap.fromTo(el, { autoAlpha: 0, y: -6, scale: 0.96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' });
  }, [open]);

  // close on a click outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  });

  const u = auth.user;
  if (!u) return null; // the app only shows after sign-in

  const isDark = state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close();
    else if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus(); }
  };

  const pick = (fn: () => void) => () => { close(true); fn(); };

  return (
    <div className="acct" ref={wrap}>
      <button type="button" className="acct-btn" ref={btn} aria-haspopup="menu" aria-expanded={open} aria-controls="acct-menu"
        aria-label={'บัญชีของ ' + u.name}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); focusFirst.current = true; setOpen(true); }
          else if (open && e.key === 'Escape') { e.preventDefault(); close(true); }
          else if (open && e.key === 'ArrowDown') { e.preventDefault(); items()[0]?.focus(); }
        }}>
        <Avatar name={u.name} photo={u.photo} size={36} />
        <Chevron />
      </button>
      {open ? (
        <div className="acct-menu" id="acct-menu" role="menu" aria-label="เมนูบัญชี" ref={menu} onKeyDown={onMenuKey}>
          <button type="button" role="menuitem" className="acct-item acct-head" onClick={pick(onAccount)}>
            <Avatar name={u.name} photo={u.photo} size={40} />
            <span className="acct-id">
              <b>{u.name}</b>
              <small>เข้าด้วย {PROVIDER[u.provider] || 'บัญชี'}</small>
            </span>
          </button>
          <hr className="acct-sep" />
          <button type="button" role="menuitem" className="acct-item" onClick={pick(onAccount)}>
            <User /><span>บัญชีของฉัน</span>
          </button>
          <button type="button" role="menuitem" className="acct-item" onClick={pick(onSettings)}>
            <Icon name="sliders" /><span>ตั้งค่า</span>
          </button>
          <button type="button" role="menuitem" className="acct-item acct-theme" onClick={() => setSettings({ theme: isDark ? 'light' : 'dark' })}>
            {isDark ? <Sun /> : <Moon />}<span>{isDark ? 'โหมดกลางวัน' : 'โหมดกลางคืน'}</span>
          </button>
          <hr className="acct-sep" />
          <button type="button" role="menuitem" className="acct-item acct-out" onClick={pick(async () => {
            try { await auth.signOut(); toast('ออกจากระบบแล้ว'); }
            catch { toast('ออกจากระบบไม่สำเร็จ ลองใหม่อีกครั้ง'); }
          })}>
            <Logout /><span>ออกจากระบบ</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
