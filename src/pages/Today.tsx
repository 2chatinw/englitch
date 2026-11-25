import { MISSIONS, PHRASES, SENTENCES } from '../data/content';
import { Icon } from '../components/Icon';
import { Bar, SpeakButton } from '../components/ui';
import { useProgress } from '../state/progress';
import { today } from '../lib/util';
import { PAGES, navigate } from '../lib/router';
import { LevelCard } from '../components/LevelCard';

const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

export default function Today() {
  const { state, day, streak, setSettings } = useProgress();
  const t = today();
  const learned = Object.keys(state.srs).length;
  const solid = Object.values(state.srs).filter((x) => x.b >= 3).length;
  const due = PHRASES.filter((p) => state.srs[p.e] && state.srs[p.e].d <= t).length;
  const done = MISSIONS.filter((m) => day[m.k] >= m.goal).length;
  const next = MISSIONS.find((m) => day[m.k] < m.goal);
  const pct = MISSIONS.reduce((a, m) => a + Math.min(1, day[m.k] / m.goal), 0) / MISSIONS.length;
  const dayIdx = Math.floor(new Date(t + 'T00:00:00').getTime() / 86400000);
  const pod = SENTENCES[dayIdx % SENTENCES.length];
  const firstVisit = !state.settings.onboarded;

  return (
    <div className="page">
      {firstVisit ? (
        <section className="card welcome" data-reveal>
          <span className="kicker">ยินดีต้อนรับ</span>
          <h1 className="welcome-title">ฝึกภาษาอังกฤษไว้คุยกับเพื่อนต่างชาติในเกม</h1>
          <ol className="steps">
            <li><b>ทำภารกิจ 5 อย่างด้านล่าง</b> ตามจังหวะของตัวเอง ไม่ต้องรีบ ระบบจะพาไปทีละขั้น</li>
            <li><b>ครบ 4 ทักษะ ฟัง พูด อ่าน เขียน</b> ประโยคที่ยังพลาดจะวนกลับมาให้ฝึกอีกเอง</li>
            <li><b>ทุกอย่างฟรี</b> ใช้ได้ทั้งคอมและมือถือ ความคืบหน้าเก็บในบัญชี เล่นต่อได้ทุกเครื่อง</li>
          </ol>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => { setSettings({ onboarded: true }); navigate('listen'); }}>
              เริ่มภารกิจแรก <Icon name="arrow" />
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSettings({ onboarded: true })}>ดูภาพรวมก่อน</button>
          </div>
        </section>
      ) : (
        <section className="card hero" data-reveal>
          <div className="hero-copy">
            <span className="kicker">วันนี้</span>
            <h1 className="hero-title">
              {next ? <>{done === 0 && pct === 0 ? 'เริ่มที่' : 'ต่อด้วย'}<br /><span className="hl">{next.label}</span></> : <>ครบทุกภารกิจแล้ว<br /><span className="hl">GG! เจอกันพรุ่งนี้</span></>}
            </h1>
            <p className="muted">
              {done}/{MISSIONS.length} ภารกิจ · {streak > 0 ? 'ฝึกต่อเนื่อง ' + streak + ' วัน' : 'เริ่มนับวันต่อเนื่องวันนี้เลย'}
            </p>
            {next ? (
              <button type="button" className="btn btn-primary btn-lg" onClick={() => navigate(next.k)}>
                <Icon name={PAGES[next.k].icon} /> ไปที่{PAGES[next.k].th} <Icon name="arrow" />
              </button>
            ) : (
              <button type="button" className="btn btn-ghost btn-lg" onClick={() => navigate('read')}>ฝึกอ่านเพิ่มอีกรอบ</button>
            )}
          </div>
          <div className="ring" style={{ ['--p' as string]: String(pct) }} role="img" aria-label={'ทำภารกิจวันนี้ไปแล้ว ' + Math.round(pct * 100) + '%'}>
            <span className="ring-num num">{Math.round(pct * 100)}<small>%</small></span>
            <span className="ring-label">ของวันนี้</span>
          </div>
        </section>
      )}

      <LevelCard />

      <section className="card" data-reveal>
        <div className="section-head">
          <h2>ภารกิจวันนี้</h2>
        </div>
        <ul className="missions">
          {MISSIONS.map((m) => {
            const n = Math.min(day[m.k], m.goal);
            const complete = n >= m.goal;
            return (
              <li key={m.k} className={'mission' + (complete ? ' is-done' : '') + (next?.k === m.k ? ' is-next' : '')}>
                <a href={'#' + m.k} className="mission-link">
                  <span className="mission-icon"><Icon name={complete ? 'check' : PAGES[m.k].icon} /></span>
                  <span className="mission-body">
                    <span className="mission-title">{m.label}</span>
                    <span className="mission-meta"><b className="num">{n}/{m.goal}</b> {m.unit}</span>
                    <Bar value={n / m.goal} tone={complete ? 'good' : 'accent'} />
                  </span>
                  <Icon name="arrow" />
                </a>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="stats" data-reveal>
        <div className="stat"><b className="num">{learned}</b><span>ประโยคที่เคยฝึก<br />จาก {PHRASES.length}</span></div>
        <div className="stat"><b className="num">{solid}</b><span>ประโยคที่จำได้แม่น</span></div>
        <div className={'stat' + (due > 0 ? ' stat-alert' : '')}><b className="num">{due}</b><span>ประโยครอทบทวน</span></div>
      </section>

      <section className="card pod" data-reveal>
        <span className="kicker">ประโยคประจำวัน</span>
        <p className="pod-en">{pod.e}</p>
        <p className="muted">{pod.t}{pod.n ? ' — ' + pod.n : ''}</p>
        <div className="row"><SpeakButton text={pod.s} /><SpeakButton text={pod.s} slow /></div>
      </section>

      {isIOS && !isStandalone && !state.settings.installHintDismissed ? (
        <section className="card tip" data-reveal>
          <Icon name="share" />
          <div>
            <b>ติดตั้งเป็นแอปบน iPhone</b>
            <p className="muted small">ใน Safari กดปุ่มแชร์ แล้วเลือก "เพิ่มไปยังหน้าจอโฮม" จะเปิดได้เหมือนแอป และความคืบหน้าไม่หายง่าย</p>
          </div>
          <button type="button" className="icon-btn" aria-label="ซ่อนคำแนะนำ" onClick={() => setSettings({ installHintDismissed: true })}><Icon name="x" /></button>
        </section>
      ) : null}
    </div>
  );
}
