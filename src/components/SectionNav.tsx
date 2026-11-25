import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/util';

const LINKS = [
  { id: 'features', label: 'ฟีเจอร์' },
  { id: 'how', label: 'วิธีใช้' },
];

/**
 * Landing navbar links that follow the scroll: the link for the section on screen lights up and a
 * yellow bar slides under it; nothing is lit while the hero is showing.
 */
export function SectionNav() {
  const [active, setActive] = useState('');
  const nav = useRef<HTMLElement>(null);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);

  // which section is crossing the middle band of the screen
  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const pick = () => {
      const mid = window.innerHeight * 0.4;
      let cur = '';
      for (const el of els) {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom > mid) cur = el.id;
      }
      // at the very bottom of the page the last section counts as on screen
      if (!cur && window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
        const last = els[els.length - 1];
        if (last.getBoundingClientRect().top < window.innerHeight) cur = last.id;
      }
      setActive(cur);
    };
    // two cheap measurements per scroll event; React skips the render when the section hasn't changed
    pick();
    window.addEventListener('scroll', pick, { passive: true });
    window.addEventListener('resize', pick);
    return () => { window.removeEventListener('scroll', pick); window.removeEventListener('resize', pick); };
  }, []);

  // slide the bar under the lit link
  useLayoutEffect(() => {
    const a = nav.current?.querySelector<HTMLAnchorElement>('a[data-id="' + active + '"]');
    setBar(a ? { x: a.offsetLeft + 12, w: a.offsetWidth - 24 } : null);
  }, [active]);

  const go = (e: React.MouseEvent, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <nav className="lp-links" aria-label="หัวข้อ" ref={nav}>
      {LINKS.map((l) => (
        <a key={l.id} href={'#' + l.id} data-id={l.id} className={active === l.id ? 'is-active' : undefined}
          aria-current={active === l.id ? 'location' : undefined} onClick={(e) => go(e, l.id)}>
          {l.label}
        </a>
      ))}
      <span className="lp-links-bar" aria-hidden="true"
        style={bar ? { transform: `translateX(${bar.x}px)`, width: bar.w, opacity: 1 } : { opacity: 0 }} />
    </nav>
  );
}
