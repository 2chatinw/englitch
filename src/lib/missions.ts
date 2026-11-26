import { GROUPS, LEVELS, PHRASES, type Group, type Level, type Phrase } from '../data/content';
import type { State } from '../state/progress';

/**
 * Missions = the seven main categories (everyday, travel, gaming, business, academic, entertainment,
 * specific jobs), each practised by listening, speaking, reading and writing. A mission is passed once
 * every phrase in it has been answered right at least once, in any mode. Nothing resets daily. Inside a
 * mission the sentences go from short to long (easy → medium → hard), so each mission has three stages.
 */
export const MISSION_ORDER: Group[] = ['general', 'travel', 'gaming', 'business', 'academic', 'entertainment', 'esp'];

export const isKnown = (state: State, p: Phrase) => (state.srs[p.e]?.b ?? 0) >= 1;

export interface MissionStats {
  c: Group; name: string; en: string; short: string; icon: string; blurb: string;
  total: number; done: number; complete: boolean;
  /** per level, only levels this category has */
  stages: { k: Level; total: number; done: number }[];
  /** the first level not finished yet (where new sentences come from), or null when passed */
  stage: Level | null;
}

export function missionStats(state: State, c: Group): MissionStats {
  const all = PHRASES.filter((p) => p.g === c);
  const stages = LEVELS.map(({ k }) => {
    const ps = all.filter((p) => p.l === k);
    return { k, total: ps.length, done: ps.filter((p) => isKnown(state, p)).length };
  }).filter((s) => s.total > 0);
  const done = all.filter((p) => isKnown(state, p)).length;
  const meta = GROUPS[c];
  return {
    c, name: meta.th, en: meta.en, short: meta.short, icon: meta.icon, blurb: meta.blurb,
    total: all.length, done, complete: done === all.length,
    stages, stage: stages.find((s) => s.done < s.total)?.k ?? null,
  };
}

export const allMissions = (state: State) => MISSION_ORDER.map((c) => missionStats(state, c));

/** The mission picked on the Today page, or null for mixed practice from every category. */
export function activeMission(state: State): Group | null {
  const m = state.settings.mission;
  return m && (MISSION_ORDER as string[]).includes(m) ? m : null;
}
