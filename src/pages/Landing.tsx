import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Icon, type IconName } from '../components/Icon';
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

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'headphones', title: 'ฝึกฟัง', body: 'ฟังประโยคแล้วพิมพ์ตาม มีคำใบ้ทีละขั้น และยอมรับการสะกดพลาดเล็กน้อย' },
  { icon: 'mic', title: 'ฝึกพูด', body: 'พูดใส่ไมค์ ระบบบอกว่าคำไหนยังไม่ชัด ใช้ไมค์บนคีย์บอร์ดมือถือก็ได้' },
  { icon: 'book', title: 'ฝึกอ่าน', body: 'เจอศัตรูข้างหลังเพื่อน จบเกมแล้วอยากชม อ่านสถานการณ์แล้วเลือกว่าจะพูดอะไรให้ถูกจังหวะ' },
  { icon: 'pen', title: 'ฝึกเขียน', body: 'เห็นภาษาไทยแล้วพิมพ์เป็นอังกฤษ ด้วยประโยคที่ใช้จริงในเกม ประโยคที่พลาดจะวนกลับมาให้ฝึกอีก' },
  { icon: 'chat', title: 'คุยกับ AI', body: 'เลือกบทเพื่อนร่วมทีมหรือเพื่อนใหม่ใน Discord แล้วฝึกแชตจริง AI ช่วยแก้ประโยคเป็นภาษาไทย' },
  { icon: 'lock', title: 'ส่วนตัว 100%', body: 'ฝึกเพื่อตัวเองล้วน ๆ ตามจังหวะของคุณ ความคืบหน้าและชื่อของคุณเห็นได้เฉพาะคุณคนเดียว' },
];

const COPYRIGHT_YEAR = Math.max(2026, new Date().getFullYear());

const STEPS = [
  { n: '1', title: 'เข้าสู่ระบบ', body: 'ใช้บัญชี Discord หรือ Google ได้เลย ไม่ต้องตั้งรหัสผ่านใหม่' },
  { n: '2', title: 'ทำภารกิจวันละนิด', body: 'ฟัง พูด อ่าน เขียน และแชต ตามจังหวะของตัวเอง ระบบพาไปทีละขั้น' },
  { n: '3', title: 'ไปคุยในเกมจริง', body: 'ใช้ประโยคที่ฝึกไว้กับเพื่อนต่างชาติ แล้วกลับมาฝึกต่อตามจังหวะของตัวเอง' },
];

const TICKER = PHRASES.filter((p) => p.c === 'callout' || p.c === 'game' || p.c === 'help').slice(0, 18);

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
            <span className="kicker">ฟรี · สำหรับเกมเมอร์ที่เพิ่งเริ่มภาษาอังกฤษ</span>
            <h1>พูดอังกฤษในเกม<br /><span className="hl">ได้แบบไม่เขิน</span></h1>
            <p className="lp-lede">
              Englitch สอนประโยคที่ใช้จริงตอนเล่นกับเพื่อนต่างชาติ ตั้งแต่ทักทาย คอลในเกม ไปจนถึงชวนแอด Discord
              ฝึกตามจังหวะของตัวเอง ทั้งบนคอมและมือถือ
            </p>
            <div className="row">
              <button type="button" className="btn btn-primary btn-lg" onClick={signIn}>เริ่มฝึกฟรี <Icon name="arrow" /></button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={toFeatures}>ดูว่ามีอะไรบ้าง</button>
            </div>
            <ul className="lp-facts">
              <li><b className="num">{PHRASES.length}</b> วลีจากเกมจริง</li>
              <li><b className="num">5</b> โหมดฝึก</li>
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
            <h2>ฝึกครบทั้งฟัง พูด อ่าน เขียน แบบเกมเมอร์</h2>
            <p className="muted">ทุกโหมดใช้ประโยคชุดเดียวกัน ประโยคที่ยังพลาดจะวนกลับมาในการฟัง พูด อ่าน และเขียน ให้จำได้จริง</p>
          </div>
          <div className="lp-grid">
            {FEATURES.map((f) => (
              <article key={f.title} className="lp-feature">
                <span className="lp-feature-ic"><Icon name={f.icon} /></span>
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
          <h2>พร้อมเริ่มฝึกวันแรกหรือยัง</h2>
          <p>ฟรีทั้งหมด ใช้บัญชี Discord หรือ Google เข้าสู่ระบบได้ง่าย ๆ</p>
          <button type="button" className="btn btn-lg lp-final-btn" onClick={signIn}>เข้าสู่ระบบแล้วเริ่มเลย <Icon name="arrow" /></button>
        </section>
      </main>

      <footer className="lp-foot">
        <span><b>Englitch</b> · ฝึกภาษาอังกฤษไว้คุยกับเพื่อนต่างชาติในเกม</span>
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
