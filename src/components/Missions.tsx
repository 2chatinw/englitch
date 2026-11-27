import { useEffect, useRef } from 'react';
import { LEVELS, type Group, type Level } from '../data/content';
import { Icon } from './Icon';
import { useProgress } from '../state/progress';
import { useToast } from '../state/toast';
import type { Route } from '../lib/router';
import { activeMission, allMissions, missionStats, type MissionStats } from '../lib/missions';
import { levelStatus } from '../pages/practice';

const LEVEL_TH: Record<Level, string> = { easy: 'ง่าย', medium: 'กลาง', hard: 'ยาก' };

/** A mission's progress as one bar in three stages (short, longer, long sentences), each filling in its colour. */
export function MissionBar({ m }: { m: MissionStats }) {
  return (
    <span className="mbar" role="img" aria-label={'ผ่านแล้ว ' + m.done + ' จาก ' + m.total + ' ประโยค'}>
      {m.stages.map((s) => (
        <span key={s.k} className={'mbar-seg mbar-' + s.k} style={{ flexGrow: s.total }} title={LEVEL_TH[s.k] + ' ' + s.done + '/' + s.total}>
          <i style={{ width: (s.done / s.total) * 100 + '%' }} />
        </span>
      ))}
    </span>
  );
}

/** Practice-page header chip: the mission being played (tap to change it) or "mixed practice". */
export function MissionChip() {
  const { state } = useProgress();
  const c = activeMission(state);
  if (!c) return <a className="pill mchip" href="#today">ฝึกรวมทุกหมวด</a>;
  const m = missionStats(state, c);
  return (
    <a className={'pill mchip' + (m.complete ? ' pill-done' : '')} href="#today" title="เปลี่ยน Mission">
      <span aria-hidden="true">{m.icon}</span> {m.short} <b className="num">{m.done}/{m.total}</b>
    </a>
  );
}

/** Top of a practice card: the mission's three-stage bar, and a "passed" note once every phrase is done. */
export function MissionStrip(_: { route: Route }) {
  const { state } = useProgress();
  const c = activeMission(state);
  if (!c) return null;
  const m = missionStats(state, c);
  return (
    <div className="mstrip">
      <MissionBar m={m} />
      {m.complete ? (
        <div className="mission-done" role="status">
          <span className="mission-done-ic"><Icon name="check" /></span>
          <span className="mission-done-txt">
            <b>ผ่าน Mission {m.short} แล้ว!</b>
            <span>ฝึกทบทวนต่อได้เรื่อย ๆ หรือเลือก Mission ใหม่</span>
          </span>
          <a className="btn btn-primary btn-sm" href="#today">เลือก Mission <Icon name="arrow" /></a>
        </div>
      ) : null}
    </div>
  );
}

/** Toasts for passing a mission and (mixed practice, auto) opening a new level. Mounted once in the app shell. */
export function useProgressToasts() {
  const { state } = useProgress();
  const toast = useToast();
  const passed = allMissions(state).filter((m) => m.complete).map((m) => m.c).join(',');
  const opened = levelStatus(state).open.length;
  const prev = useRef({ passed, opened, at: Date.now() });
  useEffect(() => {
    const was = prev.current;
    prev.current = { passed, opened, at: was.at };
    // progress arriving from the cloud right after opening the app isn't news
    if (Date.now() - was.at < 4000) return;
    const newly = passed.split(',').filter((c) => c && !was.passed.split(',').includes(c));
    if (newly.length === 1) toast('ผ่าน Mission ' + missionStats(state, newly[0] as Group).short + ' แล้ว! 🎉');
    else if (state.settings.level === 'auto' && !activeMission(state) && opened === was.opened + 1) {
      toast('เปิดระดับ' + LEVEL_TH[LEVELS[opened - 1].k] + 'แล้ว! ต่อไปจะมีประโยคที่ยาวขึ้นนิดนึง');
    }
  }, [passed, opened]); // eslint-disable-line react-hooks/exhaustive-deps
}
