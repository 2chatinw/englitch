import { CATS, LEVELS, PHRASES, type Category, type Level, type Phrase } from '../data/content';
import type { State } from '../state/progress';

/**
 * Missions = the phrase topics. A mission is passed once every phrase in its topic has been answered
 * right at least once, in any mode. Nothing resets daily. Inside a mission the sentences go from short
 * to long (easy → medium → hard), so each mission has three stages.
 */
export const MISSION_ORDER: Category[] = ['basics', 'help', 'game', 'callout', 'react', 'friend', 'slang'];

export const MISSION_ICON: Record<Category, string> = {
  basics: '👋', help: '🆘', game: '🎮', callout: '📣', react: '😆', friend: '🤝', slang: '💬',
};

/** Short names for chips and the menu. */
export const MISSION_SHORT: Record<Category, string> = {
  basics: 'ทักทาย', help: 'ฟังไม่ทัน', game: 'ระหว่างเกม', callout: 'คอลในเกม', react: 'รีแอคชัน', friend: 'หาเพื่อน', slang: 'ศัพท์แชต',
};

/** The slang mission is single words, so it is practised by reading only. */
export const readOnlyMission = (c: Category | null) => c === 'slang';

export const isKnown = (state: State, p: Phrase) => (state.srs[p.e]?.b ?? 0) >= 1;

export interface MissionStats {
  c: Category; name: string; short: string; icon: string;
  total: number; done: number; complete: boolean;
  /** per level, only levels this topic has */
  stages: { k: Level; total: number; done: number }[];
  /** the first level not finished yet (where new sentences come from), or null when passed */
  stage: Level | null;
}

export function missionStats(state: State, c: Category): MissionStats {
  const all = PHRASES.filter((p) => p.c === c);
  const stages = LEVELS.map(({ k }) => {
    const ps = all.filter((p) => p.l === k);
    return { k, total: ps.length, done: ps.filter((p) => isKnown(state, p)).length };
  }).filter((s) => s.total > 0);
  const done = all.filter((p) => isKnown(state, p)).length;
  return {
    c, name: CATS[c], short: MISSION_SHORT[c], icon: MISSION_ICON[c],
    total: all.length, done, complete: done === all.length,
    stages, stage: stages.find((s) => s.done < s.total)?.k ?? null,
  };
}

export const allMissions = (state: State) => MISSION_ORDER.map((c) => missionStats(state, c));

/** The mission picked on the Today page, or null for mixed practice from every topic. */
export function activeMission(state: State): Category | null {
  const m = state.settings.mission;
  return m && MISSION_ORDER.includes(m) ? m : null;
}
