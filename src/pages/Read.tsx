import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { PHRASES, SITUATIONS } from '../data/content';
import { Icon } from '../components/Icon';
import { Bar, Kbd, NextButton, PageHead, Result, SpeakButton } from '../components/ui';
import { MissionChip, MissionStrip } from '../components/Missions';
import { useProgress, type State } from '../state/progress';
import { useSession } from '../state/session';
import { shuffle, prefersReducedMotion } from '../lib/util';
import { say } from '../lib/speech';
import { navigate } from '../lib/router';
import { phrasePool } from './practice';
import { activeMission } from '../lib/missions';

/** `id` is the phrase a question is about, so a right or wrong answer feeds its review schedule. */
interface Q { prompt: string; sub?: string; answer: string; options: string[]; say?: string; why?: string; id?: string }
interface Miss { prompt: string; answer: string; picked: string }
interface Sess { qs: Q[]; i: number; score: number; picked: string | null; misses: Miss[] }

const ascii = (s: string) => /^[\x20-\x7E]+$/.test(s);

const LEVEL_RANK = { easy: 0, medium: 1, hard: 2 } as const;

/**
 * One reading round of 10. Mixed practice: 4 game situations plus 6 sentences (meaning either way).
 * In a mission: 10 sentences from that topic, mostly ones not answered right yet, shortest first,
 * plus a few already learned to keep them fresh.
 */
function makeRound(state: State): Q[] {
  const inMission = activeMission(state) !== null;
  const nSit = inMission ? 0 : 4;
  const qs: Q[] = shuffle(SITUATIONS).slice(0, nSit).map((s) => ({
    prompt: s.q, sub: 'สถานการณ์', answer: s.a, options: shuffle([s.a, ...s.o]),
    say: s.say || (ascii(s.a) ? s.a : undefined), why: s.why,
  }));
  const n = 10 - nSit;
  const levelPool = phrasePool(state);
  const learned = shuffle(levelPool.filter((p) => (state.srs[p.e]?.b ?? 0) >= 1));
  const todo = shuffle(levelPool.filter((p) => (state.srs[p.e]?.b ?? 0) < 1))
    .sort((a, b) => (inMission ? LEVEL_RANK[a.l] - LEVEL_RANK[b.l] : 0));
  const keep = inMission ? 3 : Math.floor(n / 2);
  const base = [...learned.slice(0, keep), ...todo].slice(0, n);
  if (base.length < n) base.push(...learned.slice(keep, keep + n - base.length));
  base.forEach((p, i) => {
    const enToTh = i % 2 === 0;
    const key = enToTh ? 't' : 'e';
    const pool = shuffle(PHRASES.filter((x) => x !== p && x.c === p.c)).concat(shuffle(PHRASES.filter((x) => x.c !== p.c)));
    const opts: string[] = [];
    for (const x of pool) { if (opts.length >= 3) break; if (x[key] !== p[key] && !opts.includes(x[key])) opts.push(x[key]); }
    if (enToTh) qs.push({ prompt: '"' + p.e + '" แปลว่าอะไร', sub: 'ความหมาย', answer: p.t, options: shuffle([p.t, ...opts]), say: p.s, id: p.e });
    else qs.push({
      // slang meanings start with the English full form ("got to go = ต้องไปแล้ว"): show only the Thai, or it gives the answer away
      prompt: p.c === 'slang' ? 'ศัพท์แชตไหนหมายถึง "' + p.t.split('=').pop()!.trim() + '"' : 'ถ้าจะบอกว่า "' + p.t + '" พูดว่าอะไร',
      sub: 'เลือกประโยค', answer: p.e, options: shuffle([p.e, ...opts]), say: p.s, id: p.e,
    });
  });
  return shuffle(qs);
}

