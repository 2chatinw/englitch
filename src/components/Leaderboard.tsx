import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { Avatar } from './Account';
import { useAuth } from '../state/auth';
import { watchBoard, type BoardEntry } from '../lib/cloud';
import { addDays, today } from '../lib/util';

export function Leaderboard() {
  const { status, user } = useAuth();
  const [rows, setRows] = useState<BoardEntry[] | null>(null);
  const [failed, setFailed] = useState(false);
  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    return watchBoard((r) => { setRows(r); setFailed(false); }, () => setFailed(true), 20);
  }, [uid]);

  if (status === 'disabled') return null;
  const t = today();
  const liveStreak = (r: BoardEntry) => (r.lastActive === t || r.lastActive === addDays(t, -1) ? r.streak : 0);

  return (
    <section className="card" data-reveal>
      <div className="section-head">
        <h2>อันดับเพื่อน</h2>
        <span className="muted small">เรียงตาม XP รวม</span>
      </div>
      {!user ? (
        <div className="board-cta">
          <p className="muted">เข้าสู่ระบบเพื่อเก็บความคืบหน้าไว้ในบัญชี และแข่ง XP กับเพื่อน</p>
          <button type="button" className="btn btn-primary" onClick={() => window.dispatchEvent(new Event('gg:account'))}>
            เข้าสู่ระบบ / สมัคร <Icon name="arrow" />
          </button>
        </div>
      ) : failed ? (
        <p className="muted small">โหลดอันดับไม่ได้ตอนนี้ ลองใหม่ภายหลัง</p>
      ) : rows === null ? (
        <p className="muted small">กำลังโหลดอันดับ…</p>
      ) : rows.length === 0 ? (
        <p className="muted small">ยังไม่มีใครในอันดับ ฝึกสักข้อแล้วชื่อคุณจะขึ้นเป็นคนแรก</p>
      ) : (
        <ol className="board">
          {rows.map((r, i) => (
            <li key={r.uid} className={'board-row' + (r.uid === uid ? ' is-me' : '')}>
              <span className={'board-rank num' + (i < 3 ? ' top' : '')}>{i + 1}</span>
              <Avatar name={r.name} photo={r.photo} size={34} />
              <span className="board-name">{r.name}{r.uid === uid ? <small> (คุณ)</small> : null}</span>
              {liveStreak(r) > 0 ? <span className="board-streak"><Icon name="flame" /><b className="num">{liveStreak(r)}</b></span> : null}
              <span className="board-xp num">{r.xp.toLocaleString()}<small> XP</small></span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
