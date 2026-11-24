import { SENTENCES, type Phrase } from '../data/content';
import type { State } from '../state/progress';
import { pick } from '../lib/util';

/** Sentences already met in flashcards come up more often, so practice reinforces what was learned. */
export function pickSentence(state: State, prev?: string): Phrase {
  const learned = SENTENCES.filter((p) => state.srs[p.e]);
  const src = learned.length >= 5 && Math.random() < 0.7 ? learned : SENTENCES;
  let p = pick(src);
  for (let i = 0; i < 10 && src.length > 1 && p.e === prev; i++) p = pick(src);
  return p;
}
