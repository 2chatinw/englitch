import { useEffect, useMemo, useRef } from 'react';
import { PHRASES } from '../data/content';
import { Icon } from '../components/Icon';
import { NextButton, Result, SpeakButton, WordDiff } from '../components/ui';
import { useProgress } from '../state/progress';
import { Story } from '../components/Story';
import { Explain, ExplainJump } from '../components/Explain';
import { useSession } from '../state/session';
import { compare, firstLetters, type Comparison } from '../lib/compare';
import { useToast } from '../state/toast';
import { shuffle } from '../lib/util';
import { pickSentence } from './practice';

/** `n`: sentences done in this visit, for the story dashes (sets of 10) */
interface Sess { id: string; typed: string; hint: 0 | 1 | 2; result: Comparison | null; scored?: boolean; n?: number }
const SET = 10;
const byId = new Map(PHRASES.map((p) => [p.e, p]));

/**
 * Writing: read the Thai, type the English sentence. Hints come in two steps (first letters, then the words
 * shuffled, which can be tapped into the answer). Checked word by word like the listening mode.
 */
export default function Write() {
  const { state, gain, remember } = useProgress();
  const toast = useToast();
  const [s, setS] = useSession<Sess>('write', () => ({ id: pickSentence(state).e, typed: '', hint: 0, result: null }));
  const p = byId.get(s.id)!;
  const input = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  // words without end punctuation, so the last word isn't given away by its full stop
  const bank = useMemo(() => shuffle(p.e.split(/\s+/).map((w) => w.replace(/[.,!?]+$/, ''))), [p.e]);
  // a word chip is used up once the answer already has that word as many times as the chips before it (owner: a
  // word can't be added twice); deleting it from the answer frees the chip again
  const norm = (w: string) => w.toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9']/g, '');
  const used = useMemo(() => {
    const have = new Map<string, number>();
    for (const w of s.typed.split(/\s+/).map(norm).filter(Boolean)) have.set(w, (have.get(w) ?? 0) + 1);
    return bank.map((w) => { const k = norm(w), n = have.get(k) ?? 0; if (n > 0) { have.set(k, n - 1); return true; } return false; });
  }, [bank, s.typed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (s.result) nextBtn.current?.focus();
    else input.current?.focus({ preventScroll: true });
  }, [s.result, s.id]);

  const check = () => {
    const val = s.typed.trim();
    if (!val) { toast('พิมพ์ประโยคภาษาอังกฤษก่อน'); input.current?.focus(); return; }
    const r = compare(p.e, val);
    if (!s.scored) {
      gain('write', r.score === 1 ? 5 : 1);
      remember(p.e, r.score === 1 && s.hint < 2);
    }
    setS({ ...s, result: r, scored: true });
  };
  const next = () => {
    const n = pickSentence(state, p.e);
    setS({ id: n.e, typed: '', hint: 0, result: null, n: (s.n ?? 0) + 1 });
  };
  const addWord = (w: string) => {
    setS({ ...s, typed: (s.typed.trimEnd() + ' ' + w).trimStart() });
    input.current?.focus();
  };

  const ok = s.result ? (s.result.score === 1 ? (s.result.exact ? true : 'near') : false) : false;

  const hintLabel = s.hint === 0 ? 'ขอคำใบ้' : s.hint === 1 ? 'ดูคำที่ใช้' : 'ใช้คำใบ้ครบแล้ว';

  return (
    <div className="page">
      <Story route="write" set={{ total: SET, done: (s.n ?? 0) % SET }} onSwipeUp={s.result ? next : undefined}
        side={s.result ? <Explain key={p.e} phrase={p} /> : null}
        sheet={!s.result ? (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); check(); }}>
            {s.hint >= 1 ? (
              <div className="hint-box">
                <span className="hint-letters">{firstLetters(p.e)}</span>
                {s.hint >= 2 ? (
                  <div className="word-bank" role="group" aria-label="คำที่ใช้ในประโยค แตะเพื่อเติม">
                    {bank.map((w, i) => (
                      <button key={w + i} type="button" className={'chip' + (used[i] ? ' is-used' : '')} disabled={used[i]}
                        aria-label={used[i] ? w + ' (ใช้แล้ว)' : 'เติมคำ ' + w} onClick={() => addWord(w)}>{w}</button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}
            <label className="sr-only" htmlFor="write-input">ประโยคภาษาอังกฤษ</label>
            <input id="write-input" ref={input} type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder="พิมพ์ประโยคภาษาอังกฤษที่นี่" value={s.typed} onChange={(e) => setS({ ...s, typed: e.target.value })} />
            <div className="story-row">
              <button type="button" className="story-icon-btn" disabled={s.hint >= 2} title={hintLabel} aria-label={hintLabel}
                onClick={() => setS({ ...s, hint: (Math.min(2, s.hint + 1) as 0 | 1 | 2) })}><Icon name="bulb" /></button>
              <button type="submit" className="btn btn-primary grow">ตรวจคำตอบ</button>
              <button type="button" className="story-icon-btn" onClick={next}>ข้าม</button>
            </div>
          </form>
        ) : (
          <>
            <Result ok={ok} title={ok === true ? 'ถูกต้องทั้งประโยค' : ok === 'near' ? 'ถูกแล้ว สะกดพลาดนิดหน่อย' : 'ถูก ' + Math.round(s.result.score * 100) + '% เทียบกับประโยคตัวอย่างด้านล่าง'}>
              <WordDiff r={s.result} />
              <p className="small muted">คุณเขียน: {s.typed}</p>
              {p.n ? <p className="small">{p.n}</p> : null}
              {ok === false ? <p className="small muted">ถ้าความหมายเหมือนกันแต่ใช้คำต่างไป ก็พูดแบบนั้นได้เหมือนกัน ลองจำแบบตัวอย่างไว้อีกแบบ</p> : null}
              <div className="row"><SpeakButton text={p.s} label="ฟังประโยคนี้" /></div>
            </Result>
            <ExplainJump />
            <div className="story-row">
              <NextButton auto={ok !== false} btnRef={nextBtn} onNext={next}>ประโยคต่อไป <Icon name="arrow" /></NextButton>
              {ok !== true ? <button type="button" className="story-icon-btn" onClick={() => setS({ ...s, result: null })}><Icon name="retry" /> แก้</button> : null}
            </div>
          </>
        )}>
        <span className="kicker">เขียนเป็นภาษาอังกฤษ</span>
        <p className="story-big">{p.t}</p>
        <p className="muted small">ไม่ต้องสนใจตัวพิมพ์ใหญ่และเครื่องหมายวรรคตอน</p>
      </Story>
    </div>
  );
}
