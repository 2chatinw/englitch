import type { Group } from '../data/content';
import { useProgress } from '../state/progress';
import { clearSessions } from '../state/session';

/** Switch the mission; the practice pages start fresh with sentences from the new category. */
export function useChooseMission() {
  const { setSettings } = useProgress();
  return (c: Group | null) => { clearSessions(); setSettings({ mission: c }); };
}
