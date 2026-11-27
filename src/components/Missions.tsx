import { useEffect, useRef } from 'react';
import { LEVELS, type Group, type Level } from '../data/content';
import { useProgress } from '../state/progress';
import { useToast } from '../state/toast';
import { activeMission, allMissions, missionStats } from '../lib/missions';
import { levelStatus } from '../pages/practice';

const LEVEL_TH: Record<Level, string> = { easy: 'ง่าย', medium: 'กลาง', hard: 'ยาก' };

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
