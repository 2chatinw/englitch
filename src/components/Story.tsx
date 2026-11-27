import { useRef, type ReactNode } from 'react';
import { PAGES, type Route } from '../lib/router';
import { useProgress } from '../state/progress';
import { activeMission, allMissions, missionStats } from '../lib/missions';
import { ExplainWaiting } from './Explain';
import { AutoNextButton } from './ui';

/**
 * Practice pages as a social-media "story" (owner's pick, design 4 of 5): one tall card per question with
 * dashes on top for the questions in this set, the category and progress in the top row, the big content in the
 * middle, and a white sheet at the bottom for answering. Swiping up on the card runs `onSwipeUp` (next question).
 */
export function Story({ route, set, top, children, sheet, onSwipeUp, side }: {
  route: Route;
  /** dashes on top: how many in this set and how many are done */
  set: { total: number; done: number };
  /** replaces the right side of the top row (default: the mission's progress) */
  top?: ReactNode;
  children: ReactNode;
  sheet: ReactNode;
  onSwipeUp?: () => void;
  /** beside the card on desktop, under it on phones: the explanation after an answer (null = placeholder, false = none) */
  side?: ReactNode | false;
}) {
  const { state } = useProgress();
  const c = activeMission(state);
  const m = c ? missionStats(state, c) : null;
  const ms = allMissions(state);
  const done = ms.reduce((a, x) => a + x.done, 0), total = ms.reduce((a, x) => a + x.total, 0);
  const start = useRef<{ y: number; x: number } | null>(null);

  return (
    <div className={'story-wrap' + (side === false ? '' : ' has-side')}>
    <section className={'story story-' + route} data-reveal aria-labelledby="story-h"
      onPointerDown={(e) => {
        const tag = (e.target as HTMLElement).closest('input, textarea, button, a, .story-sheet');
        start.current = tag || !onSwipeUp ? null : { y: e.clientY, x: e.clientX };
      }}
      onPointerUp={(e) => {
        const s = start.current; start.current = null;
        if (!s || !onSwipeUp) return;
        const dy = s.y - e.clientY, dx = Math.abs(e.clientX - s.x);
        if (dy > 70 && dy > dx * 1.5) onSwipeUp();
      }}>
      <span className="story-glow" aria-hidden="true"><i /><i /></span>
      <div className="story-bars" role="progressbar" aria-label="ข้อในชุดนี้" aria-valuemin={0} aria-valuemax={set.total} aria-valuenow={set.done}>
        {Array.from({ length: set.total }, (_, i) => <span key={i} className={i < set.done ? 'is-done' : i === set.done ? 'is-now' : undefined} />)}
      </div>
      <div className="story-top">
        <div className="story-top-l">
        <a className="story-tag" href="#today" title="เปลี่ยนหมวด">
          <span aria-hidden="true">{m ? m.icon : '🌏'}</span> {m ? m.short : 'ทุกหมวด'}{m?.complete ? ' ✓' : ''}
        </a>
        <AutoNextButton />
        </div>
        <div className="story-meta">
          <h1 id="story-h" className="story-h">{PAGES[route].short}</h1>
          {top ?? <span className="num">· {m ? m.done + '/' + m.total : done + '/' + total}</span>}
        </div>
      </div>
      <div className="story-mid">{children}</div>
      <div className="story-sheet">{sheet}</div>
      {onSwipeUp ? <p className="story-hint" aria-hidden="true">ปัดขึ้นเพื่อไปข้อถัดไป</p> : null}
    </section>
    {side === false ? null : <aside className={'story-side' + (side ? '' : ' is-waiting')} aria-label="คำอธิบาย">{side || <ExplainWaiting />}</aside>}
    </div>
  );
}

/** The skill's big round button in the middle of the story (play, mic…), with a soft pulsing ring. */
export function StoryButton({ label, onClick, onLongPress, live, children }: {
  label: string; onClick: () => void; onLongPress?: () => void; live?: boolean; children: ReactNode;
}) {
  const timer = useRef<number | null>(null);
  const long = useRef(false);
  const clear = () => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } };
  return (
    <button type="button" className={'story-btn' + (live ? ' is-live' : '')} aria-label={label} aria-pressed={live === undefined ? undefined : live}
      onPointerDown={() => {
        long.current = false;
        if (onLongPress) timer.current = window.setTimeout(() => { long.current = true; onLongPress(); }, 480);
      }}
      onPointerUp={clear} onPointerLeave={clear} onContextMenu={(e) => onLongPress && e.preventDefault()}
      onClick={() => { if (long.current) { long.current = false; return; } onClick(); }}>
      {children}
    </button>
  );
}
