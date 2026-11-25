import { LEVELS, PHRASES, SENTENCES, type Level, type Phrase } from '../data/content';
import type { State } from '../state/progress';
import { pick, today } from '../lib/util';
import { activeMission, missionStats, readOnlyMission } from '../lib/missions';

/** Mixed practice (no mission): right answers needed at one level to open the next (auto mode). */
export const UNLOCK: Record<Exclude<Level, 'easy'>, { from: Level; need: number }> = {
  medium: { from: 'easy', need: 25 },
  hard: { from: 'medium', need: 20 },
};

const learnedIn = (state: State, lv: Level) => SENTENCES.filter((p) => p.l === lv && (state.srs[p.e]?.b ?? 0) >= 1).length;

/** Levels opened so far in mixed practice, and the level chosen in settings (if any). */
export function levelStatus(state: State) {
  const open: Level[] = ['easy'];
  if (learnedIn(state, 'easy') >= UNLOCK.medium.need) open.push('medium');
  if (open.includes('medium') && learnedIn(state, 'medium') >= UNLOCK.hard.need) open.push('hard');
  const next = LEVELS.find((x) => !open.includes(x.k))?.k as Exclude<Level, 'easy'> | undefined;
  const fixed = state.settings.level === 'auto' ? null : state.settings.level;
  return { open, top: open[open.length - 1], next, fixed };
}

/**
 * What can come up now. With a mission: that topic only, every level (the mission walks from short to
 * long sentences by itself), or just the level fixed in settings. Without one: every topic, at the
 * levels opened so far (or the fixed level).
 */
function pool(state: State, withSlang: boolean): Phrase[] {
  const m = activeMission(state);
  const st = levelStatus(state);
  const base = withSlang ? PHRASES : SENTENCES;
  if (m && (withSlang || !readOnlyMission(m))) {
    const inMission = base.filter((p) => p.c === m);
    const fixed = st.fixed ? inMission.filter((p) => p.l === st.fixed) : [];
    return fixed.length ? fixed : inMission;
  }
  const lv = st.fixed ? [st.fixed] : st.open;
  return base.filter((p) => lv.includes(p.l));
}

/** Phrases (slang included) for the reading mode. */
export const phrasePool = (state: State) => pool(state, true);

/**
 * Next sentence: about half the time one due for review, otherwise mostly one not met yet — in a
 * mission from its current stage (the shortest sentences not done), in mixed practice leaning on the
 * newest level opened.
 */
export function pickSentence(state: State, prev?: string): Phrase {
  const t = today();
  const all = pool(state, false).filter((p) => p.e !== prev);
  const due = all.filter((p) => state.srs[p.e] && state.srs[p.e].d <= t);
  const unseen = all.filter((p) => !state.srs[p.e]);
  const m = activeMission(state);
  const stage = m && !readOnlyMission(m) ? missionStats(state, m).stage : levelStatus(state).top;
  const focus = unseen.filter((p) => p.l === stage);
  // in a mission, sentences answered wrong before also count as "not done" for the stage
  const notDone = m ? all.filter((p) => (state.srs[p.e]?.b ?? 0) < 1 && p.l === stage) : [];
  const r = Math.random();
  if (due.length && r < 0.5) return pick(due);
  if (r < 0.85) {
    if (notDone.length) return pick(notDone);
    if (unseen.length) return pick(focus.length && Math.random() < 0.7 ? focus : unseen);
  }
  return pick(all.length ? all : SENTENCES);
}
