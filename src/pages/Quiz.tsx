import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { PHRASES, SITUATIONS } from '../data/content';
import { Icon } from '../components/Icon';
import { Bar, Kbd, PageHead, Result, SpeakButton } from '../components/ui';
import { useProgress, type State } from '../state/progress';
import { useSession } from '../state/session';
import { shuffle, prefersReducedMotion } from '../lib/util';
import { say } from '../lib/speech';
import { navigate } from '../lib/router';

interface Q { prompt: string; sub?: string; answer: string; options: string[]; say?: string; why?: string }
interface Miss { prompt: string; answer: string; picked: string }
interface Sess { qs: Q[]; i: number; score: number; picked: string | null; misses: Miss[] }

const ascii = (s: string) => /^[\x20-\x7E]+$/.test(s);

function makeQuiz(state: State): Q[] {
  const qs: Q[] = shuffle(SITUATIONS).slice(0, 4).map((s) => ({
    prompt: s.q, sub: 'สถานการณ์', answer: s.a, options: shuffle([s.a, ...s.o]),
    say: s.say || (ascii(s.a) ? s.a : undefined), why: s.why,
  }));
  const learned = PHRASES.filter((p) => state.srs[p.e]);
  const base = shuffle(learned.length >= 6 ? learned : PHRASES).slice(0, 6);
  base.forEach((p, i) => {
    const enToTh = i % 2 === 0;
    const key = enToTh ? 't' : 'e';
    const pool = shuffle(PHRASES.filter((x) => x !== p && x.c === p.c)).concat(shuffle(PHRASES.filter((x) => x.c !== p.c)));
    const opts: string[] = [];
    for (const x of pool) { if (opts.length >= 3) break; if (x[key] !== p[key] && !opts.includes(x[key])) opts.push(x[key]); }
    if (enToTh) qs.push({ prompt: '"' + p.e + '" แปลว่าอะไร', sub: 'ความหมาย', answer: p.t, options: shuffle([p.t, ...opts]), say: p.s });
    else qs.push({
      prompt: p.c === 'slang' ? 'ศัพท์แชตไหนหมายถึง "' + p.t + '"' : 'ถ้าจะบอกว่า "' + p.t + '" พูดว่าอะไร',
      sub: 'เลือกประโยค', answer: p.e, options: shuffle([p.e, ...opts]), say: p.s,
    });
  });
  return shuffle(qs);
}

export default function Quiz() {
  const { state, gain } = useProgress();
  const [s, setS] = useSession<Sess | null>('quiz', () => null);
  const optsRef = useRef<HTMLDivElement>(null);
  const start = () => setS({ qs: makeQuiz(state), i: 0, score: 0, picked: null, misses: [] });
  const q = s && s.i < s.qs.length ? s.qs[s.i] : null;

  const choose = (o: string) => {
    if (!s || !q || s.picked != null) return;
    const right = o === q.answer;
    if (q.say) say(q.say);
    gain('quiz', right ? 3 : 1);
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
        <PageHead route="quiz">ฝึกตัดสินใจว่าจะพูดอะไรในสถานการณ์จริง รอบละ 10 ข้อ ตอบถูกได้ 3 XP</PageHead>
        <section className="card done-card" data-reveal>
          <span className="done-badge"><Icon name="target" size={28} /></span>
          <h2>พร้อมเข้าแมตช์ไหม</h2>
          <p className="muted">มีทั้งสถานการณ์ในเกม ศัพท์แชต และคำที่คุณเคยเรียนในการ์ด</p>
          <button type="button" className="btn btn-primary btn-lg" onClick={start}>เริ่มควิซ <Icon name="arrow" /></button>
        </section>
      </div>
    );
  }

  if (!q) {
    const great = s.score >= 8;
    return (
      <div className="page">
        <PageHead route="quiz" />
        <section className="card done-card" data-reveal>
          <span className="kicker">{great ? 'Victory' : 'Round over'}</span>
          <p className="score num">{s.score}<small>/{s.qs.length}</small></p>
          <p className="muted">{great ? 'เยี่ยมมาก พร้อมไปคุยกับเพื่อนต่างชาติแล้ว' : 'ทบทวนข้อที่พลาดด้านล่าง แล้วลองอีกรอบ จะดีขึ้นเรื่อย ๆ'}</p>
          <div className="row center">
            <button type="button" className="btn btn-primary" onClick={start}><Icon name="retry" /> เล่นอีกรอบ</button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('cards')}>ไปทบทวนการ์ด</button>
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
      <PageHead route="quiz" aside={<span className="pill num">คะแนน {s.score}</span>} />
      <section className="card play" data-reveal>
        <div className="play-top">
          <Bar value={s.i / s.qs.length} label="ความคืบหน้าควิซ" />
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
            <Result ok={right} title={right ? 'ถูกต้อง +3 XP' : 'ยังไม่ถูก คำตอบคือ: ' + q.answer}>
              {q.why ? <p className="small">{q.why}</p> : null}
              {q.say ? <div className="row"><SpeakButton text={q.say} label="ฟังคำตอบ" /></div> : null}
            </Result>
            <button type="button" className="btn btn-primary btn-block" onClick={next} autoFocus>
              {s.i + 1 >= s.qs.length ? 'ดูผลคะแนน' : 'ข้อต่อไป'} <Icon name="arrow" />
            </button>
          </>
        ) : null}
      </section>
    </div>
  );
}
