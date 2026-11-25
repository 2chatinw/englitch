import { LEVELS, PHRASES, SENTENCES, type Level, type Phrase } from '../data/content';
import type { State } from '../state/progress';
import { pick, today } from '../lib/util';

/** How many sentences of a level must be answered right (at least once) to open the next level. */
export const UNLOCK: Record<Exclude<Level, 'easy'>, { from: Level; need: number }> = {
  medium: { from: 'easy', need: 25 },
  hard: { from: 'medium', need: 20 },
};

const learnedIn = (state: State, lv: Level) => SENTENCES.filter((p) => p.l === lv && (state.srs[p.e]?.b ?? 0) >= 1).length;

/** Where the player stands: which levels are open, and how far they are from opening the next one. */
export function levelStatus(state: State) {
  const open: Level[] = ['easy'];
  if (learnedIn(state, 'easy') >= UNLOCK.medium.need) open.push('medium');
  if (open.includes('medium') && learnedIn(state, 'medium') >= UNLOCK.hard.need) open.push('hard');
  const top = open[open.length - 1];
  const next = LEVELS.find((x) => !open.includes(x.k))?.k as Exclude<Level, 'easy'> | undefined;
  const fixed = state.settings.level === 'auto' ? null : state.settings.level;
  return {
    open, top, next, fixed,
    /** right-answered sentences of the level that opens `next`, and how many it takes */
    have: next ? learnedIn(state, UNLOCK[next].from) : 0,
    need: next ? UNLOCK[next].need : 0,
  };
}

/** The levels being practised now: the one chosen in settings, or every level opened so far. */
export function activeLevels(state: State): Level[] {
  const st = levelStatus(state);
  return st.fixed ? [st.fixed] : st.open;
}

/** Phrases (slang included) for the reading mode at the active levels. */
export function phrasePool(state: State): Phrase[] {
  const lv = activeLevels(state);
  return PHRASES.filter((p) => lv.includes(p.l));
}

/**
 * Next sentence to practise, from the active levels: about half the time one that is due for review
 * (missed before, or its review day has come), otherwise mostly ones not met yet — in auto mode
 * leaning on the newest level opened, so a level-up is felt straight away.
 */
export function pickSentence(state: State, prev?: string): Phrase {
  const t = today();
  const lv = activeLevels(state);
  const pool = SENTENCES.filter((p) => lv.includes(p.l) && p.e !== prev);
  const due = pool.filter((p) => state.srs[p.e] && state.srs[p.e].d <= t);
  const unseen = pool.filter((p) => !state.srs[p.e]);
  const newest = unseen.filter((p) => p.l === lv[lv.length - 1]);
  const r = Math.random();
  if (due.length && r < 0.5) return pick(due);
  if (unseen.length && r < 0.85) return pick(newest.length && Math.random() < 0.7 ? newest : unseen);
  return pick(pool.length ? pool : SENTENCES);
}
