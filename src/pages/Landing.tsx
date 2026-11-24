import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { Icon, type IconName } from '../components/Icon';
import { Sheet } from '../components/Sheet';
import { Brand, LOGO_URL, useScrolled } from '../components/Brand';
import { SignInOptions } from '../components/Login';
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
  { icon: 'cards', title: 'การ์ดคำศัพท์', body: '118 คำและวลีที่ใช้จริงในเกม ระบบนัดทบทวนให้เอง คำไหนจำไม่ได้จะวนกลับมาบ่อยขึ้น' },
  { icon: 'headphones', title: 'ฝึกฟัง', body: 'ฟังประโยคแล้วพิมพ์ตาม มีคำใบ้ทีละขั้น และยอมรับการสะกดพลาดเล็กน้อย' },
  { icon: 'mic', title: 'ฝึกพูด', body: 'พูดใส่ไมค์ ระบบบอกว่าคำไหนยังไม่ชัด ใช้ไมค์บนคีย์บอร์ดมือถือก็ได้' },
  { icon: 'target', title: 'ควิซสถานการณ์', body: 'เจอศัตรูข้างหลังเพื่อน จบเกมแล้วอยากชม ฝึกตัดสินใจว่าจะพูดอะไรให้ถูกจังหวะ' },
  { icon: 'chat', title: 'คุยกับ AI', body: 'เลือกบทเพื่อนร่วมทีมหรือเพื่อนใหม่ใน Discord แล้วฝึกแชตจริง AI ช่วยแก้ประโยคเป็นภาษาไทย' },
  { icon: 'lock', title: 'ส่วนตัว 100%', body: 'ฝึกเพื่อตัวเองล้วน ๆ ไม่มีการจัดอันดับ ความคืบหน้าและชื่อของคุณไม่แสดงให้ใครเห็น' },
];

const STEPS = [
  { n: '1', title: 'เข้าสู่ระบบ', body: 'ใช้บัญชี Discord หรือ Google ได้เลย ไม่ต้องตั้งรหัสผ่านใหม่' },
  { n: '2', title: 'ทำภารกิจวันละ ~30 นาที', body: 'การ์ด ฟัง พูด ควิซ และแชต ระบบพาไปทีละขั้นตามลำดับ' },
  { n: '3', title: 'ไปคุยในเกมจริง', body: 'ใช้ประโยคที่ฝึกไว้กับเพื่อนต่างชาติ แล้วกลับมาฝึกต่อตามจังหวะของตัวเอง' },
];

const TICKER = PHRASES.filter((p) => p.c === 'callout' || p.c === 'game' || p.c === 'help').slice(0, 18);

