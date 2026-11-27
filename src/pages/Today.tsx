import { PHRASES, SENTENCES } from '../data/content';
import { Icon } from '../components/Icon';
import { useProgress } from '../state/progress';
import { today } from '../lib/util';
import { CategoryPicker } from '../components/CategoryPicker';
import { DailyPhrase } from '../components/DailyPhrase';

const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);
const isStandalone = typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true);

/**
 * Lobby: pick a category (and then a skill) first. Below, a bento (owner's pick): the phrase of the day as an
 * audio player in the big card, and the progress numbers beside it.
 */
export default function Today() {
  const { state, setSettings } = useProgress();
  const t = today();
  const learned = Object.keys(state.srs).length;
  const solid = Object.values(state.srs).filter((x) => x.b >= 3).length;
  const due = PHRASES.filter((p) => state.srs[p.e] && state.srs[p.e].d <= t).length;
  const dayIdx = Math.floor(new Date(t + 'T00:00:00').getTime() / 86400000);
  const pod = SENTENCES[dayIdx % SENTENCES.length];
  const share = learned / PHRASES.length;
  const pct = learned > 0 ? Math.max(1, Math.round(share * 100)) : 0;

  return (
    <div className="page">
      <CategoryPicker />

      <section className="bento" data-reveal aria-label="ความคืบหน้าและประโยคประจำวัน">
        <DailyPhrase phrase={pod} />
        <div className="bento-side">
          <div className="bento-tile bento-big">
            <span className="bento-ring" role="img" aria-label={'ฝึกไปแล้ว ' + pct + '% ของทั้งหมด'}>
              <svg viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="40" className="bento-ring-track" />
                <circle cx="50" cy="50" r="40" pathLength="100" className="bento-ring-fill"
                  style={{ strokeDasharray: share * 100 + ' 100', strokeOpacity: learned > 0 ? 1 : 0 }} />
              </svg>
              <span className="num">{pct}%</span>
            </span>
            <span className="bento-txt">
              <b className="num">{learned.toLocaleString()}</b>
              <span>ประโยคที่เคยฝึก<br />จาก {PHRASES.length.toLocaleString()}</span>
            </span>
          </div>
          <div className="bento-row">
            <div className="bento-tile">
              <span className="bento-chip is-good">★ แม่น</span>
              <b className="num">{solid}</b>
              <span>จำได้แม่น</span>
            </div>
            <div className={'bento-tile' + (due > 0 ? ' is-due' : '')}>
              <span className="bento-chip is-hot">↻ รอ</span>
              <b className="num">{due}</b>
              <span>รอทบทวน</span>
            </div>
          </div>
        </div>
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
