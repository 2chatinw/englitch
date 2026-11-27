import { useEffect, useRef, useState } from 'react';
import { PHRASES } from '../data/content';
import { Icon } from '../components/Icon';
import { Kbd, NextButton, Result, WordDiff } from '../components/ui';
import { useProgress } from '../state/progress';
import { Story } from '../components/Story';
import { Explain, ExplainJump } from '../components/Explain';
import { useSession } from '../state/session';
import { compare, type Comparison } from '../lib/compare';
import { isBrave, listen, micErrorText, micSupported, say, type Listener } from '../lib/speech';
import { useToast } from '../state/toast';
import { MicBrowsers } from '../components/MicBrowsers';
import { pickSentence } from './practice';

/** `n`: sentences done in this visit, for the story dashes (sets of 10) */
interface Sess { id: string; result: Comparison | null; said: string; scored?: boolean; typed: string; keyboard: boolean; n?: number }
const SET = 10;
const byId = new Map(PHRASES.map((p) => [p.e, p]));

export default function Speak() {
  const { state, gain, remember } = useProgress();
  const toast = useToast();
  const [s, setS] = useSession<Sess>('speak', () => ({ id: pickSentence(state).e, result: null, said: '', typed: '', keyboard: false }));
  const [live, setLive] = useState('');
  const [listening, setListening] = useState(false);
  const rec = useRef<Listener | null>(null);
  const p = byId.get(s.id)!;
  const hasMic = micSupported() && !s.keyboard;

  useEffect(() => () => rec.current?.abort(), []);

  const evaluate = (text: string) => {
    const r = compare(p.e, text);
    if (!s.scored) { gain('speak', r.score >= 0.8 ? 5 : 1); remember(p.e, r.score >= 0.8); }
    setS({ ...s, result: r, said: text, scored: true });
  };

  const toggleMic = () => {
    if (listening) { rec.current?.stop(); return; }
    setLive('');
    const l = listen({
      onPartial: (t) => setLive(t),
      onDone: (text, err) => {
        rec.current = null;
        setListening(false);
        if (text) evaluate(text);
        else {
          toast(micErrorText(err));
          if (!micSupported()) setS({ ...s, keyboard: true });
        }
      },
    });
    if (!l) { toast('เบราว์เซอร์นี้ใช้ไมค์ไม่ได้ ใช้ไมค์บนคีย์บอร์ดแทน'); setS({ ...s, keyboard: true }); return; }
    rec.current = l;
    setListening(true);
  };

  const next = () => {
    rec.current?.abort(); rec.current = null; setListening(false); setLive('');
    const n = pickSentence(state, p.e);
    if (state.settings.autoPlay) say(n.e);
    setS({ ...s, id: n.e, result: null, said: '', typed: '', scored: false, n: (s.n ?? 0) + 1 });
  };

  const pass = s.result ? s.result.score >= 0.8 : false;

  return (
    <div className="page">
      <Story route="speak" set={{ total: SET, done: (s.n ?? 0) % SET }} onSwipeUp={s.result ? next : undefined}
        side={s.result ? <Explain key={p.e} phrase={p} /> : null}
        sheet={s.result ? (
          <>
            <Result ok={pass} title={pass ? 'ชัดเจนดีมาก' : 'ได้ ' + Math.round(s.result.score * 100) + '% ลองฟังตัวอย่างแล้วพูดใหม่'}>
              <WordDiff r={s.result} />
              <p className="small muted">ระบบได้ยินว่า: {s.said || '—'}</p>
            </Result>
            <ExplainJump />
            <div className="story-row">
              <NextButton auto={pass} onNext={next}>ประโยคต่อไป <Icon name="arrow" /></NextButton>
              <button type="button" className="story-icon-btn" onClick={() => { setS({ ...s, result: null, said: '' }); setLive(''); }}><Icon name="retry" /> พูดใหม่</button>
            </div>
          </>
        ) : hasMic ? (
          <div className="mic-zone">
            <button type="button" className={'mic' + (listening ? ' is-live' : '')} onClick={toggleMic}
              aria-pressed={listening} aria-label={listening ? 'หยุดฟัง' : 'เริ่มพูด'}>
              <Icon name="mic" size={40} />
            </button>
            <p className="mic-label">{listening ? 'กำลังฟัง… พูดจบแล้วแตะอีกครั้ง' : 'แตะไมค์แล้วพูดประโยคด้านบน'}</p>
            <p className="live" aria-live="polite">{live}</p>
            <MicBrowsers />
            <div className="row center">
              <button type="button" className="btn-text" onClick={() => setS({ ...s, keyboard: true })}><Icon name="keyboard" /> ใช้ไมค์บนคีย์บอร์ดแทน</button>
              <button type="button" className="btn-text" onClick={next}>ข้ามประโยคนี้</button>
            </div>
          </div>
        ) : (
          <form className="stack" onSubmit={(e) => { e.preventDefault(); const v = s.typed.trim(); if (!v) { toast('พูดผ่านไมค์บนคีย์บอร์ดก่อน'); return; } evaluate(v); }}>
            {isBrave ? (
              <div className="note note-warn">
                <b>Brave ใช้ไมค์ของเว็บนี้ไม่ได้</b> Brave ปิดระบบแปลงเสียงเป็นข้อความไว้ เปิดเว็บนี้ใน Chrome หรือ Edge จะกดไมค์พูดได้เลย หรือใช้การพิมพ์ด้วยเสียงตามด้านล่าง
              </div>
            ) : null}
            <MicBrowsers />
            <div className="note">
              <b>พูดผ่านการพิมพ์ด้วยเสียง</b> เปลี่ยนคีย์บอร์ดเป็นภาษาอังกฤษ แตะช่องด้านล่าง แล้ว
              <br />· <b>มือถือ</b> กดปุ่มไมค์บนคีย์บอร์ด (บน iPhone อยู่มุมล่างขวา)
              <br />· <b>คอม Windows</b> กด <Kbd>Win</Kbd> + <Kbd>H</Kbd>
              <br />จากนั้นพูดประโยคด้านบน
            </div>
            <label className="sr-only" htmlFor="speak-input">ข้อความจากการพูด</label>
            <input id="speak-input" type="text" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              placeholder="แตะที่นี่ แล้วกดไมค์บนคีย์บอร์ด" value={s.typed} onChange={(e) => setS({ ...s, typed: e.target.value })} />
            <div className="story-row">
              <button type="submit" className="btn btn-primary grow">ตรวจการออกเสียง</button>
              <button type="button" className="story-icon-btn" onClick={next}>ข้าม</button>
            </div>
            {micSupported() ? <button type="button" className="btn-text" onClick={() => setS({ ...s, keyboard: false })}><Icon name="mic" /> กลับไปใช้ไมค์ของเว็บ</button> : null}
          </form>
        )}>
        <span className="kicker">พูดตามประโยคนี้</span>
        <p className="story-big" lang="en">{p.e}</p>
        <p className="story-sub">{p.t}</p>
        <div className="story-chips">
          <button type="button" className="story-chip" onClick={() => { if (!say(p.s)) toast('อุปกรณ์นี้อ่านออกเสียงไม่ได้'); }}><Icon name="speaker" /> ฟังตัวอย่าง</button>
          <button type="button" className="story-chip" onClick={() => { if (!say(p.s, true)) toast('อุปกรณ์นี้อ่านออกเสียงไม่ได้'); }}><Icon name="slow" /> ฟังช้า</button>
        </div>
      </Story>
    </div>
  );
}
