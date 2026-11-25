import { useEffect, useRef } from 'react';
import { PHRASES } from '../data/content';
import { Icon } from '../components/Icon';
import { Bar, MissionDone, MissionPill, PageHead, Result, SpeakButton, WordDiff } from '../components/ui';
import { useProgress } from '../state/progress';
import { useSession } from '../state/session';
import { compare, firstLetters, type Comparison } from '../lib/compare';
import { say } from '../lib/speech';
import { useToast } from '../state/toast';
import { pickSentence } from './practice';

interface Sess { id: string; typed: string; hint: 0 | 1 | 2; result: Comparison | null; started: boolean; plays: number; scored?: boolean }
const byId = new Map(PHRASES.map((p) => [p.e, p]));

export default function Listen() {
  const { state, day, gain, remember } = useProgress();
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
    setS({ id: n.e, typed: '', hint: 0, result: null, started: true, plays: state.settings.autoPlay ? 1 : 0 });
  };

  const ok = s.result ? (s.result.score === 1 ? (s.result.exact ? true : 'near') : false) : false;

  return (
    <div className="page">
      <PageHead route="listen" aside={<MissionPill k="listen" />}>
        กดฟัง แล้วพิมพ์ประโยคที่ได้ยิน ไม่ต้องสนใจตัวพิมพ์ใหญ่และเครื่องหมายวรรคตอน
      </PageHead>
      <MissionDone k="listen" />
      <section className="card play" data-reveal>
        <Bar value={Math.min(1, day.listen / 10)} label="ภารกิจฝึกฟังวันนี้" />
        <div className="listen-deck">
          <button type="button" className="play-btn" onClick={() => play()} aria-label="ฟังประโยค">
            <Icon name="speaker" size={34} />
          </button>
          <div className="listen-side">
            <span className="kicker">{s.started ? 'ฟังกี่รอบก็ได้' : 'เริ่มจากกดปุ่มฟัง'}</span>
            <div className="row">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => play(true)}><Icon name="slow" /> ฟังช้า</button>
              <button type="button" className="btn btn-ghost btn-sm" disabled={s.hint >= 2 || !!s.result}
                onClick={() => setS({ ...s, hint: (Math.min(2, s.hint + 1) as 0 | 1 | 2) })}>
                <Icon name="bulb" /> {s.hint === 0 ? 'ขอคำใบ้' : s.hint === 1 ? 'ดูคำแปลด้วย' : 'ใช้คำใบ้ครบแล้ว'}
              </button>
            </div>
          </div>
        </div>
        {s.hint >= 1 && !s.result ? (
          <div className="hint-box">
            <span className="hint-letters">{firstLetters(p.e)}</span>
            {s.hint >= 2 ? <span className="muted">ความหมาย: {p.t}</span> : null}
          </div>
        ) : null}

        {!s.result ? (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); check(); }}>
            <label className="sr-only" htmlFor="listen-input">ประโยคที่ได้ยิน</label>
            <input id="listen-input" ref={input} type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder="พิมพ์สิ่งที่ได้ยินที่นี่" value={s.typed} onChange={(e) => setS({ ...s, typed: e.target.value })} />
            <div className="row">
              <button type="submit" className="btn btn-primary grow">ตรวจคำตอบ</button>
              <button type="button" className="btn btn-ghost" onClick={next}>ข้าม</button>
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
