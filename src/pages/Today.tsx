import { PHRASES, SENTENCES } from '../data/content';
import { Icon } from '../components/Icon';
import { SpeakButton } from '../components/ui';
import { useProgress } from '../state/progress';
import { today } from '../lib/util';
import { CategoryPicker } from '../components/CategoryPicker';

const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

/** Lobby: pick a category (and then a skill) first; stats and the phrase of the day below. */
export default function Today() {
  const { state, setSettings } = useProgress();
  const t = today();
  const learned = Object.keys(state.srs).length;
  const solid = Object.values(state.srs).filter((x) => x.b >= 3).length;
  const due = PHRASES.filter((p) => state.srs[p.e] && state.srs[p.e].d <= t).length;
  const dayIdx = Math.floor(new Date(t + 'T00:00:00').getTime() / 86400000);
  const pod = SENTENCES[dayIdx % SENTENCES.length];

  return (
    <div className="page">
      <CategoryPicker />

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
