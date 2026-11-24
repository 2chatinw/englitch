import { useEffect, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Icon } from './Icon';
import { prefersReducedMotion } from '../lib/util';

/** Bottom sheet on phones, side panel on desktop; slides with GSAP, closes on Esc or backdrop. */
export function Sheet({ open, onClose, title, children, onClosed }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; onClosed?: () => void;
}) {
  const [mounted, setMounted] = useState(open);
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (open) { lastFocus.current = document.activeElement as HTMLElement | null; setMounted(true); }
  }, [open]);

  useGSAP(() => {
    if (!mounted || !panel.current || !backdrop.current) return;
    const fast = prefersReducedMotion();
    const wide = window.matchMedia('(min-width: 900px)').matches;
    const off = wide ? { xPercent: 100, yPercent: 0 } : { yPercent: 100, xPercent: 0 };
    if (open) {
      gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: fast ? 0 : 0.25 });
      gsap.fromTo(panel.current, off, { xPercent: 0, yPercent: 0, duration: fast ? 0 : 0.42, ease: 'power3.out' });
      closeBtn.current?.focus();
    } else {
      gsap.to(backdrop.current, { autoAlpha: 0, duration: fast ? 0 : 0.2 });
      gsap.to(panel.current, {
        ...off, duration: fast ? 0 : 0.3, ease: 'power3.in',
        onComplete: () => { setMounted(false); onClosed?.(); lastFocus.current?.focus?.(); },
      });
    }
  }, { dependencies: [open, mounted] });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  const id = 'sheet-' + title.replace(/\s+/g, '-');
  return (
    <div className="sheet-wrap">
      <div className="sheet-backdrop" ref={backdrop} onClick={onClose} />
      <div className="sheet" ref={panel} role="dialog" aria-modal="true" aria-labelledby={id}>
        <div className="sheet-head">
          <h2 id={id}>{title}</h2>
          <button type="button" className="icon-btn" ref={closeBtn} onClick={onClose} aria-label={'ปิด' + title}><Icon name="x" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
