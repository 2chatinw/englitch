import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Icon } from '../components/Icon';
import { SkillArt, type Skill } from '../components/SkillArt';
import { StageRing } from '../components/CategoryPicker';
import { Brand, useScrolled } from '../components/Brand';
import { HeroKeys } from '../components/HeroKeys';
import { SectionNav } from '../components/SectionNav';
import { SignInDrop } from '../components/SignInDrop';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../state/auth';
import { PHRASES } from '../data/content';
import { prefersReducedMotion } from '../lib/util';
import { Backdrop, BACKDROPS, type BackdropKind } from '../components/Backdrop';

// Background preview: open the site with ?bg=preview (or ?bg=aurora|shapes|pixel|bubbles|stickers).
function initialBackdrop(): { kind: BackdropKind | null; picker: boolean } {
  const q = new URLSearchParams(window.location.search).get('bg');
  if (!q) return { kind: 'sky', picker: false };
  const known = BACKDROPS.find((b) => b.id === q);
  return { kind: known ? known.id : 'sky', picker: q === 'preview' || !!known };
}

gsap.registerPlugin(ScrollTrigger);

/**
 * Features in the app's own look: the four skills as the same pastel round keys with pictures as in the lobby,
 * the mission card with the three-colour level ring, and a plain key for privacy.
 */
type Art = Skill | 'ring' | 'lock';
const FEATURES: { art: Art; title: string; body: string }[] = [
  { art: 'listen', title: 'ฝึกฟัง', body: 'ฟังประโยคแล้วพิมพ์ตาม มีคำใบ้ทีละขั้น และยอมรับการสะกดพลาดเล็กน้อย' },
  { art: 'speak', title: 'ฝึกพูด', body: 'พูดใส่ไมค์ ระบบบอกว่าคำไหนยังไม่ชัด ใช้ไมค์บนคีย์บอร์ดมือถือก็ได้' },
  { art: 'read', title: 'ฝึกอ่าน', body: 'อ่านสถานการณ์และประโยคจาก 7 หมวด ตั้งแต่ร้านอาหาร สนามบิน ไปจนถึงห้องประชุม แล้วเลือกคำตอบที่ถูก' },
  { art: 'write', title: 'ฝึกเขียน', body: 'เห็นภาษาไทยแล้วพิมพ์เป็นอังกฤษ ด้วยประโยคที่ใช้จริง ประโยคที่พลาดจะวนกลับมาให้ฝึกอีก' },
  { art: 'ring', title: 'Mission ทีละหมวด', body: 'เลือกหมวดที่อยากเก่ง เช่น ท่องเที่ยว การทำงาน วิชาการ แล้วฝึกครบ 4 ทักษะ วงแหวนสามสีบอกว่าผ่านประโยคสั้น ยาวขึ้น และยาวไปถึงไหนแล้ว' },
  { art: 'lock', title: 'ส่วนตัว 100%', body: 'ฝึกเพื่อตัวเองล้วน ๆ ตามจังหวะของคุณ ความคืบหน้าและชื่อของคุณเห็นได้เฉพาะคุณคนเดียว' },
];

const COPYRIGHT_YEAR = Math.max(2026, new Date().getFullYear());

const STEPS = [
  { n: '1', title: 'เข้าสู่ระบบ', body: 'ใช้บัญชี Discord หรือ Google ได้เลย ไม่ต้องตั้งรหัสผ่านใหม่' },
  { n: '2', title: 'แตะเลือกหมวด', body: 'ทั่วไป เที่ยว งาน วิชาการ บันเทิง สายอาชีพ เกม หรือรวมทุกหมวด วงแหวนสามสีรอบปุ่มบอกว่าฝึกไปถึงไหนแล้ว' },
  { n: '3', title: 'เลือกทักษะแล้วฝึกเลย', body: 'กดปุ่ม ฟัง พูด อ่าน เขียน (บนคอมกด 1–4 ได้) ตอบถูกครบทุกประโยคในหมวด = ผ่าน Mission ไม่มีจับเวลา ฝึกตามจังหวะของตัวเอง' },
];

// a few phrases from every main category, in turn
const TICKER = (['general', 'travel', 'business', 'academic', 'entertainment', 'esp', 'gaming'] as const)
  .flatMap((g) => PHRASES.filter((p) => p.g === g && p.c !== 'slang').slice(0, 3));

// a sample ring for the mission card: some short sentences done, a few longer ones
const SAMPLE_RING = [{ k: 'easy' as const, total: 10, done: 6 }, { k: 'medium' as const, total: 7, done: 2 }, { k: 'hard' as const, total: 3, done: 0 }];

function FeatureArt({ art }: { art: Art }) {
  if (art === 'ring') return <span className="lp-art lp-art-ring" aria-hidden="true"><StageRing stages={SAMPLE_RING} /></span>;
  if (art === 'lock') return <span className="lp-art lp-art-plain" aria-hidden="true"><Icon name="lock" /></span>;
  return <span className={'lp-art cp-skill-' + art} aria-hidden="true"><SkillArt kind={art} size={34} /></span>;
}

