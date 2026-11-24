import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { CATS, NEW_PER_DAY, PHRASES, type Category, type Phrase } from '../data/content';
import { Icon } from '../components/Icon';
import { Bar, Kbd, PageHead, SpeakButton } from '../components/ui';
import { useProgress, type Grade, type State } from '../state/progress';
import { useSession } from '../state/session';
import { shuffle, today, prefersReducedMotion } from '../lib/util';
import { say } from '../lib/speech';
import { navigate } from '../lib/router';

type Cat = Category | 'all';
interface Sess { cat: Cat; queue: string[]; requeued: string[]; flipped: boolean; extra: boolean; total: number; done: number }

const byId = new Map(PHRASES.map((p) => [p.e, p]));

function build(state: State, cat: Cat, newToday: number): Sess {
  const t = today();
  const inCat = (p: Phrase) => cat === 'all' || p.c === cat;
  const due = PHRASES.filter((p) => inCat(p) && state.srs[p.e] && state.srs[p.e].d <= t);
  const left = Math.max(0, NEW_PER_DAY - newToday);
  const fresh = PHRASES.filter((p) => inCat(p) && !state.srs[p.e]).slice(0, left);
  const queue = shuffle(due).concat(fresh).map((p) => p.e);
  return { cat, queue, requeued: [], flipped: false, extra: false, total: queue.length, done: 0 };
}

