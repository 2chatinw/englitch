import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Keypad } from './Keypad';
import { prefersReducedMotion } from '../lib/util';

/** What each key "says": a short in-game callout and its Thai meaning. */
const CALLS: Record<string, { en: string; th: string; key: string }> = {
  W: { key: 'W', en: 'Push forward!', th: 'บุกไปข้างหน้า' },
  A: { key: 'A', en: 'Flank left!', th: 'อ้อมไปทางซ้าย' },
  S: { key: 'S', en: 'Fall back!', th: 'ถอยก่อน' },
  D: { key: 'D', en: 'Go right!', th: 'ไปทางขวา' },
  Q: { key: 'Q', en: 'Use your skill!', th: 'ใช้สกิลเลย' },
  E: { key: 'E', en: 'Pick it up!', th: 'เก็บของ' },
  SPACE: { key: 'Space', en: 'Jump!', th: 'กระโดด' },
};
const AUTO = ['W', 'A', 'S', 'D', 'SPACE', 'Q', 'E'];

/**
 * Landing hero: the WASD keypad. Keys tap by themselves; visitors can also press W A S D Q E or Space on
 * their keyboard, or click a key. Each press shows the matching in-game callout with its Thai meaning.
 */
export function HeroKeys() {
  const wrap = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState('W');
  const lastUser = useRef(0);
  const bubble = useRef<HTMLDivElement>(null);

  const press = (id: string, byUser = false) => {
    if (!CALLS[id]) return;
    if (byUser) lastUser.current = Date.now();
    setCur(id);
    const key = wrap.current?.querySelector<SVGGElement>('[data-key="' + id + '"]');
    if (!key || prefersReducedMotion()) return;
    gsap.timeline()
      .to(key, { y: 9, duration: 0.07, ease: 'power2.in' })
      .to(key, { y: 0, duration: 0.2, ease: 'back.out(3)' });
  };

  // the bubble pops each time the line changes
  useEffect(() => {
    if (!bubble.current || prefersReducedMotion()) return;
    gsap.fromTo(bubble.current, { y: 10, scale: 0.9, autoAlpha: 0 }, { y: 0, scale: 1, autoAlpha: 1, duration: 0.4, ease: 'back.out(2.2)' });
  }, [cur]);

  // keys tap on their own, pausing for a while after the visitor presses one
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let i = 0;
    const id = window.setInterval(() => {
      if (Date.now() - lastUser.current < 6000) return;
      i = (i + 1) % AUTO.length;
      press(AUTO[i]);
    }, 1700);
    return () => window.clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // real keyboard: W A S D Q E and Space (not while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
      const k = e.code === 'Space' ? 'SPACE' : e.key.toUpperCase();
      if (!CALLS[k]) return;
      if (k === 'SPACE') {
        // only take over Space while the hero is on screen, so it still scrolls the page elsewhere
        const r = wrap.current?.getBoundingClientRect();
        if (!r || r.bottom < 0 || r.top > window.innerHeight || t.tagName === 'BUTTON' || t.tagName === 'A') return;
        e.preventDefault();
      }
      press(k, true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const c = CALLS[cur];
  return (
    <div className="hero-keys" ref={wrap}>
      <div className="hk-bubble" ref={bubble} aria-live="polite">
        <span className="hk-key">{c.key}</span>
        <span className="hk-line"><b>{c.en}</b><span>{c.th}</span></span>
      </div>
      <div className="hk-pad" onClick={(e) => {
        const g = (e.target as Element).closest('[data-key]');
        if (g) press(g.getAttribute('data-key')!, true);
      }}>
        <Keypad />
      </div>
      <p className="hk-hint">
        <span className="hk-hint-desk">ลองกด <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> บนคีย์บอร์ด หรือคลิกที่ปุ่ม</span>
        <span className="hk-hint-touch">แตะที่ปุ่มเพื่อดูประโยคของแต่ละปุ่ม</span>
      </p>
    </div>
  );
}
