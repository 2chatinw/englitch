import { useEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { Icon } from './Icon';
import { say } from '../lib/speech';
import type { Comparison } from '../lib/compare';
import { useToast } from '../state/toast';
import { PAGES, type Route } from '../lib/router';
import { MISSIONS, type Kind } from '../data/content';
import { useProgress } from '../state/progress';

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

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

/** "today n/goal" for a practice page, turning into a done badge once the daily mission is complete. */
export function MissionPill({ k }: { k: Kind }) {
  const { day } = useProgress();
  const m = MISSIONS.find((x) => x.k === k)!;
  const n = day[k];
  return n >= m.goal
    ? <span className="pill pill-done num"><Icon name="check" /> ครบ {m.goal}/{m.goal}</span>
    : <span className="pill num">วันนี้ {n}/{m.goal}</span>;
}

/** Shown on a practice page once its daily mission is complete: says so and points to the next unfinished one. */
export function MissionDone({ k }: { k: Kind }) {
  const { day } = useProgress();
  const m = MISSIONS.find((x) => x.k === k)!;
  if (day[k] < m.goal) return null;
  const next = MISSIONS.find((x) => day[x.k] < x.goal);
  return (
    <div className="mission-done" role="status">
      <span className="mission-done-ic"><Icon name="check" /></span>
      <span className="mission-done-txt">
        <b>{next ? 'ครบภารกิจนี้ของวันนี้แล้ว' : 'ครบทุกภารกิจของวันนี้แล้ว GG!'}</b>
        <span>{next ? 'ฝึกต่อได้เรื่อย ๆ หรือไปภารกิจถัดไป' : 'ฝึกต่อได้ตามสบาย พรุ่งนี้มาต่อกัน'}</span>
      </span>
      {next
        ? <a className="btn btn-primary btn-sm" href={'#' + next.k}>ต่อด้วย{PAGES[next.k].th} <Icon name="arrow" /></a>
        : <a className="btn btn-ghost btn-sm" href="#today">กลับหน้าวันนี้</a>}
    </div>
  );
}
