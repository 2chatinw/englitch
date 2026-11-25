import { SENTENCES, type Phrase } from '../data/content';
import type { State } from '../state/progress';
import { pick, today } from '../lib/util';

/**
 * Next sentence to practise: about half the time one that is due for review (missed before, or its
 * review day has come), otherwise mostly ones not met yet, so every mode keeps bringing in new sentences.
 */
export function pickSentence(state: State, prev?: string): Phrase {
  const t = today();
  const pool = SENTENCES.filter((p) => p.e !== prev);
  const due = pool.filter((p) => state.srs[p.e] && state.srs[p.e].d <= t);
  const unseen = pool.filter((p) => !state.srs[p.e]);
  const r = Math.random();
  if (due.length && r < 0.5) return pick(due);
  if (unseen.length && r < 0.85) return pick(unseen);
  return pick(pool.length ? pool : SENTENCES);
}
