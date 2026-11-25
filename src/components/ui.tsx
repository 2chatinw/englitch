import { useEffect, useRef, useState, type ReactNode, type Ref } from 'react';
import gsap from 'gsap';
import { Icon } from './Icon';
import { say } from '../lib/speech';
import type { Comparison } from '../lib/compare';
import { useToast } from '../state/toast';
import { PAGES, type Route } from '../lib/router';

export function SpeakButton({ text, slow, label, quiet }: { text: string; slow?: boolean; label?: string; quiet?: boolean }) {
  const toast = useToast();
  return (
    <button
      type="button"
      className={quiet ? 'btn-text' : 'btn btn-ghost btn-sm'}
      aria-label={label || (slow ? 'ฟังช้า' : 'ฟัง') + ' ' + text}
      onClick={(e) => { e.stopPropagation(); if (!say(text, slow)) toast('อุปกรณ์นี้อ่านออกเสียงไม่ได้'); }}
    >
      <Icon name={slow ? 'slow' : 'speaker'} />
      {label ?? (slow ? 'ฟังช้า' : 'ฟัง')}
    </button>
  );
}

export function Bar({ value, tone = 'accent', label }: { value: number; tone?: 'accent' | 'hot' | 'good'; label?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const pct = Math.max(0, Math.min(1, value)) * 100;
  useEffect(() => {
    if (ref.current) gsap.to(ref.current, { width: pct + '%', duration: 0.6, ease: 'power3.out' });
  }, [pct]);
  return (
    <span className={'bar bar-' + tone} role={label ? 'progressbar' : undefined} aria-label={label}
      aria-valuenow={label ? Math.round(pct) : undefined} aria-valuemin={label ? 0 : undefined} aria-valuemax={label ? 100 : undefined}>
      <span ref={ref} className="bar-fill" />
    </span>
  );
}

export function WordDiff({ r }: { r: Comparison }) {
  return (
    <div className="words">
      {r.toks.map((t, i) => <span key={i} className={'w-' + r.marks[i]}>{t}</span>)}
    </div>
  );
}

export function PageHead({ route, children, aside }: { route: Route; children?: ReactNode; aside?: ReactNode }) {
  const p = PAGES[route];
  return (
    <header className="page-head" data-reveal>
      <div className="page-head-main">
        <span className="kicker">{p.en}</span>
        <h1>{p.th}</h1>
        {children ? <p className="lede">{children}</p> : null}
      </div>
      {aside ? <div className="page-head-aside">{aside}</div> : null}
    </header>
  );
}

export function Result({ ok, title, children }: { ok: boolean | 'near'; title: string; children?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) gsap.fromTo(ref.current, { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out' });
  }, []);
  return (
    <div ref={ref} className={'result ' + (ok === true ? 'result-ok' : ok === 'near' ? 'result-near' : 'result-miss')} role="status">
      <div className="result-title"><Icon name={ok === true ? 'check' : ok === 'near' ? 'bulb' : 'x'} />{title}</div>
      {children}
    </div>
  );
}

const AUTO_NEXT_MS = 3000;

/**
 * The "next" button after an answer. With `auto` (a right answer) it moves on by itself after 3 seconds,
 * with a bar filling across the button as it counts down. Tapping anything else first (listen again,
 * fix the answer…) stops the countdown, so nobody gets rushed.
 */
export function NextButton({ auto, onNext, className = 'btn btn-primary grow', btnRef, autoFocus, children }: {
  auto: boolean; onNext: () => void; className?: string; btnRef?: Ref<HTMLButtonElement>; autoFocus?: boolean; children: ReactNode;
}) {
  const [stopped, setStopped] = useState(false);
  const own = useRef<HTMLButtonElement | null>(null);
  const next = useRef(onNext);
  next.current = onNext;
  const counting = auto && !stopped;

  useEffect(() => {
    if (!counting) return;
    const t = window.setTimeout(() => next.current(), AUTO_NEXT_MS);
    const onDown = (e: PointerEvent) => { if (!own.current?.contains(e.target as Node)) setStopped(true); };
    document.addEventListener('pointerdown', onDown, true);
    return () => { window.clearTimeout(t); document.removeEventListener('pointerdown', onDown, true); };
  }, [counting]);

  const setRef = (el: HTMLButtonElement | null) => {
    own.current = el;
    if (typeof btnRef === 'function') btnRef(el);
    else if (btnRef) (btnRef as { current: HTMLButtonElement | null }).current = el;
  };

  return (
    <button type="button" ref={setRef} onClick={onNext} autoFocus={autoFocus}
      className={className + (counting ? ' is-counting' : '')}
      style={counting ? { ['--auto-ms' as string]: AUTO_NEXT_MS + 'ms' } : undefined}>
      {counting ? <span className="auto-bar" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

