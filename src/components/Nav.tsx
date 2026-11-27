import { useCallback, useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { Icon } from './Icon';
import { PAGES, ROUTES, type Route } from '../lib/router';
import { useProgress } from '../state/progress';
import { allMissions } from '../lib/missions';
import { prefersReducedMotion } from '../lib/util';
import { Brand, useScrolled } from './Brand';
import { ThemeToggle } from './ThemeToggle';
import { AccountMenu } from './AccountMenu';

/** Middle of the top bar (owner's pick): "ฝึกต่อเนื่องวันที่ N", shortened to "วันที่ N" on narrow phones. */
function Streak({ n }: { n: number }) {
  if (n <= 0) return <span className="streak-mid is-off">เริ่มฝึกวันนี้ได้เลย</span>;
  return (
    <span className="streak-mid" title={'ฝึกต่อเนื่องวันที่ ' + n}>
      <Icon name="flame" />
      <span><span className="streak-long">ฝึกต่อเนื่อง</span>วันที่ <b className="num">{n}</b></span>
    </span>
  );
}

/**
 * Ring for a menu item: the lobby's ring fills with progress across all missions (nothing resets daily);
 * the practice modes have no ring of their own (`p: null`).
 */
function useQuest() {
  const { state } = useProgress();
  const ms = allMissions(state);
  const passed = ms.filter((m) => m.complete).length;
  const overall = ms.reduce((a, m) => a + m.done, 0) / ms.reduce((a, m) => a + m.total, 0);
  return (r: Route): { p: number | null; done: boolean; text: string } => r === 'today'
    ? { p: overall, done: passed === ms.length, text: 'ผ่าน Mission ' + passed + ' จาก ' + ms.length }
    : { p: null, done: false, text: '' };
}

/** The menu icon, inside a progress ring when there is progress to show; a green ring and a tick once done. */
function QuestRing({ icon, p, done, lobby }: { icon: Route; p: number | null; done: boolean; lobby?: boolean }) {
  return (
    <span className={'qring' + (done ? ' is-done' : '') + (lobby ? ' is-lobby' : '') + (p === null ? ' is-plain' : '')} aria-hidden="true">
      {p !== null ? (
        <svg className="qring-svg" viewBox="0 0 40 40">
          <circle className="qring-track" cx="20" cy="20" r="17" />
          <circle className="qring-fill" cx="20" cy="20" r="17" pathLength="100"
            style={{ strokeDasharray: `${Math.max(0, Math.min(1, p)) * 100} 100`, strokeOpacity: p > 0 ? 1 : 0 }} />
        </svg>
      ) : null}
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

const SKILLS: Route[] = ['listen', 'speak', 'read', 'write'];

/**
 * Desktop: on the practice pages the four skills sit in the middle of the top bar (owner's choice, replacing the
 * side rail and the streak there), a pill sliding to the open one. Phones keep the bottom tab bar.
 */
function TopMenu({ route }: { route: Route }) {
  const { list, ind } = useIndicator(route, 'x');
  return (
    <nav className="top-menu" aria-label="ทักษะที่ฝึก" ref={list as RefObject<HTMLElement>}>
      <span className="top-menu-ind" ref={ind} aria-hidden="true" />
      {SKILLS.map((r) => (
        <a key={r} href={'#' + r} className="top-menu-item" aria-current={r === route ? 'page' : undefined}>
          <Icon name={PAGES[r].icon} /><span>{PAGES[r].short}</span>
        </a>
      ))}
    </nav>
  );
}

/**
 * Top bar on every screen size: logo (back to the home page), the streak in the middle (on the practice pages the
 * skills menu instead, on desktop), theme and the account menu. Clear at the top, glass once scrolled.
 */
export function TopBar({ route, onSettings, onAccount }: { route: Route; onSettings: () => void; onAccount: () => void }) {
  const { streak } = useProgress();
  const scrolled = useScrolled();
  return (
    <header className="topbar" data-scrolled={scrolled ? 'true' : 'false'}>
      <div className="topbar-in">
        <a className="brand brand-sm" href="#today" aria-label="Englitch กลับหน้าหลัก" title="กลับหน้าหลัก">
          <Brand size="sm" />
        </a>
        <div className="top-hud">
          {route === 'today' ? <Streak n={streak} /> : (
            <>
              <TopMenu route={route} />
              <span className="top-streak-phone"><Streak n={streak} /></span>
            </>
          )}
        </div>
        <div className="top-right">
          <span className="top-theme"><ThemeToggle /></span>
          <AccountMenu onAccount={onAccount} onSettings={onSettings} />
        </div>
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
              {q.text ? <span className="sr-only">, {q.text}</span> : null}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