/** The sign-in pill (top-right): clear at rest, turns into a little puffy cloud on hover. */
function GlassCta({ onClick, children }: { onClick: () => void; children: string }) {
  return (
    <button type="button" className="glass-cta" onClick={onClick}>
      <i className="cta-cloud" aria-hidden="true"><i /></i>
      <i className="glass-stars" aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

export default function Landing() {
  const { error } = useAuth();
  const [open, setOpen] = useState(false);
  const [bd] = useState(initialBackdrop);
  const [kind, setKind] = useState<BackdropKind | null>(bd.kind);
  const root = useRef<HTMLDivElement>(null);
  const scrolled = useScrolled();

  // A failed Discord sign-in comes back with a message; show it where the buttons are.
  useEffect(() => { if (error) setOpen(true); }, [error]);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    gsap.timeline()
      .from('.lp-hero-copy > *', { y: 28, autoAlpha: 0, duration: 0.7, stagger: 0.08, ease: 'power3.out' })
      .from('.lp-mascot', { scale: 0.6, rotate: -8, autoAlpha: 0, duration: 0.9, ease: 'back.out(1.7)' }, '-=0.45')
      .from('.lp-visual .lp-float', { y: 40, autoAlpha: 0, rotate: -4, duration: 0.8, stagger: 0.12, ease: 'back.out(1.6)' }, '-=0.55');
    gsap.to('.lp-mascot', { y: -14, rotate: 2, duration: 3.2, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1.2 });
    gsap.utils.toArray<HTMLElement>('.lp-visual .lp-float').forEach((el, i) => {
      gsap.to(el, { y: i % 2 ? 10 : -10, duration: 2.4 + i * 0.4, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1 });
    });
    const track = root.current?.querySelector<HTMLElement>('.lp-ticker-track');
    if (track) gsap.to(track, { xPercent: -50, duration: 40, repeat: -1, ease: 'none' });
    gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
      gsap.from(el, { y: 36, autoAlpha: 0, duration: 0.7, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%' } });
    });
    gsap.utils.toArray<HTMLElement>('.lp-grid').forEach((grid) => {
      gsap.from(grid.children, { y: 30, autoAlpha: 0, duration: 0.6, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: grid, start: 'top 85%' } });
    });
  }, { scope: root });

  const signIn = () => setOpen(true);
  const toFeatures = () => document.getElementById('features')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

  return (
    <div className={'lp' + (kind ? ' has-bd' : '')} ref={root}>
      {kind ? <Backdrop kind={kind} /> : null}
      <header className="lp-nav" data-scrolled={scrolled ? 'true' : 'false'}>
        <div className="lp-nav-in">
          <a className="brand" href="#top" aria-label="Englitch">
            <Brand />
          </a>
          <nav className="lp-links" aria-label="หัวข้อ">
            <a href="#features">ฟีเจอร์</a>
            <a href="#how">วิธีใช้</a>
          </nav>
          <div className="lp-act">
            <ThemeToggle />
            <GlassCta onClick={signIn}>เข้าสู่ระบบ</GlassCta>
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
              ฝึกวันละไม่ถึงชั่วโมง ทั้งบนคอมและมือถือ
            </p>
            <div className="row">
              <button type="button" className="btn btn-primary btn-lg" onClick={signIn}>เริ่มฝึกฟรี <Icon name="arrow" /></button>
              <button type="button" className="btn btn-ghost btn-lg" onClick={toFeatures}>ดูว่ามีอะไรบ้าง</button>
            </div>
            <ul className="lp-facts">
              <li><b className="num">118</b> วลีจากเกมจริง</li>
              <li><b className="num">5</b> โหมดฝึก</li>
              <li><b className="num">~30</b> นาทีต่อวัน</li>
            </ul>
          </div>

          <div className="lp-visual" aria-hidden="true">
            <img className="lp-mascot" src={LOGO_URL} alt="" width={720} height={720} />
            <div className="lp-float lp-card-flash">
              <span className="tag">คอลในเกม</span>
              <b>Enemy behind you!</b>
              <span className="muted">ศัตรูอยู่ข้างหลังคุณ</span>
            </div>
            <div className="lp-float lp-bubble lp-bubble-in">
              <small>Alex · Canada</small>
              gg wp! One more game?
            </div>
            <div className="lp-float lp-bubble lp-bubble-out">
              Sure! Let&apos;s team up 🎮
            </div>
            <div className="lp-float lp-xp">
              <span className="lv"><small>LV</small><b className="num">7</b></span>
              <span className="lp-xp-bar"><i /></span>
              <span className="streak is-on"><Icon name="flame" /><b className="num">12</b></span>
            </div>
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
            <p className="muted">ทุกโหมดใช้ประโยคชุดเดียวกัน คำที่เรียนในการ์ดจะโผล่ในการฟัง การพูด และควิซ ให้จำได้จริง</p>
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
          <h2>พร้อมเข้าแมตช์แรกหรือยัง</h2>
          <p>ฟรีทั้งหมด ใช้บัญชี Discord หรือ Google เข้าสู่ระบบได้ในไม่กี่วินาที</p>
          <button type="button" className="btn btn-lg lp-final-btn" onClick={signIn}>เข้าสู่ระบบแล้วเริ่มเลย <Icon name="arrow" /></button>
        </section>
      </main>

      <footer className="lp-foot">
        <span><b>Englitch</b> · ฝึกภาษาอังกฤษไว้คุยกับเพื่อนต่างชาติในเกม</span>
        <a href="./privacy.html">นโยบายความเป็นส่วนตัว</a>
      </footer>

      {bd.picker ? (
        <div className="bd-picker" role="group" aria-label="เลือกพื้นหลัง">
          {BACKDROPS.map((b, i) => (
            <button key={b.id} type="button" aria-pressed={kind === b.id} title={b.note} onClick={() => setKind(b.id)}>{i + 1}. {b.name}</button>
          ))}
        </div>
      ) : null}

      <Sheet open={open} onClose={() => setOpen(false)} title="เข้าสู่ระบบ">
        <SignInOptions />
      </Sheet>
    </div>
  );
}
