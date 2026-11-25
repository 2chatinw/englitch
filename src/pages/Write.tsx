import { useEffect, useMemo, useRef } from 'react';
import { PHRASES } from '../data/content';
import { Icon } from '../components/Icon';
import { Bar, MissionDone, MissionPill, PageHead, Result, SpeakButton, WordDiff } from '../components/ui';
import { useProgress } from '../state/progress';
import { useSession } from '../state/session';
import { compare, firstLetters, type Comparison } from '../lib/compare';
import { useToast } from '../state/toast';
import { shuffle } from '../lib/util';
import { pickSentence } from './practice';

interface Sess { id: string; typed: string; hint: 0 | 1 | 2; result: Comparison | null; scored?: boolean }
const byId = new Map(PHRASES.map((p) => [p.e, p]));

/**
 * Writing: read the Thai, type the English sentence. Hints come in two steps (first letters, then the words
 * shuffled, which can be tapped into the answer). Checked word by word like the listening mode.
 */
export default function Write() {
  const { state, day, gain, remember } = useProgress();
  const toast = useToast();
  const [s, setS] = useSession<Sess>('write', () => ({ id: pickSentence(state).e, typed: '', hint: 0, result: null }));
  const p = byId.get(s.id)!;
  const input = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);
  // words without end punctuation, so the last word isn't given away by its full stop
  const bank = useMemo(() => shuffle(p.e.split(/\s+/).map((w) => w.replace(/[.,!?]+$/, ''))), [p.e]);

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
    setS({ id: n.e, typed: '', hint: 0, result: null });
  };
  const addWord = (w: string) => {
    setS({ ...s, typed: (s.typed.trimEnd() + ' ' + w).trimStart() });
    input.current?.focus();
  };

  const ok = s.result ? (s.result.score === 1 ? (s.result.exact ? true : 'near') : false) : false;

  return (
    <div className="page">
      <PageHead route="write" aside={<MissionPill k="write" />}>
        อ่านภาษาไทย แล้วเขียนเป็นประโยคภาษาอังกฤษ ไม่ต้องสนใจตัวพิมพ์ใหญ่และเครื่องหมายวรรคตอน
      </PageHead>
      <MissionDone k="write" />
      <section className="card play" data-reveal>
        <Bar value={Math.min(1, day.write / 10)} label="ภารกิจฝึกเขียนวันนี้" />
        <div className="say-line">
          <span className="kicker">เขียนเป็นภาษาอังกฤษ</span>
          <p className="say-en write-th">{p.t}</p>
          <div className="row center">
            <button type="button" className="btn btn-ghost btn-sm" disabled={s.hint >= 2 || !!s.result}
              onClick={() => setS({ ...s, hint: (Math.min(2, s.hint + 1) as 0 | 1 | 2) })}>
              <Icon name="bulb" /> {s.hint === 0 ? 'ขอคำใบ้' : s.hint === 1 ? 'ดูคำที่ใช้' : 'ใช้คำใบ้ครบแล้ว'}
            </button>
          </div>
        </div>
        {s.hint >= 1 && !s.result ? (
          <div className="hint-box">
            <span className="hint-letters">{firstLetters(p.e)}</span>
            {s.hint >= 2 ? (
              <div className="word-bank" role="group" aria-label="คำที่ใช้ในประโยค แตะเพื่อเติม">
                {bank.map((w, i) => <button key={w + i} type="button" className="chip" onClick={() => addWord(w)}>{w}</button>)}
              </div>
            ) : null}
          </div>
        ) : null}

        {!s.result ? (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); check(); }}>
            <label className="sr-only" htmlFor="write-input">ประโยคภาษาอังกฤษ</label>
            <input id="write-input" ref={input} type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder="พิมพ์ประโยคภาษาอังกฤษที่นี่" value={s.typed} onChange={(e) => setS({ ...s, typed: e.target.value })} />
            <div className="row">
              <button type="submit" className="btn btn-primary grow">ตรวจคำตอบ</button>
              <button type="button" className="btn btn-ghost" onClick={next}>ข้าม</button>
            </div>
          </form>
        ) : (
          <>
            <Result ok={ok} title={ok === true ? 'ถูกต้องทั้งประโยค +5 XP' : ok === 'near' ? 'ถูกแล้ว สะกดพลาดนิดหน่อย +5 XP' : 'ถูก ' + Math.round(s.result.score * 100) + '% เทียบกับประโยคตัวอย่างด้านล่าง'}>
              <WordDiff r={s.result} />
              <p className="small muted">คุณเขียน: {s.typed}</p>
              {p.n ? <p className="small">{p.n}</p> : null}
              {ok === false ? <p className="small muted">ถ้าความหมายเหมือนกันแต่ใช้คำต่างไป ก็พูดแบบนั้นได้เหมือนกัน ลองจำแบบตัวอย่างไว้อีกแบบ</p> : null}
              <div className="row"><SpeakButton text={p.s} label="ฟังประโยคนี้" /></div>
            </Result>
            <div className="row">
              <button type="button" className="btn btn-primary grow" ref={nextBtn} onClick={next}>ประโยคต่อไป <Icon name="arrow" /></button>
              {ok !== true ? <button type="button" className="btn btn-ghost" onClick={() => setS({ ...s, result: null })}><Icon name="retry" /> แก้คำตอบ</button> : null}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
