import { useCallback, useEffect, useRef, type RefObject } from 'react';
import gsap from 'gsap';
import { Icon } from './Icon';
import { Bar } from './ui';
import { PAGES, ROUTES, type Route } from '../lib/router';
import { useProgress } from '../state/progress';
import { prefersReducedMotion } from '../lib/util';
import { useAuth } from '../state/auth';
import { Avatar } from './Account';

function AccountButton({ onAccount, compact }: { onAccount: () => void; compact?: boolean }) {
  const { status, user } = useAuth();
  if (status === 'disabled') return null;
  if (user) {
    return (
      <button type="button" className={compact ? 'icon-btn avatar-btn' : 'side-account'} onClick={onAccount} aria-label={'บัญชีของ ' + user.name}>
        <Avatar name={user.name} photo={user.photo} size={compact ? 30 : 32} />
        {compact ? null : <span className="side-account-name">{user.name}</span>}
      </button>
    );
  }
  return compact
    ? <button type="button" className="btn btn-primary btn-sm login-btn" onClick={onAccount}>เข้าสู่ระบบ</button>
    : <button type="button" className="btn btn-primary btn-block" onClick={onAccount}>เข้าสู่ระบบ / สมัคร</button>;
}

/** Plays a floating "+N XP" over the given anchor whenever XP is gained. */
function useXpPop(anchor: RefObject<HTMLElement | null>) {
  const { xpEvent } = useProgress();
  useEffect(() => {
    const el = anchor.current;
    if (!xpEvent || !el || el.offsetParent === null) return;
    const pop = document.createElement('span');
    pop.className = 'xp-pop';
    pop.textContent = '+' + xpEvent.pts + ' XP';
    el.appendChild(pop);
    if (prefersReducedMotion()) { setTimeout(() => pop.remove(), 900); return; }
    gsap.fromTo(pop, { y: 6, autoAlpha: 0, scale: 0.8 }, {
      y: -26, autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(2)',
      onComplete: () => { gsap.to(pop, { autoAlpha: 0, y: -38, duration: 0.4, delay: 0.35, onComplete: () => pop.remove() }); },
    });
  }, [xpEvent, anchor]);
}

function Streak({ n }: { n: number }) {
  return (
    <span className={'streak' + (n > 0 ? ' is-on' : '')} title="จำนวนวันที่ฝึกต่อเนื่อง">
      <Icon name="flame" /><b className="num">{n}</b><span className="streak-unit">วัน</span>
    </span>
  );
}

/** Slides an indicator element to the active item with GSAP. */
function useIndicator(route: Route, axis: 'x' | 'y') {
  const list = useRef<HTMLDivElement>(null);
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

export function Sidebar({ route, onSettings, onAccount }: { route: Route; onSettings: () => void; onAccount: () => void }) {
  const { level, levelXp, streak } = useProgress();
  const { list, ind } = useIndicator(route, 'y');
  const hud = useRef<HTMLDivElement>(null);
  useXpPop(hud);
  return (
    <aside className="sidebar">
      <a className="brand" href="#today" aria-label="Englitch หน้าแรก">
        <span className="brand-mark">EN</span>
        <span className="brand-word">glitch</span>
      </a>
      <div className="hud" ref={hud}>
        <div className="hud-row">
          <span className="hud-level"><small>LV</small><b className="num">{level}</b></span>
          <Streak n={streak} />
        </div>
        <Bar value={levelXp / 100} tone="hot" label="XP ในเลเวลนี้" />
        <span className="hud-xp num">{levelXp} / 100 XP</span>
      </div>
      <nav className="side-nav" aria-label="โหมดฝึก">
        <div className="side-nav-list" ref={list}>
          <span className="side-ind" ref={ind} aria-hidden="true" />
          {ROUTES.map((r) => (
            <a key={r} href={'#' + r} className="side-link" aria-current={r === route ? 'page' : undefined}>
              <Icon name={PAGES[r].icon} />
              <span>{PAGES[r].th}</span>
            </a>
          ))}
        </div>
      </nav>
      <div className="side-foot">
      <AccountButton onAccount={onAccount} />
      <button type="button" className="side-settings" onClick={onSettings}>
        <Icon name="sliders" /> ตั้งค่า
      </button>
      </div>
    </aside>
  );
}

export function TopBar({ onSettings, onAccount }: { onSettings: () => void; onAccount: () => void }) {
  const { level, levelXp, streak } = useProgress();
  const hud = useRef<HTMLDivElement>(null);
  useXpPop(hud);
  return (
    <header className="topbar">
      <a className="brand brand-sm" href="#today" aria-label="Englitch หน้าแรก">
        <span className="brand-mark">EN</span>
        <span className="brand-word">glitch</span>
      </a>
      <div className="top-hud" ref={hud}>
        <span className="hud-level hud-level-sm"><small>LV</small><b className="num">{level}</b></span>
        <span className="top-xp"><Bar value={levelXp / 100} tone="hot" label="XP ในเลเวลนี้" /></span>
        <Streak n={streak} />
      </div>
      <AccountButton onAccount={onAccount} compact />
      <button type="button" className="icon-btn" onClick={onSettings} aria-label="ตั้งค่า">
        <Icon name="sliders" />
      </button>
    </header>
  );
}

export function BottomBar({ route }: { route: Route }) {
  const { list, ind } = useIndicator(route, 'x');
  return (
    <nav className="bottombar" aria-label="โหมดฝึก">
      <div className="bottombar-list" ref={list}>
        <span className="bottom-ind" ref={ind} aria-hidden="true" />
        {ROUTES.map((r) => (
          <a key={r} href={'#' + r} className="bottom-link" aria-current={r === route ? 'page' : undefined}>
            <Icon name={PAGES[r].icon} />
            <span>{PAGES[r].short}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
