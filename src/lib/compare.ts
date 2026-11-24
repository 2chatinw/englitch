/** Word-level comparison used by listening (typed) and speaking (recognized) practice. */

const CONTR: Record<string, string> = {
  "i'm": 'i am', "you're": 'you are', "it's": 'it is', "that's": 'that is', "don't": 'do not',
  "can't": 'can not', cannot: 'can not', "i'll": 'i will', "we'll": 'we will', "what's": 'what is',
  "let's": 'let us', "we're": 'we are', "they're": 'they are', "isn't": 'is not', "won't": 'will not',
  "didn't": 'did not', "doesn't": 'does not', "i've": 'i have', "he's": 'he is', "she's": 'she is',
  "there's": 'there is', "where's": 'where is', "how's": 'how is', gonna: 'going to', wanna: 'want to',
  // Same contractions typed without the apostrophe (common on phone keyboards).
  im: 'i am', youre: 'you are', its: 'it is', thats: 'that is', dont: 'do not', cant: 'can not',
  whats: 'what is', lets: 'let us', theyre: 'they are', isnt: 'is not', didnt: 'did not',
  doesnt: 'does not', ive: 'i have', theres: 'there is', wheres: 'where is', hows: 'how is',
};
const NUMS: Record<string, string> = {
  '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five',
  '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine', '10': 'ten',
};

export function words(s: string): string[] {
  return String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/).filter(Boolean)
    .flatMap((w) => (CONTR[w] || NUMS[w] || w).split(' '))
    .map((w) => w.replace(/'/g, '')).filter(Boolean);
}

function lev(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

/** 0 = no match, 1 = near (a small spelling slip), 2 = exact. */
function sim(a: string, b: string): 0 | 1 | 2 {
  if (a === b) return 2;
  if (a.length < 4 || b.length < 4) return 0;
  const allowed = Math.max(a.length, b.length) >= 7 ? 2 : 1;
  return lev(a, b) <= allowed ? 1 : 0;
}

export type Mark = 'ok' | 'near' | 'miss';
export interface Comparison { toks: string[]; marks: Mark[]; score: number; exact: boolean }

export function compare(target: string, said: string): Comparison {
  const toks = target.split(/\s+/).filter(Boolean);
  const tw: { w: string; i: number }[] = [];
  toks.forEach((tok, i) => words(tok).forEach((w) => tw.push({ w, i })));
  const gw = words(said);
  const n = tw.length, m = gw.length;
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = sim(tw[i].w, gw[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const hit: (0 | 1 | 2)[] = new Array(n).fill(0);
  let i = 0, j = 0;
  while (i < n && j < m) {
    const s = sim(tw[i].w, gw[j]);
    if (s && dp[i][j] === dp[i + 1][j + 1] + 1) { hit[i] = s; i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  const marks: Mark[] = toks.map(() => 'ok');
  tw.forEach((x, k) => {
    if (hit[k] === 0) marks[x.i] = 'miss';
    else if (hit[k] === 1 && marks[x.i] !== 'miss') marks[x.i] = 'near';
  });
  const matched = hit.filter(Boolean).length;
  const score = n ? matched / n : 0;
  return { toks, marks, score, exact: score === 1 && hit.every((h) => h === 2) && m === n };
}

/** "I'm good, thanks." -> "I'm g___, t_____." */
export function firstLetters(s: string): string {
  return s.replace(/[A-Za-z]+/g, (w) => w[0] + '_'.repeat(Math.max(0, w.length - 1)));
}
