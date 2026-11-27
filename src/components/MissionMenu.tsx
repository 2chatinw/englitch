import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Group } from '../data/content';
import { useProgress } from '../state/progress';
import { clearSessions } from '../state/session';
import { activeMission, allMissions, missionStats } from '../lib/missions';
import { prefersReducedMotion } from '../lib/util';

/** Other parts of the app (the label by the menus) open this switcher with this event. */
export const OPEN_MISSION_MENU = 'gg:mission-menu';

const Chevron = () => (
  <svg className="mm-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);

/** Switch the mission from any page; the practice page reloads with sentences from the new category. */
export function useChooseMission() {
  const { setSettings } = useProgress();
  return (c: Group | null) => { clearSessions(); setSettings({ mission: c }); };
}

/**
 * Top-bar mission switcher: shows the category being practised ("ทุกหมวด" when none) and opens a list of
 * all seven with their progress. Escape, Tab, a click outside or picking one closes it; arrow keys move.
 */
export function MissionMenu() {
  const { state } = useProgress();
  const choose = useChooseMission();
  const active = activeMission(state);
  const cur = active ? missionStats(state, active) : null;
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const focusFirst = useRef(false);

  const items = () => Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') || []);
  const close = (refocus = false) => { setOpen(false); if (refocus) btn.current?.focus(); };

  useLayoutEffect(() => {
    const el = menu.current;
    if (!open || !el) return;
    if (focusFirst.current) { (items().find((x) => x.getAttribute('aria-checked') === 'true') ?? items()[0])?.focus(); focusFirst.current = false; }
    if (!prefersReducedMotion()) gsap.fromTo(el, { autoAlpha: 0, y: -6, scale: 0.97 }, { autoAlpha: 1, y: 0, scale: 1, duration: 0.2, ease: 'power2.out' });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) close(); };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  });

  // opened from the label next to the side menu / bottom bar
  useEffect(() => {
    const onOpen = () => { focusFirst.current = true; setOpen(true); };
    window.addEventListener(OPEN_MISSION_MENU, onOpen);
    return () => window.removeEventListener(OPEN_MISSION_MENU, onOpen);
  }, []);

  const onMenuKey = (e: React.KeyboardEvent) => {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') { e.preventDefault(); close(true); }
    else if (e.key === 'Tab') close();
    else if (e.key === 'ArrowDown') { e.preventDefault(); list[(i + 1) % list.length]?.focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
    else if (e.key === 'Home') { e.preventDefault(); list[0]?.focus(); }
    else if (e.key === 'End') { e.preventDefault(); list[list.length - 1]?.focus(); }
  };
  const pick = (c: Group | null) => { choose(c); close(true); };

  return (
    <div className="mm" ref={wrap}>
      <button type="button" className="mm-btn" ref={btn} aria-haspopup="menu" aria-expanded={open} aria-controls="mission-menu"
        aria-label={'Mission: ' + (cur ? cur.name : 'ฝึกรวมทุกหมวด') + ' (เปลี่ยนได้)'}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => {
          if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); focusFirst.current = true; setOpen(true); }
          else if (open && e.key === 'Escape') { e.preventDefault(); close(true); }
        }}>
        <span className="mm-icon" aria-hidden="true">{cur ? cur.icon : '🌏'}</span>
        <span className="mm-text">
          <small>Mission</small>
          <b>{cur ? cur.short : 'ทุกหมวด'}</b>
        </span>
        <Chevron />
      </button>
      {open ? (
        <div className="mm-menu" id="mission-menu" role="menu" aria-label="เลือก Mission" ref={menu} onKeyDown={onMenuKey}>
          <button type="button" role="menuitemradio" aria-checked={!active} className="mm-item" onClick={() => pick(null)}>
            <span className="mm-item-icon" aria-hidden="true">🌏</span>
            <span className="mm-item-body"><b>ฝึกรวมทุกหมวด</b><small>สุ่มจากทั้ง 7 หมวด เริ่มจากระดับง่าย</small></span>
          </button>
          <hr className="mm-sep" />
          {allMissions(state).map((m) => (
            <button key={m.c} type="button" role="menuitemradio" aria-checked={m.c === active} className={'mm-item' + (m.complete ? ' is-done' : '')} onClick={() => pick(m.c)}>
              <span className="mm-item-icon" aria-hidden="true">{m.icon}</span>
              <span className="mm-item-body">
                <b>{m.name}</b>
                <small>{m.complete ? '✓ ผ่านแล้ว' : 'ผ่าน ' + m.done + '/' + m.total + ' ประโยค'}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Small label next to the practice menus saying which mission the menu practises; tapping it opens the
 * top-bar switcher. `place` picks the look: under the desktop rail, or above the phone tab bar.
 */
export function MissionTag({ place }: { place: 'rail' | 'bottom' }) {
  const { state } = useProgress();
  const active = activeMission(state);
  const cur = active ? missionStats(state, active) : null;
  return (
    <button type="button" className={'mtag mtag-' + place}
      aria-label={'กำลังฝึก ' + (cur ? 'Mission ' + cur.name : 'รวมทุกหมวด') + ' แตะเพื่อเปลี่ยน'}
      onClick={() => window.dispatchEvent(new Event(OPEN_MISSION_MENU))}>
      <small>{place === 'rail' ? 'ฝึกหมวด' : 'กำลังฝึก'}</small>
      <span><span aria-hidden="true">{cur ? cur.icon : '🌏'}</span> {cur ? cur.short : 'ทุกหมวด'}</span>
    </button>
  );
}
