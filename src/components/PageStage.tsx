import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { PAGES, type Route } from '../lib/router';
import { prefersReducedMotion } from '../lib/util';

/**
 * Page transitions: a panel wipes across the content area carrying the next mode's name,
 * the page swaps while covered, then the panel exits and the new page's sections rise in.
 */
export function PageStage({ route, render }: { route: Route; render: (r: Route) => ReactNode }) {
  const [shown, setShown] = useState<Route>(route);
  const shownRef = useRef(shown);
  shownRef.current = shown;
  const routeRef = useRef(route);
  routeRef.current = route;
  const page = useRef<HTMLDivElement>(null);
  const wipe = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const sub = useRef<HTMLSpanElement>(null);
  const covering = useRef(false);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const firstRun = useRef(true);

  const reveal = () => {
    const p = page.current, w = wipe.current;
    if (!p || !w) return;
    const items = p.querySelectorAll('[data-reveal]');
    tl.current?.kill();
    const t = gsap.timeline({ onComplete: () => { covering.current = false; } });
    t.set(p, { autoAlpha: 1, x: 0 })
      .to(w, { xPercent: 101, duration: 0.38, ease: 'power4.inOut', delay: 0.05 })
      .set(w, { display: 'none' })
      .fromTo(items, { y: 22, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.05, ease: 'power3.out' }, 0.18);
    tl.current = t;
  };

  // Phase 1: cover the old page, then swap.
  useEffect(() => {
    if (firstRun.current) return;
    const w = wipe.current;
    if (!w) return;
    if (prefersReducedMotion()) { window.scrollTo(0, 0); setShown(route); return; }
    if (route === shownRef.current && !covering.current) return;
    if (label.current) label.current.textContent = PAGES[route].en;
    if (sub.current) sub.current.textContent = PAGES[route].th;
    tl.current?.kill();
    const t = gsap.timeline();
    if (!covering.current) {
      covering.current = true;
      t.set(w, { display: 'flex', xPercent: -101 })
        .to(page.current, { autoAlpha: 0, x: 24, duration: 0.22, ease: 'power2.in' }, 0);
    }
    t.to(w, { xPercent: 0, duration: 0.3, ease: 'power4.inOut' }, 0)
      .fromTo([label.current, sub.current], { x: -40, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.3, stagger: 0.04, ease: 'power3.out' }, 0.12)
      .add(() => {
        window.scrollTo(0, 0);
        if (shownRef.current === route) reveal();
        else setShown(route);
      });
    tl.current = t;
  }, [route]); // eslint-disable-line react-hooks/exhaustive-deps

  // Phase 2: reveal the page that was just swapped in.
  useLayoutEffect(() => {
    const p = page.current, w = wipe.current;
    if (!p || !w) return;
    if (firstRun.current) {
      firstRun.current = false;
      if (prefersReducedMotion()) return;
      gsap.fromTo(p.querySelectorAll('[data-reveal]'), { y: 18, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.5, stagger: 0.06, ease: 'power3.out' });
      return;
    }
    if (prefersReducedMotion()) { gsap.set(p, { autoAlpha: 1, x: 0 }); gsap.set(w, { display: 'none' }); return; }
    if (routeRef.current !== shown) return; // a newer navigation is already covering
    reveal();
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <div className="stage" ref={page}>{render(shown)}</div>
      <div className="wipe" ref={wipe} aria-hidden="true">
        <span className="wipe-en" ref={label} />
        <span className="wipe-th" ref={sub} />
      </div>
    </>
  );
}
