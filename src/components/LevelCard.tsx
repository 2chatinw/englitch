import { useEffect, useRef } from 'react';
import { LEVELS, type Level } from '../data/content';
import { Icon } from './Icon';
import { Bar } from './ui';
import { useProgress } from '../state/progress';
import { useToast } from '../state/toast';
import { levelStatus } from '../pages/practice';

const NAME: Record<Level, string> = { easy: 'ง่าย', medium: 'กลาง', hard: 'ยาก' };
// words, not numbers, so this card never reads like the mission counts (10/10) below it
const WORDS: Record<Level, string> = { easy: 'ประโยคสั้น', medium: 'ยาวขึ้น', hard: 'ประโยคยาว' };

/**
 * Today page: the three difficulty steps as badges (open, current, locked) and how close the next one is.
 * Sentences get longer level by level; nothing here is timed.
 */
export function LevelCard() {
  const { state } = useProgress();
  const st = levelStatus(state);
  const current: Level = st.fixed ?? st.top;

  return (
    <section className="card lvl" data-reveal aria-labelledby="lvl-h">
      <div className="section-head">
        <h2 id="lvl-h">ระดับประโยค</h2>
        <span className="pill">{st.fixed ? 'เลือกเอง' : 'อัตโนมัติ'}</span>
      </div>
      <ol className="lvl-steps">
        {LEVELS.map(({ k }, i) => {
          const open = st.fixed ? k === st.fixed : st.open.includes(k);
          const cls = 'lvl-step lvl-' + k + (open ? ' is-open' : ' is-locked') + (k === current ? ' is-current' : '');
          return (
            <li key={k} className={cls} aria-current={k === current ? 'step' : undefined}>
              {i > 0 ? <span className="lvl-link" aria-hidden="true" /> : null}
              <span className="lvl-badge" aria-hidden="true">
                {open ? <b>{i + 1}</b> : <Icon name="lock" />}
              </span>
              <span className="lvl-name">{NAME[k]}</span>
              <span className="lvl-sub">{WORDS[k]}</span>
              <span className="sr-only">{open ? (k === current ? ' กำลังฝึก' : ' เปิดแล้ว') : ' ยังล็อก'}</span>
            </li>
          );
        })}
      </ol>
      {st.fixed ? (
        <p className="muted small">ตอนนี้ฝึกเฉพาะระดับ{NAME[st.fixed]} เปลี่ยนเป็นอัตโนมัติได้ในตั้งค่า</p>
      ) : st.next ? (
        <div className="lvl-next">
          <Bar value={st.have / st.need} tone="good" label={'ความคืบหน้าสู่ระดับ' + NAME[st.next]} />
          <p className="muted small">
            ตอบถูกอีก <b className="num">{Math.max(0, st.need - st.have)}</b> ประโยค จะเปิดระดับ{NAME[st.next]}ให้เอง
          </p>
        </div>
      ) : (
        <p className="muted small">เปิดครบทุกระดับแล้ว ประโยคจะสุ่มมาจากทั้งสามระดับ</p>
      )}
    </section>
  );
}

/** Shows a toast when practice opens a new level (auto mode). Mounted once in the app shell. */
export function useLevelUpToast() {
  const { state } = useProgress();
  const toast = useToast();
  const opened = levelStatus(state).open.length;
  const prev = useRef(opened);
  useEffect(() => {
    if (state.settings.level === 'auto' && opened > prev.current) {
      const lv = LEVELS[opened - 1].k;
      toast('เปิดระดับ' + NAME[lv] + 'แล้ว! ต่อไปจะมีประโยคที่ยาวขึ้นนิดนึง');
    }
    prev.current = opened;
  }, [opened, state.settings.level, toast]);
}
