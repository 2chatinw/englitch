import { useEffect, useRef } from 'react';
import { LEVELS, type Category, type Level } from '../data/content';
import { Icon } from './Icon';
import { useProgress } from '../state/progress';
import { useToast } from '../state/toast';
import { PAGES, navigate, type Route } from '../lib/router';
import { activeMission, allMissions, missionStats, readOnlyMission, type MissionStats } from '../lib/missions';
import { levelStatus } from '../pages/practice';

const LEVEL_TH: Record<Level, string> = { easy: 'ง่าย', medium: 'กลาง', hard: 'ยาก' };
const MODES: Route[] = ['listen', 'speak', 'read', 'write'];

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

/**
 * Top of a practice card: the mission's three-stage bar, a "passed" note once every phrase is done,
 * and — for the slang mission on a mode that can't use single words — a pointer to the reading mode.
 */
export function MissionStrip({ route }: { route: Route }) {
  const { state } = useProgress();
  const c = activeMission(state);
  if (!c) return null;
  const m = missionStats(state, c);
  if (readOnlyMission(c) && route !== 'read') {
    return (
      <div className="mission-done" role="status">
        <span className="mission-done-ic" aria-hidden="true">{m.icon}</span>
        <span className="mission-done-txt">
          <b>Mission {m.short} ฝึกในโหมดอ่าน</b>
          <span>ศัพท์แชตเป็นคำย่อสั้น ๆ ตอนนี้โหมดนี้เลยสุ่มประโยคจากทุกหมวดให้แทน</span>
        </span>
        <a className="btn btn-primary btn-sm" href="#read">ไปโหมดอ่าน <Icon name="arrow" /></a>
      </div>
    );
  }
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

/** Today page: every topic as a mission card; the chosen one opens its four practice modes. */
export function MissionBoard() {
  const { state, setSettings } = useProgress();
  const active = activeMission(state);
  const ms = allMissions(state);
  const passed = ms.filter((m) => m.complete).length;
  const choose = (c: Category | null) => setSettings({ mission: c });

  return (
    <section className="card" data-reveal aria-labelledby="mboard-h">
      <div className="section-head">
        <h2 id="mboard-h">Mission</h2>
        <span className="muted small">ผ่านแล้ว <b className="num">{passed}</b> จาก {ms.length}</span>
      </div>
      <ul className="mboard">
        {ms.map((m) => {
          const on = m.c === active;
          return (
            <li key={m.c} className={'mcard' + (on ? ' is-on' : '') + (m.complete ? ' is-done' : '')}>
              <button type="button" className="mcard-pick" aria-pressed={on} onClick={() => choose(on ? null : m.c)}>
                <span className="mcard-icon" aria-hidden="true">{m.icon}</span>
                <span className="mcard-body">
                  <span className="mcard-title">{m.name}</span>
                  <span className="mcard-meta">
                    {m.complete ? <><Icon name="check" /> ผ่านแล้ว</> : <>ผ่าน <b className="num">{m.done}/{m.total}</b> ประโยค · ขั้น{LEVEL_TH[m.stage ?? 'easy']}</>}
                  </span>
                  <MissionBar m={m} />
                </span>
              </button>
              {on ? (
                <div className="mcard-modes" role="group" aria-label={'ฝึก Mission ' + m.short + ' ด้วย'}>
                  {(readOnlyMission(m.c) ? (['read'] as Route[]) : MODES).map((r) => (
                    <button key={r} type="button" className="btn btn-ghost btn-sm" onClick={() => navigate(r)}>
                      <Icon name={PAGES[r].icon} /> {PAGES[r].short}
                    </button>
                  ))}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
      <p className="muted small">
        {active ? 'แตะ Mission ที่เลือกอยู่อีกครั้งเพื่อกลับไปฝึกรวมทุกหมวด' : 'ยังไม่ได้เลือก Mission ตอนนี้ฝึกรวมทุกหมวด แตะ Mission เพื่อเริ่ม'}
      </p>
    </section>
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
    if (newly.length === 1) toast('ผ่าน Mission ' + missionStats(state, newly[0] as Category).short + ' แล้ว! 🎉');
    else if (state.settings.level === 'auto' && !activeMission(state) && opened === was.opened + 1) {
      toast('เปิดระดับ' + LEVEL_TH[LEVELS[opened - 1].k] + 'แล้ว! ต่อไปจะมีประโยคที่ยาวขึ้นนิดนึง');
    }
  }, [passed, opened]); // eslint-disable-line react-hooks/exhaustive-deps
}
