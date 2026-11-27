import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Keypad } from './Keypad';
import { prefersReducedMotion, pick } from '../lib/util';
import { GROUPS, PHRASES, type Group, type Phrase } from '../data/content';

/** The keypad's keys (by position id) and the category each one stands for; `letter` is what is printed on it. */
const KEYMAP: Record<string, { group: Group; letter: string }> = {
  Q: { group: 'general', letter: 'E' },
  W: { group: 'travel', letter: 'T' },
  E: { group: 'gaming', letter: 'G' },
  A: { group: 'business', letter: 'B' },
  S: { group: 'academic', letter: 'A' },
  D: { group: 'entertainment', letter: 'P' },
  SPACE: { group: 'esp', letter: 'Jobs' },
};
const BY_LETTER: Record<string, string> = Object.fromEntries(
  Object.entries(KEYMAP).filter(([id]) => id !== 'SPACE').map(([id, k]) => [k.letter, id]),
);
const AUTO = ['Q', 'W', 'E', 'A', 'S', 'D', 'SPACE'];

// short, friendly examples only (no slang abbreviations), so the bubble stays readable
const SAMPLES: Record<Group, Phrase[]> = Object.fromEntries(
  (Object.keys(GROUPS) as Group[]).map((g) => [g, PHRASES.filter((p) => p.g === g && p.c !== 'slang' && p.e.length <= 34)]),
) as Record<Group, Phrase[]>;

/**
 * Landing hero: a keypad with one key per category. Keys tap by themselves; visitors can also press
 * the letters on their keyboard (E T G B A P, Space) or click a key. Each press shows a real sentence
 * from that category with its Thai meaning.
 */
export function HeroKeys() {
  const wrap = useRef<HTMLDivElement>(null);
  const [cur, setCur] = useState<{ id: string; p: Phrase }>(() => ({ id: 'Q', p: SAMPLES.general[0] }));
  const lastUser = useRef(0);
  const bubble = useRef<HTMLDivElement>(null);

  const press = (id: string, byUser = false) => {
    const k = KEYMAP[id];
    if (!k) return;
    if (byUser) lastUser.current = Date.now();
    setCur({ id, p: pick(SAMPLES[k.group]) });
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
    }, 2200);
    return () => window.clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // real keyboard: the printed letters and Space (not while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable) return;
      const id = e.code === 'Space' ? 'SPACE' : BY_LETTER[e.key.toUpperCase()];
      if (!id) return;
      if (id === 'SPACE') {
        // only take over Space while the hero is on screen, so it still scrolls the page elsewhere
        const r = wrap.current?.getBoundingClientRect();
        if (!r || r.bottom < 0 || r.top > window.innerHeight || t.tagName === 'BUTTON' || t.tagName === 'A') return;
        e.preventDefault();
      }
      press(id, true);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const k = KEYMAP[cur.id];
  const g = GROUPS[k.group];
  return (
    <div className="hero-keys" ref={wrap}>
      <div className="hk-bubble" ref={bubble} aria-live="polite">
        <span className="hk-key" title={g.th}>{k.letter}</span>
        <span className="hk-line">
          <small className="hk-cat">{g.icon} {g.th}</small>
          <b>{cur.p.e}</b><span>{cur.p.t}</span>
        </span>
      </div>
      <div className="hk-pad" onClick={(e) => {
        const el = (e.target as Element).closest('[data-key]');
        if (el) press(el.getAttribute('data-key')!, true);
      }}>
        <Keypad />
      </div>
      <p className="hk-hint">
        <span className="hk-hint-desk">ลองกด <kbd>E</kbd> <kbd>T</kbd> <kbd>G</kbd> <kbd>B</kbd> <kbd>A</kbd> <kbd>P</kbd> บนคีย์บอร์ด หรือคลิกที่ปุ่ม</span>
        <span className="hk-hint-touch">แตะที่ปุ่มเพื่อดูตัวอย่างประโยคของแต่ละหมวด</span>
      </p>
    </div>
  );
}
