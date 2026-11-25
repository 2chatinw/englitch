import { useCallback, useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { Icon } from './Icon';
import { PAGES, ROUTES, type Route } from '../lib/router';
import { useProgress } from '../state/progress';
import { MISSIONS } from '../data/content';
import { prefersReducedMotion } from '../lib/util';
import { Brand, useScrolled } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { AccountMenu } from './AccountMenu';

function Streak({ n }: { n: number }) {
  return (
    <span className={'streak' + (n > 0 ? ' is-on' : '')} title="จำนวนวันที่ฝึกต่อเนื่อง">
      <Icon name="flame" /><b className="num">{n}</b><span className="streak-unit">วัน</span>
    </span>
  );
}

/** Today's progress for a menu item: one mission's count, or (for the lobby) all missions together. */
function useQuest() {
  const { day } = useProgress();
  return (r: Route) => {
    if (r === 'today') {
      const goal = MISSIONS.reduce((s, m) => s + m.goal, 0);
      const got = MISSIONS.reduce((s, m) => s + Math.min(day[m.k], m.goal), 0);
      const done = MISSIONS.filter((m) => day[m.k] >= m.goal).length;
      return { p: got / goal, done: done === MISSIONS.length, text: 'ภารกิจครบ ' + done + ' จาก ' + MISSIONS.length };
    }
    const m = MISSIONS.find((x) => x.k === r)!;
    const n = Math.min(day[m.k], m.goal);
    return { p: n / m.goal, done: n >= m.goal, text: 'วันนี้ ' + n + ' จาก ' + m.goal + ' ' + m.unit };
  };
}

/** The menu icon inside a quest ring that fills with today's progress; a green ring and a tick once done. */
function QuestRing({ icon, p, done, lobby }: { icon: Route; p: number; done: boolean; lobby?: boolean }) {
  return (
    <span className={'qring' + (done ? ' is-done' : '') + (lobby ? ' is-lobby' : '')} aria-hidden="true">
      <svg className="qring-svg" viewBox="0 0 40 40">
        <circle className="qring-track" cx="20" cy="20" r="17" />
        <circle className="qring-fill" cx="20" cy="20" r="17" pathLength="100"
          style={{ strokeDasharray: `${Math.max(0, Math.min(1, p)) * 100} 100`, strokeOpacity: p > 0 ? 1 : 0 }} />
      </svg>
      <Icon name={PAGES[icon].icon} />
      {done ? <span className="qring-tick"><Icon name="check" /></span> : null}
    </span>
  );
}

/** Slides an indicator element to the active item with GSAP. */
function useIndicator(route: Route, axis: 'x' | 'y') {
  const list = useRef<HTMLElement>(null);
  const ind = useRef<HTMLSpanElement>(null);
  const first = useRef(true);
  const place = useCallback((animate: boolean) => {
    const root = list.current, mark = ind.current;
    if (!root || !mark) return;
    const active = root.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active || active.offsetParent === null) return;
    const vars = axis === 'x'
      ? { x: active.offsetLeft, width: active.offsetWidth, y: 0 }
      : { y: active.offsetTop, height: active.offsetHeight, x: 0 };
    if (!animate || prefersReducedMotion()) gsap.set(mark, vars);
    else gsap.to(mark, { ...vars, duration: 0.45, ease: 'power3.out' });
  }, [axis]);
  useEffect(() => { place(!first.current); first.current = false; }, [route, place]);
  useEffect(() => {
    const onResize = () => place(false);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(() => place(false));
    return () => window.removeEventListener('resize', onResize);
  }, [place]);
  return { list, ind };
}

/**
 * Desktop menu: a slim floating rail beside the page (after the scholarship site's icon rail), drawn as a quest log:
 * each mode's icon sits in a ring that fills with today's mission progress.
 */
export function QuestRail({ route }: { route: Route }) {
  const quest = useQuest();
  const { list, ind } = useIndicator(route, 'y');
  return (
    <aside className="rail" aria-label="โหมดฝึก">
      <nav className="rail-in" ref={list}>
        <span className="rail-ind" ref={ind} aria-hidden="true" />
        {ROUTES.map((r) => {
          const q = quest(r);
          return (
            <div key={r} className="rail-slot">
              <a href={'#' + r} className="rail-item" title={PAGES[r].th + ' · ' + q.text}
                aria-current={r === route ? 'page' : undefined}>
                <QuestRing icon={r} p={q.p} done={q.done} lobby={r === 'today'} />
                <span className="rail-label">{PAGES[r].short}</span>
                <span className="sr-only">{PAGES[r].th}, {q.text}</span>
              </a>
              {r === 'today' ? <hr className="rail-sep" /> : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

/** Top bar on every screen size: logo, streak, theme and the account menu. Clear at the top, glass once scrolled. */
export function TopBar({ onSettings, onAccount }: { onSettings: () => void; onAccount: () => void }) {
  const { streak } = useProgress();
  const scrolled = useScrolled();
  return (
    <header className="topbar" data-scrolled={scrolled ? 'true' : 'false'}>
      <div className="topbar-in">
        <a className="brand brand-sm" href="#today" aria-label="Englitch หน้าแรก">
          <Brand size="sm" />
        </a>
        <div className="top-hud">
          <Streak n={streak} />
        </div>
        <span className="top-theme"><ThemeToggle /></span>
        <AccountMenu onAccount={onAccount} onSettings={onSettings} />
      </div>
    </header>
  );
}

/** Phone/tablet: thumb-reach tab bar, each icon in the same small quest ring. */
export function BottomBar({ route }: { route: Route }) {
  const quest = useQuest();
  const { list, ind } = useIndicator(route, 'x');
  return (
    <nav className="bottombar" aria-label="โหมดฝึก">
      <div className="bottombar-list" ref={list as RefObject<HTMLDivElement>}>
        <span className="bottom-ind" ref={ind} aria-hidden="true" />
        {ROUTES.map((r) => {
          const q = quest(r);
          return (
            <a key={r} href={'#' + r} className="bottom-link" aria-current={r === route ? 'page' : undefined}>
              <QuestRing icon={r} p={q.p} done={q.done} lobby={r === 'today'} />
              <span>{PAGES[r].short}</span>
              <span className="sr-only">, {q.text}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