export default function Landing() {
  const { error } = useAuth();
  const [open, setOpen] = useState(false);
  const [bd] = useState(initialBackdrop);
  const [kind, setKind] = useState<BackdropKind | null>(bd.kind);
  const root = useRef<HTMLDivElement>(null);
  const scrolled = useScrolled();

  // A failed Discord sign-in comes back with a message; drop the sign-in badges so it shows under them.
  useEffect(() => { if (error) setOpen(true); }, [error]);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.timeline()
      .from('.lp-hero-copy > *', { y: 28, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' })
      .from('.hk-pad', { y: -40, rotation: -6, autoAlpha: 0, duration: 0.8, ease: 'back.out(1.8)' }, '-=0.45')
      .from('.hk-hint', { y: 10, autoAlpha: 0, duration: 0.4 }, '-=0.3');
    const track = root.current?.querySelector<HTMLElement>('.lp-ticker-track');
    if (track) gsap.to(track, { xPercent: -50, duration: 40, repeat: -1, ease: 'none' });
    gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
      gsap.from(el, { y: 36, autoAlpha: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    gsap.utils.toArray<HTMLElement>('.lp-grid').forEach((grid) => {
      gsap.from(grid.children, { y: 30, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: grid, start: 'top 85%' } });
    });
  }, { scope: root });

  // the other sign-in buttons on the page scroll back up and drop the badges under the top-right pill
  const signIn = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    setOpen(true);
  };
  const toFeatures = () => document.getElementById('features')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  return (
    <div className={'lp' + (kind ? ' has-bd' : '')} ref={root}>
      {kind ? <Backdrop kind={kind} /> : null}
      <header className="lp-nav" data-scrolled={scrolled ? 'true' : 'false'}>
        <div className="lp-nav-in">
          <a className="brand" href="#top" aria-label="Englitch">
            <Brand />
          </a>
          <SectionNav />
          <div className="lp-act">
            <ThemeToggle />
            <SignInDrop open={open} onOpenChange={setOpen} />
          </div>
        </div>
      </header>

      <main id="top">
        <section className="lp-hero">
          <div className="lp-hero-copy">
            <span className="kicker">ฟรี · สำหรับทุกคนที่อยากเก่งภาษาอังกฤษ</span>
            <h1>ฝึกอังกฤษทุกวัน<br /><span className="hl">ใช้ได้จริงแบบไม่เขิน</span></h1>
            <p className="lp-lede">
              Englitch รวมประโยคที่ใช้จริงในชีวิตประจำวัน การเที่ยว การทำงาน การเรียน ความบันเทิง และสายอาชีพ ฝึกครบ ฟัง พูด อ่าน เขียน
              ฝึกตามจังหวะของตัวเอง ทั้งบนคอมและมือถือ
            </p>
            <div className="row">
              <button type="button" className="btn btn-primary btn-lg" onClick={signIn}>เริ่มฝึกฟรี <Icon name="arrow" /></button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={toFeatures}>ดูว่ามีอะไรบ้าง</button>
            </div>
            <ul className="lp-facts">
              <li><b className="num">{PHRASES.length.toLocaleString()}</b> วลีที่ใช้จริง</li>
              <li><b className="num">7</b> หมวด × 4 ทักษะ</li>
              <li><b className="num">0</b> บาท ฟรีทั้งหมด</li>
            </ul>
          </div>

          <div className="lp-visual">
            <HeroKeys />
          </div>
        </section>

        <section className="lp-ticker" aria-label="ตัวอย่างประโยค">
          <div className="lp-ticker-track">
            {[...TICKER, ...TICKER].map((p, i) => (
              <span key={i} className="lp-chip"><b>{p.e}</b><span>{p.t}</span></span>
            ))}
          </div>
        </section>

        <section className="lp-section" id="features">
          <div className="lp-head" data-rise>
            <span className="kicker">Features</span>
            <h2>ฝึกครบทั้งฟัง พูด อ่าน เขียน ในที่เดียว</h2>
            <p className="muted">ทุกโหมดใช้ประโยคชุดเดียวกัน ประโยคที่ยังพลาดจะวนกลับมาในการฟัง พูด อ่าน และเขียน ให้จำได้จริง</p>
          </div>
          <div className="lp-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="lp-feature">
                <FeatureArt art={f.art} />
                <h3>{f.title}</h3>
                <p className="muted">{f.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section" id="how">
          <div className="lp-head" data-rise>
            <span className="kicker">How it works</span>
            <h2>เริ่มได้ใน 3 ขั้น</h2>
          </div>
          <ol className="lp-grid lp-steps">
            {STEPS.map((s) => (
              <li key={s.n} className="lp-step">
                <span className="lp-step-n num">{s.n}</span>
                <h3>{s.title}</h3>
                <p className="muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="lp-final" data-rise>
          <span className="dp-liquid" aria-hidden="true"><i /><i /><i /></span>
          <h2>พร้อมเริ่มฝึกวันแรกหรือยัง</h2>
          <p>ฟรีทั้งหมด ใช้บัญชี Discord หรือ Google เข้าสู่ระบบได้ง่าย ๆ</p>
          <button type="button" className="btn btn-primary btn-lg lp-final-btn" onClick={signIn}>เข้าสู่ระบบแล้วเริ่มเลย <Icon name="arrow" /></button>
        </section>
      </main>

      <footer className="lp-foot">
        <span><b>Englitch</b> · ฝึกภาษาอังกฤษที่ใช้ได้จริง ตามจังหวะของคุณ</span>
        <a href="./privacy.html">นโยบายความเป็นส่วนตัว</a>
        <p className="copyright">© {COPYRIGHT_YEAR} Chatchathep Meekaew. All rights reserved.</p>
      </footer>

      {bd.picker ? (
        <div className="bd-picker" role="group" aria-label="เลือกพื้นหลัง">
          {BACKDROPS.map((b, i) => (
            <button key={b.id} type="button" aria-pressed={kind === b.id} title={b.note} onClick={() => setKind(b.id)}>{i + 1}. {b.name}</button>
          ))}
        </div>
      ) : null}

    </div>
  );
}
