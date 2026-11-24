import { useEffect, useRef, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { prefersReducedMotion } from '../lib/util';

/** Pastel page backgrounds (five candidates). Each sits fixed behind the content and has one small moving detail. */
export type BackdropKind = 'aurora' | 'shapes' | 'pixel' | 'bubbles' | 'stickers';

export const BACKDROPS: { id: BackdropKind; name: string; note: string }[] = [
  { id: 'aurora', name: 'ออโรร่าพาสเทล', note: 'ก้อนสีชมพู ม่วง มิ้นต์ ลอยช้า ๆ และขยับตามเมาส์' },
  { id: 'shapes', name: 'ตารางกับรูปทรง', note: 'กระดาษตาราง มีรูปทรงสีพาสเทลหมุนลอยแบบพารัลแลกซ์' },
  { id: 'pixel', name: 'เมฆพิกเซล', note: 'ฟ้าพาสเทล เมฆพิกเซลแบบเกมย้อนยุคลอยผ่าน' },
  { id: 'bubbles', name: 'ฟองสบู่', note: 'ฟองลอยขึ้นช้า ๆ คลิกพื้นหลังว่าง ๆ แล้วฟองแตก' },
  { id: 'stickers', name: 'สติกเกอร์คำศัพท์', note: 'จุดพาสเทล กับสติกเกอร์คำอย่าง GG, Nice!, brb ที่โยกตามเมาส์' },
];

function useMouseParallax(root: RefObject<HTMLDivElement | null>, selector: string, strength: number) {
  useEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const items = Array.from(el.querySelectorAll<HTMLElement>(selector));
    const movers = items.map((it, i) => {
      const depth = (Number(it.dataset.depth) || (i % 3) + 1) * strength;
      return { x: gsap.quickTo(it, 'x', { duration: 1.2, ease: 'power3.out' }), y: gsap.quickTo(it, 'y', { duration: 1.2, ease: 'power3.out' }), depth };
    });
    const onMove = (e: PointerEvent) => {
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      movers.forEach((m) => { m.x(nx * m.depth); m.y(ny * m.depth); });
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [root, selector, strength]);
}

function Aurora() {
  const ref = useRef<HTMLDivElement>(null);
  useMouseParallax(ref, '.bd-blob', 22);
  return (
    <div className="bd bd-aurora" ref={ref}>
      <span className="bd-blob b1" data-depth="2" />
      <span className="bd-blob b2" data-depth="3" />
      <span className="bd-blob b3" data-depth="1" />
      <span className="bd-blob b4" data-depth="2" />
    </div>
  );
}

function Shapes() {
  const ref = useRef<HTMLDivElement>(null);
  useMouseParallax(ref, '.bd-shape', 18);
  return (
    <div className="bd bd-shapes" ref={ref}>
      <span className="bd-shape s-circle" style={{ left: '3%', top: '32%' }} data-depth="2" />
      <span className="bd-shape s-tri" style={{ left: '82%', top: '12%' }} data-depth="3" />
      <span className="bd-shape s-ring" style={{ left: '70%', top: '62%' }} data-depth="1" />
      <span className="bd-shape s-plus" style={{ left: '40%', top: '72%' }} data-depth="3" />
      <span className="bd-shape s-square" style={{ left: '52%', top: '14%' }} data-depth="1" />
      <span className="bd-shape s-circle small" style={{ left: '90%', top: '82%' }} data-depth="2" />
      <span className="bd-shape s-tri small" style={{ left: '34%', top: '88%' }} data-depth="2" />
    </div>
  );
}

function Pixel() {
  return (
    <div className="bd bd-pixel">
      <span className="bd-cloud c1" />
      <span className="bd-cloud c2" />
      <span className="bd-cloud c3" />
      <span className="bd-cloud c4" />
      <span className="bd-cloud c5" />
      <span className="bd-spark k1" />
      <span className="bd-spark k2" />
      <span className="bd-spark k3" />
    </div>
  );
}

function Bubbles() {
  const [bubbles] = useState(() => Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: Math.round(Math.random() * 96),
    size: 18 + Math.round(Math.random() * 46),
    dur: 14 + Math.round(Math.random() * 14),
    delay: -Math.round(Math.random() * 20),
    hue: ['#FFD3E2', '#D9D3FF', '#CFF3E8', '#FFE6C7', '#CFE6FF'][i % 5],
  })));
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Clicking empty background pops the bubble under the pointer.
    const onClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('a, button, input, textarea, select, .card, .lp-feature, .lp-step, .sheet')) return;
      for (const b of Array.from(el.querySelectorAll<HTMLElement>('.bd-bubble'))) {
        const r = b.getBoundingClientRect();
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop');
          break;
        }
      }
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);
  return (
    <div className="bd bd-bubbles" ref={ref}>
      {bubbles.map((b) => (
        <span key={b.id} className="bd-bubble"
          style={{ left: b.left + '%', width: b.size, height: b.size, animationDuration: b.dur + 's', animationDelay: b.delay + 's', ['--tint' as string]: b.hue }}
          onAnimationEnd={(e) => { if (e.animationName === 'bd-pop') (e.currentTarget as HTMLElement).classList.remove('pop'); }} />
      ))}
    </div>
  );
}

const STICKERS: [string, string, string, string, number][] = [
  ['GG', '2%', '6%', '#FFD3E2', -8],
  ['Nice shot!', '86%', '4%', '#D9D3FF', 6],
  ['brb', '93%', '40%', '#CFF3E8', -4],
  ['Hi!', '2%', '80%', '#FFE6C7', 5],
  ['You too!', '64%', '84%', '#CFE6FF', -6],
  ['lol', '28%', '90%', '#FFD3E2', 8],
  ['Let\'s go!', '88%', '70%', '#CFF3E8', -3],
];

function Stickers() {
  const ref = useRef<HTMLDivElement>(null);
  useMouseParallax(ref, '.bd-sticker', 16);
  return (
    <div className="bd bd-stickers" ref={ref}>
      {STICKERS.map(([t, l, top, c, r], i) => (
        <span key={t} className="bd-sticker" data-depth={(i % 3) + 1}
          style={{ left: l, top, background: c, rotate: r + 'deg', animationDelay: -i * 0.7 + 's' }}>{t}</span>
      ))}
    </div>
  );
}

export function Backdrop({ kind }: { kind: BackdropKind }) {
  switch (kind) {
    case 'aurora': return <Aurora />;
    case 'shapes': return <Shapes />;
    case 'pixel': return <Pixel />;
    case 'bubbles': return <Bubbles />;
    case 'stickers': return <Stickers />;
  }
}
