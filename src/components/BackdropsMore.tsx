import { useEffect, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../lib/util';

/* Backdrops 6–15. Same contract as Backdrop.tsx: fixed, behind content, one moving detail each. */

const PASTELS = ['#FFC7DA', '#D6CCFF', '#BFEBDC', '#FFDDB0', '#C4DFFF', '#FFF1A8'];
const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** 6 · Cotton candy: soft colour mesh whose hues slowly cycle. */
export function Cotton() {
  return <div className="bd bd-cotton"><span className="bd-cotton-mesh" /></div>;
}

/** 7 · Layered pastel waves rolling along the bottom. */
export function Waves() {
  return (
    <div className="bd bd-waves">
      <span className="bd-wave w1" />
      <span className="bd-wave w2" />
      <span className="bd-wave w3" />
    </div>
  );
}

/** 8 · Confetti drifting down. */
export function Confetti() {
  const [bits] = useState(() => Array.from({ length: 36 }, (_, i) => ({
    id: i, left: rand(0, 100), w: rand(6, 11), h: rand(10, 18), dur: rand(12, 24), delay: -rand(0, 24),
    color: PASTELS[i % PASTELS.length], round: i % 4 === 0,
  })));
  return (
    <div className="bd bd-confetti">
      {bits.map((b) => (
        <span key={b.id} className={'bd-bit' + (b.round ? ' round' : '')}
          style={{ left: b.left + '%', width: b.w, height: b.round ? b.w : b.h, background: b.color, animationDuration: b.dur + 's', animationDelay: b.delay + 's' }} />
      ))}
    </div>
  );
}

/** 9 · Pale dusk with twinkling stars and an occasional shooting star. */
export function Stars() {
  const [stars] = useState(() => Array.from({ length: 42 }, (_, i) => ({
    id: i, left: rand(0, 100), top: rand(0, 100), size: rand(6, 16), delay: -rand(0, 4), dur: rand(2.4, 4.5),
    color: PASTELS[i % 5],
  })));
  return (
    <div className="bd bd-stars">
      {stars.map((s) => (
        <span key={s.id} className="bd-star" style={{ left: s.left + '%', top: s.top + '%', width: s.size, height: s.size, background: s.color, animationDelay: s.delay + 's', animationDuration: s.dur + 's' }} />
      ))}
      <span className="bd-shoot" />
      <span className="bd-shoot s2" />
    </div>
  );
}

/** 10 · Picnic gingham with a slow diagonal shimmer. */
export function Gingham() {
  return <div className="bd bd-gingham"><span className="bd-shimmer" /></div>;
}

/** 11 · Floating gamer keycaps that tap themselves now and then. */
const KEYS: [string, string, string, string][] = [
  ['W', '8.5%', '70%', '#FFC7DA'], ['A', '3%', '82%', '#D6CCFF'], ['S', '8.5%', '82%', '#BFEBDC'], ['D', '14%', '82%', '#FFDDB0'],
  ['E', '86%', '14%', '#C4DFFF'], ['N', '92%', '30%', '#FFC7DA'], ['G', '84%', '62%', '#D6CCFF'], ['Q', '90%', '80%', '#BFEBDC'],
  ['Esc', '44%', '88%', '#FFF1A8'], ['Tab', '62%', '6%', '#FFDDB0'],
];
export function Keycaps() {
  const ref = useRef<HTMLDivElement>(null);
  useParallax(ref, '.bd-key', 14);
  return (
    <div className="bd bd-keys" ref={ref}>
      {KEYS.map(([k, l, t, c], i) => (
        <span key={k} className="bd-key" data-depth={(i % 3) + 1} style={{ left: l, top: t, ['--key' as string]: c, animationDelay: -i * 0.9 + 's' }}>
          <b>{k}</b>
        </span>
      ))}
    </div>
  );
}

/** 12 · Chat bubbles with gamer phrases rising like balloons. */
const PHRASES = ['Hi!', 'gg', 'lol', 'brb', 'ty', 'np', 'Nice!', 'wp', 'glhf', "Let's go!", 'OMG', 'You too!'];
export function Talk() {
  const [items] = useState(() => PHRASES.map((t, i) => ({
    id: i, text: t, left: rand(2, 88), dur: rand(18, 30), delay: -rand(0, 30), color: PASTELS[i % PASTELS.length], flip: i % 2 === 0,
  })));
  return (
    <div className="bd bd-talk">
      {items.map((b) => (
        <span key={b.id} className={'bd-say' + (b.flip ? ' flip' : '')}
          style={{ left: b.left + '%', background: b.color, ['--tail' as string]: b.color, animationDuration: b.dur + 's', animationDelay: b.delay + 's' }}>{b.text}</span>
      ))}
    </div>
  );
}

/** 13 · Big crisp blobs that slowly morph their shape. */
export function Morph() {
  return (
    <div className="bd bd-morph">
      <span className="bd-goo g1" />
      <span className="bd-goo g2" />
      <span className="bd-goo g3" />
    </div>
  );
}

/** 14 · A grid of dots with a diagonal ripple running through it. */
export function DotWave() {
  const cols = 22, rows = 14;
  const [dots] = useState(() => Array.from({ length: cols * rows }, (_, i) => ({ i, x: i % cols, y: Math.floor(i / cols) })));
  return (
    <div className="bd bd-dotwave" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {dots.map((d) => (
        <span key={d.i} className="bd-dot" style={{ animationDelay: (d.x + d.y) * 0.09 + 's', background: PASTELS[(d.x + d.y) % 5] }} />
      ))}
    </div>
  );
}

/** 15 · Paper planes gliding across with dashed trails. */
export function Planes() {
  const [planes] = useState(() => Array.from({ length: 6 }, (_, i) => ({
    id: i, top: 8 + i * 15, dur: rand(14, 24), delay: -rand(0, 24), color: PASTELS[i % 5], scale: rand(1.2, 2),
  })));
  return (
    <div className="bd bd-planes">
      {planes.map((p) => (
        <span key={p.id} className="bd-plane" style={{ top: p.top + '%', animationDuration: p.dur + 's', animationDelay: p.delay + 's', scale: String(p.scale), ['--plane' as string]: p.color }}>
          <span className="bd-trail" />
          <svg viewBox="0 0 48 40" aria-hidden="true">
            <path d="M2 18 46 2 30 38 22 24Z" fill="var(--plane)" />
            <path d="M22 24 46 2 14 22Z" fill="#fff" opacity=".7" />
          </svg>
        </span>
      ))}
    </div>
  );
}

function useParallax(root: RefObject<HTMLDivElement | null>, selector: string, strength: number) {
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const movers = Array.from(el.querySelectorAll<HTMLElement>(selector)).map((it) => ({
      x: gsap.quickTo(it, 'x', { duration: 1.2, ease: 'power3.out' }),
      y: gsap.quickTo(it, 'y', { duration: 1.2, ease: 'power3.out' }),
      d: (Number(it.dataset.depth) || 1) * strength,
    }));
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => { m.x(nx * m.d); m.y(ny * m.d); });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [root, selector, strength]);
}

/** 0 · Logo sky: bright blue sky, puffy clouds drifting, little sun-yellow stars (the app logo's scene). */
export function Sky() {
  const [stars] = useState(() => Array.from({ length: 14 }, (_, i) => ({
    id: i, left: rand(2, 98), top: rand(4, 70), size: rand(12, 22), delay: -rand(0, 4), dur: rand(2.6, 4.2),
  })));
  return (
    <div className="bd bd-sky">
      <span className="sky-cloud c1" />
      <span className="sky-cloud c2" />
      <span className="sky-cloud c3" />
      <span className="sky-cloud c4" />
      <span className="sky-cloud c5" />
      {stars.map((s) => (
        <span key={s.id} className="sky-star" style={{ left: s.left + '%', top: s.top + '%', width: s.size, height: s.size, animationDelay: s.delay + 's', animationDuration: s.dur + 's' }} />
      ))}
    </div>
  );
}
