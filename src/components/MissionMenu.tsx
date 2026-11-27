import type { Group } from '../data/content';
import { useProgress } from '../state/progress';
import { clearSessions } from '../state/session';
import { activeMission, missionStats } from '../lib/missions';
import { setCategoryOpen } from '../lib/lobby';
import { navigate } from '../lib/router';

/** Switch the mission; the practice pages start fresh with sentences from the new category. */
export function useChooseMission() {
  const { setSettings } = useProgress();
  return (c: Group | null) => { clearSessions(); setSettings({ mission: c }); };
}

/**
 * Small label next to the practice menus saying which category the menu practises; tapping it goes back to
 * the lobby's eight category circles to pick another. `place` picks the look: under the desktop rail, or above
 * the phone tab bar.
 */
export function MissionTag({ place }: { place: 'rail' | 'bottom' }) {
  const { state } = useProgress();
  const active = activeMission(state);
  const cur = active ? missionStats(state, active) : null;
  return (
    <button type="button" className={'mtag mtag-' + place}
      aria-label={'กำลังฝึก ' + (cur ? 'หมวด' + cur.name : 'รวมทุกหมวด') + ' แตะเพื่อเลือกหมวดอื่น'}
      onClick={() => { setCategoryOpen(false); navigate('today'); }}>
      <small>{place === 'rail' ? 'ฝึกหมวด' : 'กำลังฝึก'}</small>
      <span><span aria-hidden="true">{cur ? cur.icon : '🌏'}</span> {cur ? cur.short : 'ทุกหมวด'}</span>
    </button>
  );
}