export default function Cards() {
  const { state, day, grade } = useProgress();
  const [s, setS] = useSession<Sess>('cards', () => build(state, 'all', day.newCards));
  const cardRef = useRef<HTMLDivElement>(null);
  const p = s.queue.length ? byId.get(s.queue[0]) : undefined;
  const isNew = p ? !state.srs[p.e] : false;

  const flip = () => {
    if (!p || s.flipped) return;
    setS({ ...s, flipped: true });
  };
  const doGrade = (g: Grade) => {
    if (!p || !s.flipped) return;
    grade(p.e, g);
    const queue = s.queue.slice(1);
    const requeued = s.requeued.slice();
    if (g === 'again' && !requeued.includes(p.e)) { queue.push(p.e); requeued.push(p.e); }
    const nextId = queue[0];
    if (nextId && state.settings.autoPlay) say(byId.get(nextId)!.s);
    setS({ ...s, queue, requeued, flipped: false, done: s.done + 1, total: Math.max(s.total, s.done + 1 + queue.length) });
  };

  // Card entrance / flip motion.
  useEffect(() => {
    if (!cardRef.current || prefersReducedMotion()) return;
    if (s.flipped) gsap.fromTo(cardRef.current, { rotateX: -8, scale: 0.98 }, { rotateX: 0, scale: 1, duration: 0.35, ease: 'power3.out' });
    else gsap.fromTo(cardRef.current, { x: 30, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.35, ease: 'power3.out' });
  }, [s.flipped, s.queue[0]]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard: Space/Enter flips, 1-3 grade.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!s.flipped && (e.key === ' ' || e.key === 'Enter') && tag !== 'BUTTON' && tag !== 'A') { e.preventDefault(); flip(); }
      else if (s.flipped && e.key === '1') doGrade('again');
      else if (s.flipped && e.key === '2') doGrade('good');
      else if (s.flipped && e.key === '3') doGrade('easy');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const setCat = (cat: Cat) => setS(build(state, cat, day.newCards));
  const counts = (Object.keys(CATS) as Category[]).map((c) => [c, PHRASES.filter((x) => x.c === c).length] as const);

  return (
    <div className="page">
      <PageHead route="cards" aside={<span className="pill num">{s.queue.length} ใบที่เหลือ</span>}>
        นึกความหมายในใจก่อน แล้วค่อยเปิดดู ตอบตามจริงว่าจำได้แค่ไหน ระบบจะนัดทบทวนให้เอง
      </PageHead>

      <div className="chips scroller" role="group" aria-label="หมวดคำศัพท์" data-reveal>
        <button type="button" className="chip" aria-pressed={s.cat === 'all'} onClick={() => setCat('all')}>ทุกหมวด</button>
        {counts.map(([c, n]) => (
          <button key={c} type="button" className="chip" aria-pressed={s.cat === c} onClick={() => setCat(c)}>
            {CATS[c]} <span className="chip-n num">{n}</span>
          </button>
        ))}
      </div>

      {p ? (
        <section className="card play" data-reveal>
          <div className="play-top">
            <Bar value={s.total ? s.done / s.total : 0} label="ความคืบหน้ารอบนี้" />
            <span className="muted small num">{s.done}/{s.total}</span>
          </div>
          <div
            ref={cardRef}
            className={'flash' + (s.flipped ? ' is-flipped' : '')}
            role={s.flipped ? undefined : 'button'}
            tabIndex={s.flipped ? undefined : 0}
            aria-label={s.flipped ? undefined : 'แตะเพื่อดูความหมาย'}
            onClick={flip}
          >
            <div className="flash-tags">
              <span className="tag">{CATS[p.c]}</span>
              {isNew ? <span className="tag tag-hot">คำใหม่</span> : null}
            </div>
            <p className="flash-en">{p.e}</p>
            <div className="row center">
              <SpeakButton text={p.s} />
              <SpeakButton text={p.s} slow />
            </div>
            {s.flipped ? (
              <div className="flash-back">
                <p className="flash-th">{p.t}</p>
                {p.n ? <p className="note small">{p.n}</p> : null}
              </div>
            ) : (
              <p className="flash-hint">แตะการ์ดเพื่อดูความหมาย <span className="desk-only">หรือกด <Kbd>Space</Kbd></span></p>
            )}
          </div>
          {s.flipped ? (
            <div className="grade">
              <button type="button" className="btn btn-danger-soft" onClick={() => doGrade('again')}>
                ยังจำไม่ได้<small>เจออีกรอบวันนี้ <Kbd>1</Kbd></small>
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => doGrade('good')}>
                จำได้<small>ทบทวนวันหลัง <Kbd>2</Kbd></small>
              </button>
              <button type="button" className="btn btn-good" onClick={() => doGrade('easy')}>
                ง่ายมาก<small>เว้นระยะนานขึ้น <Kbd>3</Kbd></small>
              </button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary btn-block" onClick={flip}>ดูความหมาย</button>
          )}
          {s.extra ? <p className="muted small">โหมดฝึกเพิ่ม: การ์ดเหล่านี้ยังไม่ถึงวันทบทวน</p> : null}
        </section>
      ) : (
        <section className="card done-card" data-reveal>
          <span className="done-badge"><Icon name="check" size={28} /></span>
          <h2>ทบทวนครบแล้วสำหรับวันนี้</h2>
          <p className="muted">คำไหนจำได้แม่นจะเว้นระยะนานขึ้น เรียนคำใหม่ได้วันละ {NEW_PER_DAY} คำ พรุ่งนี้กลับมาทบทวนต่อ</p>
          <div className="row center">
            <button type="button" className="btn btn-primary" onClick={() => navigate('listen')}>ไปฝึกฟังต่อ <Icon name="arrow" /></button>
            <button type="button" className="btn btn-ghost" onClick={() => {
              const inCat = (x: Phrase) => s.cat === 'all' || x.c === s.cat;
              const known = shuffle(PHRASES.filter((x) => inCat(x) && state.srs[x.e]));
              const unknown = PHRASES.filter((x) => inCat(x) && !state.srs[x.e]);
              const queue = (known.length >= 5 ? known : known.concat(unknown)).slice(0, 10).map((x) => x.e);
              setS({ ...s, queue, requeued: [], flipped: false, extra: true, total: queue.length, done: 0 });
            }}>ฝึกเพิ่มอีก 10 ใบ</button>
          </div>
        </section>
      )}
    </div>
  );
}
