import { useEffect, useRef } from 'react';
import { PHRASES } from '../data/content';
import { Icon } from '../components/Icon';
import { NextButton, Result, SpeakButton, WordDiff } from '../components/ui';
import { useProgress } from '../state/progress';
import { Story, StoryButton } from '../components/Story';
import { useSession } from '../state/session';
import { compare, firstLetters, type Comparison } from '../lib/compare';
import { say } from '../lib/speech';
import { useToast } from '../state/toast';
import { pickSentence } from './practice';

/** `n`: sentences done in this visit, for the story dashes (sets of 10) */
interface Sess { id: string; typed: string; hint: 0 | 1 | 2; result: Comparison | null; started: boolean; plays: number; scored?: boolean; n?: number }
const SET = 10;
const byId = new Map(PHRASES.map((p) => [p.e, p]));

export default function Listen() {
  const { state, gain, remember } = useProgress();
  const toast = useToast();
  const [s, setS] = useSession<Sess>('listen', () => ({ id: pickSentence(state).e, typed: '', hint: 0, result: null, started: false, plays: 0 }));
  const p = byId.get(s.id)!;
  const input = useRef<HTMLInputElement>(null);
  const nextBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (s.result) nextBtn.current?.focus();
    else if (s.started) input.current?.focus();
  }, [s.result, s.started, s.id]);

  const play = (slow = false) => {
    if (!say(p.e, slow)) toast('อุปกรณ์นี้อ่านออกเสียงไม่ได้');
    setS({ ...s, started: true, plays: s.plays + 1 });
  };
  const check = () => {
    const val = s.typed.trim();
    if (!val) { toast('พิมพ์ประโยคที่ได้ยินก่อน'); input.current?.focus(); return; }
    const r = compare(p.e, val);
    if (!s.scored) { gain('listen', r.score === 1 ? 5 : 1); remember(p.e, r.score === 1 && s.hint < 2); }
    setS({ ...s, result: r, scored: true });
  };
  const next = () => {
    const n = pickSentence(state, p.e);
    if (state.settings.autoPlay) say(n.e);
    setS({ id: n.e, typed: '', hint: 0, result: null, started: true, plays: state.settings.autoPlay ? 1 : 0, n: (s.n ?? 0) + 1 });
  };

  const ok = s.result ? (s.result.score === 1 ? (s.result.exact ? true : 'near') : false) : false;

  const hintLabel = s.hint === 0 ? 'ขอคำใบ้' : s.hint === 1 ? 'ดูคำแปลด้วย' : 'ใช้คำใบ้ครบแล้ว';

  return (
    <div className="page">
      <Story route="listen" set={{ total: SET, done: (s.n ?? 0) % SET }} onSwipeUp={s.result ? next : undefined}
        sheet={!s.result ? (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); check(); }}>
            {s.hint >= 1 ? (
              <div className="hint-box">
                <span className="hint-letters">{firstLetters(p.e)}</span>
                {s.hint >= 2 ? <span className="muted">ความหมาย: {p.t}</span> : null}
              </div>
            ) : null}
            <label className="sr-only" htmlFor="listen-input">ประโยคที่ได้ยิน</label>
            <input id="listen-input" ref={input} type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder="พิมพ์สิ่งที่ได้ยินที่นี่" value={s.typed} onChange={(e) => setS({ ...s, typed: e.target.value })} />
            <div className="story-row">
              <button type="button" className="story-icon-btn" disabled={s.hint >= 2} title={hintLabel} aria-label={hintLabel}
                onClick={() => setS({ ...s, hint: (Math.min(2, s.hint + 1) as 0 | 1 | 2) })}><Icon name="bulb" /></button>
              <button type="submit" className="btn btn-primary grow">ตรวจคำตอบ</button>
              <button type="button" className="story-icon-btn" onClick={next}>ข้าม</button>
            </div>
          </form>
        ) : (
          <>
            <Result ok={ok} title={ok === true ? 'ถูกต้องทั้งประโยค' : ok === 'near' ? 'ถูกแล้ว สะกดพลาดนิดหน่อย' : 'ถูก ' + Math.round(s.result.score * 100) + '% ลองดูคำที่ขีดเส้นใต้'}>
              <WordDiff r={s.result} />
              <p className="small muted">คุณพิมพ์: {s.typed}</p>
              <p>{p.t}</p>
              <div className="row"><SpeakButton text={p.e} label="ฟังอีกครั้ง" /></div>
            </Result>
            <div className="story-row">
              <NextButton auto={ok !== false} btnRef={nextBtn} onNext={next}>ประโยคต่อไป <Icon name="arrow" /></NextButton>
              {ok !== true ? <button type="button" className="story-icon-btn" onClick={() => setS({ ...s, result: null })}><Icon name="retry" /> แก้</button> : null}
            </div>
          </>
        )}>
        <StoryButton label="ฟังประโยค (แตะค้างเพื่อฟังช้า)" onClick={() => play()} onLongPress={() => play(true)}>
          <Icon name="speaker" />
        </StoryButton>
        <p className="story-sub">{s.result ? 'ฟังอีกครั้งได้' : s.started ? 'ฟังกี่รอบก็ได้' : 'แตะเพื่อฟัง'}</p>
        <div className="story-chips">
          <button type="button" className="story-chip" onClick={() => play(true)}><Icon name="slow" /> ฟังช้า</button>
        </div>
        <p className="muted small">พิมพ์ตามที่ได้ยิน ไม่ต้องสนใจตัวพิมพ์ใหญ่และเครื่องหมาย</p>
      </Story>
    </div>
  );
}