export default function Read() {
  const { state, gain, remember } = useProgress();
  const [s, setS] = useSession<Sess | null>('read', () => null);
  const optsRef = useRef<HTMLDivElement>(null);
  const start = () => setS({ qs: makeRound(state), i: 0, score: 0, picked: null, misses: [] });
  const q = s && s.i < s.qs.length ? s.qs[s.i] : null;

  const choose = (o: string) => {
    if (!s || !q || s.picked != null) return;
    const right = o === q.answer;
    if (q.say) say(q.say);
    gain('read', right ? 3 : 1);
    if (q.id) remember(q.id, right);
    setS({ ...s, picked: o, score: s.score + (right ? 1 : 0), misses: right ? s.misses : [...s.misses, { prompt: q.prompt, answer: q.answer, picked: o }] });
  };
  const next = () => s && setS({ ...s, i: s.i + 1, picked: null });

  useEffect(() => {
    if (!optsRef.current || prefersReducedMotion()) return;
    gsap.fromTo(optsRef.current.children, { y: 12, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.3, stagger: 0.05, ease: 'power3.out' });
  }, [s?.i]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (!q || tag === 'INPUT' || tag === 'TEXTAREA' || e.metaKey || e.ctrlKey) return;
      const n = Number(e.key);
      if (s?.picked == null && n >= 1 && n <= q.options.length) choose(q.options[n - 1]);
      else if (s?.picked != null && e.key === 'Enter' && tag !== 'BUTTON') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!s) {
    return (
      <div className="page">
        <PageHead route="read" aside={<MissionChip />}>อ่านสถานการณ์หรือประโยค แล้วเลือกคำตอบที่ถูก รอบละ 10 ข้อ</PageHead>
        <MissionStrip route="read" />
        <section className="card done-card" data-reveal>
          <span className="done-badge"><Icon name="book" size={28} /></span>
          <h2>พร้อมเริ่มไหม</h2>
          <p className="muted">มีทั้งสถานการณ์ในเกม ศัพท์แชต และประโยคที่คุณเคยฝึก</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={start}>เริ่มอ่าน <Icon name="arrow" /></button>
        </section>
      </div>
    );
  }

  if (!q) {
    const great = s.score >= 8;
    return (
      <div className="page">
        <PageHead route="read" aside={<MissionChip />} />
        <MissionStrip route="read" />
        <section className="card done-card" data-reveal>
          <span className="kicker">{great ? 'เก่งมาก' : 'จบรอบนี้แล้ว'}</span>
          <p className="score num">{s.score}<small>/{s.qs.length}</small></p>
          <p className="muted">{great ? 'เยี่ยมมาก พร้อมไปคุยกับเพื่อนต่างชาติแล้ว' : 'ทบทวนข้อที่พลาดด้านล่าง แล้วลองอีกรอบ จะดีขึ้นเรื่อย ๆ'}</p>
          <div className="row center">
            <button type="button" className="btn btn-primary" onClick={start}><Icon name="retry" /> อ่านอีกรอบ</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('write')}>ไปฝึกเขียน</button>
          </div>
        </section>
        {s.misses.length ? (
          <section className="card" data-reveal>
            <h2>ข้อที่พลาด</h2>
            <ul className="miss-list">
              {s.misses.map((m, i) => (
                <li key={i}>
                  <p className="small muted">{m.prompt}</p>
                  <p><Icon name="check" /> <b>{m.answer}</b></p>
                  <p className="small strike">คุณตอบ: {m.picked}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    );
  }

  const answered = s.picked != null;
  const right = s.picked === q.answer;
  return (
    <div className="page">
      <PageHead route="read" aside={<span className="pill num">ถูก {s.score} ข้อ</span>} />
      <section className="card play" data-reveal>
        <div className="play-top">
          <Bar value={s.i / s.qs.length} label="ความคืบหน้ารอบนี้" />
          <span className="muted small num">ข้อ {s.i + 1}/{s.qs.length}</span>
        </div>
        <span className="kicker">{q.sub}</span>
        <p className="q-prompt">{q.prompt}</p>
        <div className="opts" ref={optsRef}>
          {q.options.map((o, idx) => {
            let cls = 'opt';
            if (answered && o === q.answer) cls += ' is-right';
            else if (answered && o === s.picked) cls += ' is-wrong';
            return (
              <button key={o} type="button" className={cls} disabled={answered} onClick={() => choose(o)}>
                <Kbd>{idx + 1}</Kbd><span>{o}</span>
              </button>
            );
          })}
        </div>
        {answered ? (
          <>
            <Result ok={right} title={right ? 'ถูกต้อง' : 'ยังไม่ถูก คำตอบคือ: ' + q.answer}>
              {q.why ? <p className="small">{q.why}</p> : null}
              {q.say ? <div className="row"><SpeakButton text={q.say} label="ฟังคำตอบ" /></div> : null}
            </Result>
            <NextButton auto={right} onNext={next} className="btn btn-primary btn-block" autoFocus>
              {s.i + 1 >= s.qs.length ? 'ดูผลคะแนน' : 'ข้อต่อไป'} <Icon name="arrow" />
            </NextButton>
          </>
        ) : null}
      </section>
    </div>
  );
}
