import { PHRASES, SENTENCES } from '../data/content';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/ui';
import { useProgress } from '../state/progress';
import { today } from '../lib/util';
import { PAGES, navigate, type Route } from '../lib/router';
import { MissionBar, MissionBoard } from '../components/Missions';
import { activeMission, allMissions, missionStats, readOnlyMission } from '../lib/missions';

const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

const MODES: Route[] = ['listen', 'speak', 'read', 'write'];

export default function Today() {
  const { state, streak, setSettings } = useProgress();
  const t = today();
  const learned = Object.keys(state.srs).length;
  const solid = Object.values(state.srs).filter((x) => x.b >= 3).length;
  const due = PHRASES.filter((p) => state.srs[p.e] && state.srs[p.e].d <= t).length;
  const dayIdx = Math.floor(new Date(t + 'T00:00:00').getTime() / 86400000);
  const pod = SENTENCES[dayIdx % SENTENCES.length];
  const firstVisit = !state.settings.onboarded;
  const active = activeMission(state);
  const m = active ? missionStats(state, active) : null;
  const ms = allMissions(state);
  const overall = ms.reduce((a, x) => a + x.done, 0) / ms.reduce((a, x) => a + x.total, 0);
  // suggestion when nothing is picked: the first mission not passed yet
  const suggest = ms.find((x) => !x.complete) ?? null;

  return (
    <div className="page">
      {firstVisit ? (
        <section className="card welcome" data-reveal>
          <span className="kicker">ยินดีต้อนรับ</span>
          <h1 className="welcome-title">ฝึกภาษาอังกฤษไว้คุยกับเพื่อนต่างชาติในเกม</h1>
          <ol className="steps">
            <li><b>เลือก Mission ตามหมวด</b> เช่น ทักทาย คอลในเกม หาเพื่อน แล้วฝึกตามจังหวะของตัวเอง ไม่มีรีเซ็ตรายวัน</li>
            <li><b>ครบ 4 ทักษะ ฟัง พูด อ่าน เขียน</b> ตอบถูกครบทุกประโยคในหมวด = ผ่าน Mission</li>
            <li><b>ทุกอย่างฟรี</b> ใช้ได้ทั้งคอมและมือถือ ความคืบหน้าเก็บในบัญชี เล่นต่อได้ทุกเครื่อง</li>
          </ol>
          <div className="row">
            <button type="button" className="btn btn-primary" onClick={() => setSettings({ onboarded: true, mission: suggest?.c ?? null })}>
              เริ่ม Mission แรก <Icon name="arrow" />
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setSettings({ onboarded: true })}>ดูภาพรวมก่อน</button>
          </div>
        </section>
      ) : (
        <section className="card hero" data-reveal>
          <div className="hero-copy">
            <span className="kicker">{m ? 'Mission ที่เล่นอยู่' : 'ฝึกรวมทุกหมวด'}</span>
            <h1 className="hero-title">
              {m ? <><span aria-hidden="true">{m.icon}</span> <span className="hl">{m.name}</span></> : <>เลือก Mission<br /><span className="hl">ที่อยากฝึกด้านล่าง</span></>}
            </h1>
            {m ? (
              <>
                <MissionBar m={m} />
                <p className="muted">
                  {m.complete ? 'ผ่าน Mission นี้แล้ว! ทบทวนต่อหรือเลือก Mission ใหม่ได้เลย' : 'ผ่านแล้ว ' + m.done + ' จาก ' + m.total + ' ประโยค'}
                  {streak > 0 ? ' · ฝึกต่อเนื่อง ' + streak + ' วัน' : ''}
                </p>
                <div className="row">
                  {(readOnlyMission(m.c) ? (['read'] as Route[]) : MODES).map((r, i) => (
                    <button key={r} type="button" className={'btn ' + (i === 0 ? 'btn-primary' : 'btn-ghost')} onClick={() => navigate(r)}>
                      <Icon name={PAGES[r].icon} /> {PAGES[r].th}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="muted">หรือกดเมนูด้านข้างเพื่อฝึกรวมทุกหมวดเลย{streak > 0 ? ' · ฝึกต่อเนื่อง ' + streak + ' วัน' : ''}</p>
                {suggest ? (
                  <button type="button" className="btn btn-primary btn-lg" onClick={() => setSettings({ mission: suggest.c })}>
                    <span aria-hidden="true">{suggest.icon}</span> เริ่ม Mission {suggest.short} <Icon name="arrow" />
                  </button>
                ) : null}
              </>
            )}
          </div>
          <div className="ring" style={{ ['--p' as string]: String(overall) }} role="img" aria-label={'ผ่านทุก Mission ไปแล้ว ' + Math.round(overall * 100) + '%'}>
            <span className="ring-num num">{Math.round(overall * 100)}<small>%</small></span>
            <span className="ring-label">ของทั้งหมด</span>
          </div>
        </section>
      )}

      <MissionBoard />

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
