import { useState } from 'react';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import { useAuth } from '../state/auth';
import { useProgress } from '../state/progress';
import { useToast } from '../state/toast';

export function Avatar({ name, photo, size = 36 }: { name: string; photo?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initial = (name.trim()[0] || '?').toUpperCase();
  if (photo && !broken) {
    return <img className="avatar" src={photo} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  }
  return <span className="avatar avatar-letter" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden="true">{initial}</span>;
}

const PROVIDER: Record<string, string> = { discord: 'Discord', google: 'Google', facebook: 'Facebook', password: 'อีเมล', other: 'บัญชี' };

export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const auth = useAuth();
  const { sync } = useProgress();
  const toast = useToast();
  const [rename, setRename] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const u = auth.user;
  const syncText = { off: '', syncing: 'กำลังซิงก์…', synced: 'ซิงก์แล้ว', error: 'ซิงก์ไม่สำเร็จ จะลองใหม่อัตโนมัติ' }[sync];

  return (
    <Sheet open={open} onClose={onClose} title="บัญชีของฉัน">
      {u ? (
        <>
          <section className="account-card">
            <Avatar name={u.name} photo={u.photo} size={56} />
            <div className="account-id">
              <b>{u.name}</b>
              <span className="muted small">เข้าสู่ระบบด้วย {PROVIDER[u.provider] || 'บัญชี'}{u.email ? ' · ' + u.email : ''}</span>
              {syncText ? <span className={'sync sync-' + sync}><Icon name={sync === 'error' ? 'x' : 'check'} /> {syncText}</span> : null}
            </div>
          </section>
          <section className="field">
            <span className="field-label">ชื่อที่แสดงในแอป</span>
            <form className="row" onSubmit={async (e) => {
              e.preventDefault();
              const n = rename.trim();
              if (!n) return;
              setBusy(true);
              try { await auth.rename(n); toast('เปลี่ยนชื่อแล้ว'); setRename(''); }
              catch { toast('เปลี่ยนชื่อไม่สำเร็จ ลองใหม่อีกครั้ง'); }
              finally { setBusy(false); }
            }}>
              <label className="sr-only" htmlFor="rename">ชื่อเล่นใหม่</label>
              <input id="rename" type="text" maxLength={40} placeholder={u.name} value={rename}
                onChange={(e) => setRename(e.target.value)} style={{ width: 'auto', flex: '1 1 160px' }} />
              <button type="submit" className="btn btn-ghost btn-sm" disabled={busy || !rename.trim()}>บันทึก</button>
            </form>
          </section>
          <section className="field">
            <p className="muted small">ความคืบหน้าของคุณเป็นส่วนตัว เห็นได้เฉพาะคุณ และเก็บอยู่ในบัญชีครบ เข้าสู่ระบบใหม่เมื่อไหร่ก็เล่นต่อได้</p>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={async () => {
              setBusy(true);
              try { await auth.signOut(); onClose(); toast('ออกจากระบบแล้ว'); }
              catch { toast('ออกจากระบบไม่สำเร็จ ลองใหม่อีกครั้ง'); }
              finally { setBusy(false); }
            }}>ออกจากระบบ</button>
          </section>
          <section className="field danger-zone">
            <span className="field-label">ลบบัญชี</span>
            {confirmDelete ? (
              <div className="stack">
                <p className="small">ลบบัญชีนี้ ความคืบหน้าทั้งหมด และชื่อในรายชื่อสมาชิกแบบถาวร ย้อนกลับไม่ได้</p>
                <div className="row">
                  <button type="button" className="btn btn-danger btn-sm" disabled={busy} onClick={async () => {
                    setBusy(true);
                    try { await auth.remove(); onClose(); toast('ลบบัญชีแล้ว'); }
                    catch (e) { toast((e as Error).message); }
                    finally { setBusy(false); setConfirmDelete(false); }
                  }}>{busy ? 'กำลังลบ…' : 'ลบถาวร'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => setConfirmDelete(false)}>ยกเลิก</button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-ghost btn-sm danger-link" onClick={() => setConfirmDelete(true)}>ลบบัญชีและข้อมูลของฉัน</button>
            )}
          </section>
        </>
      ) : (
        <p className="muted">ระบบบัญชียังไม่เปิดใช้บนเว็บนี้</p>
      )}
    </Sheet>
  );
}
