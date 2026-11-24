import { useEffect, useState } from 'react';

const MASCOT = './brand/englitch-720.webp';
const WORDMARK = './brand/englitch-wordmark.webp';

/** The ENGLITCH logo with a light sweep across it and stars twinkling around it. */
export function Brand({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  // the shine is masked by the logo itself, so it only lights up the logo, never the space around it
  const mask = { WebkitMaskImage: `url(${WORDMARK})`, maskImage: `url(${WORDMARK})` };
  return (
    <span className={'brandmark brandmark-' + size}>
      <img className="brandmark-logo" src={WORDMARK} alt="Englitch" width={628} height={200} decoding="async" />
      <span className="brand-shine" style={mask} aria-hidden="true" />
      <i className="brand-spark s1" aria-hidden="true" />
      <i className="brand-spark s2" aria-hidden="true" />
      <i className="brand-spark s3" aria-hidden="true" />
      <i className="brand-spark s4" aria-hidden="true" />
    </span>
  );
}

/** true once the page has scrolled past `offset` px; drives the navbar's clear → glass change. */
export function useScrolled(offset = 8) {
  const [scrolled, setScrolled] = useState(() => typeof window !== 'undefined' && window.scrollY > offset);
  useEffect(() => {
    let raf = 0;
    const check = () => { raf = 0; setScrolled(window.scrollY > offset); };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [offset]);
  return scrolled;
}

export const LOGO_URL = MASCOT;
