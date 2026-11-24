import { useEffect, useState, type FormEvent } from 'react';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import { useAuth } from '../state/auth';
import { useProgress } from '../state/progress';
import { useToast } from '../state/toast';
import { authErrorText } from '../lib/cloud';

export function Avatar({ name, photo, size = 36 }: { name: string; photo?: string | null; size?: number }) {
  const [broken, setBroken] = useState(false);
  const initial = (name.trim()[0] || '?').toUpperCase();
  if (photo && !broken) {
    return <img className="avatar" src={photo} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setBroken(true)} />;
  }
  return <span className="avatar avatar-letter" style={{ width: size, height: size, fontSize: size * 0.45 }} aria-hidden="true">{initial}</span>;
}

const GoogleMark = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.8z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </svg>
);

export function AccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const auth = useAuth();
  const { state, setSettings, sync } = useProgress();
  const toast = useToast();
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rename, setRename] = useState('');

  useEffect(() => { if (open) auth.ensure(); }, [open, auth]);
  useEffect(() => { if (auth.status === 'in' && open) { setError(''); setPassword(''); } }, [auth.status, open]);

  const run = async (fn: () => Promise<void>, done?: string) => {
    setBusy(true); setError('');
    try { await fn(); if (done) toast(done); }
    catch (e) { setError(authErrorText(e)); }
    finally { setBusy(false); }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === 'up') {
      if (!name.trim()) { setError('ตั้งชื่อเล่นก่อน เพื่อนจะเห็นชื่อนี้ในอันดับ'); return; }
      run(() => auth.emailUp(name, email, password), 'สมัครสมาชิกเรียบร้อย ยินดีต้อนรับ!');
    } else run(() => auth.emailIn(email, password), 'เข้าสู่ระบบแล้ว');
  };

  const u = auth.user;
  const syncText = { off: '', syncing: 'กำลังซิงก์…', synced: 'ซิงก์แล้ว', error: 'ซิงก์ไม่สำเร็จ จะลองใหม่อัตโนมัติ' }[sync];

  return (
    <Sheet open={open} onClose={onClose} title={u ? 'บัญชีของฉัน' : 'เข้าสู่ระบบ'} onClosed={() => { setError(''); setPassword(''); }}>
      {auth.status === 'disabled' ? (
        <section className="field">
          <p>ระบบบัญชียังไม่เปิดใช้บนเว็บนี้</p>
          <p className="muted small">ตอนนี้ความคืบหน้าเก็บในเครื่องนี้ ใช้รหัสสำรองในหน้าตั้งค่าเพื่อย้ายเครื่องได้</p>
        </section>
      ) : u ? (
        <>
          <section className="account-card">
            <Avatar name={u.name} photo={u.photo} size={56} />
            <div className="account-id">
              <b>{u.name}</b>
              <span className="muted small">{u.email}</span>
              {syncText ? <span className={'sync sync-' + sync}><Icon name={sync === 'error' ? 'x' : 'check'} /> {syncText}</span> : null}
            </div>
          </section>
          <section className="field">
            <span className="field-label">ชื่อที่เพื่อนเห็น</span>
            <form className="row" onSubmit={(e) => {
              e.preventDefault();
              const n = rename.trim();
              if (!n) return;
              run(() => auth.rename(n), 'เปลี่ยนชื่อแล้ว').then(() => setRename(''));
            }}>
              <label className="sr-only" htmlFor="rename">ชื่อเล่นใหม่</label>
              <input id="rename" type="text" maxLength={40} placeholder={u.name} value={rename} onChange={(e) => setRename(e.target.value)} className="grow" style={{ width: 'auto', flex: '1 1 160px' }} />
              <button type="submit" className="btn btn-ghost btn-sm" disabled={busy || !rename.trim()}>บันทึก</button>
            </form>
            <label className="switch">
              <input type="checkbox" checked={state.settings.showOnBoard} onChange={(e) => setSettings({ showOnBoard: e.target.checked })} />
              <span>แสดงชื่อและ XP ของฉันในอันดับเพื่อน</span>
            </label>
          </section>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <section className="field">
            <p className="muted small">ออกจากระบบแล้ว เครื่องนี้จะกลับเป็นโหมดผู้เยี่ยมชม ความคืบหน้าของคุณยังอยู่ในบัญชีครบ</p>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => run(async () => { await auth.signOut(); onClose(); }, 'ออกจากระบบแล้ว')}>ออกจากระบบ</button>
          </section>
        </>
      ) : (
        <>
          <ul className="perks">
            <li><Icon name="check" /> เล่นต่อได้ทุกเครื่อง ทั้งคอมและมือถือ</li>
            <li><Icon name="check" /> แข่ง XP กับเพื่อนในกระดานอันดับ</li>
            <li><Icon name="check" /> ความคืบหน้าในเครื่องนี้จะย้ายเข้าบัญชีให้อัตโนมัติ</li>
          </ul>
          <button type="button" className="btn btn-ghost btn-lg btn-block btn-google" disabled={busy}
            onClick={() => run(auth.google, 'เข้าสู่ระบบแล้ว')}>
            <GoogleMark /> เข้าสู่ระบบด้วย Google
          </button>
          <div className="divider"><span>หรือใช้อีเมล</span></div>
          <div className="seg" role="tablist" aria-label="เข้าสู่ระบบหรือสมัคร">
            <button type="button" role="tab" aria-selected={mode === 'in'} aria-checked={mode === 'in'} className="seg-btn" onClick={() => { setMode('in'); setError(''); }}>เข้าสู่ระบบ</button>
            <button type="button" role="tab" aria-selected={mode === 'up'} aria-checked={mode === 'up'} className="seg-btn" onClick={() => { setMode('up'); setError(''); }}>สมัครใหม่</button>
          </div>
          <form className="stack" onSubmit={submit} noValidate>
            {mode === 'up' ? (
              <label className="input-label">ชื่อเล่น (เพื่อนจะเห็นชื่อนี้)
                <input type="text" autoComplete="nickname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            ) : null}
            <label className="input-label">อีเมล
              <input type="email" inputMode="email" autoComplete="email" autoCapitalize="off" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label className="input-label">รหัสผ่าน{mode === 'up' ? ' (อย่างน้อย 6 ตัว)' : ''}
              <input type="password" autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
            <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'กำลังดำเนินการ…' : mode === 'up' ? 'สมัครสมาชิก' : 'เข้าสู่ระบบ'}</button>
            {mode === 'in' ? (
              <button type="button" className="btn-text" disabled={busy} onClick={() => {
                if (!email.trim()) { setError('กรอกอีเมลก่อน แล้วกดลืมรหัสผ่านอีกครั้ง'); return; }
                run(() => auth.reset(email), 'ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่อีเมลแล้ว');
              }}>ลืมรหัสผ่าน?</button>
            ) : null}
          </form>
        </>
      )}
    </Sheet>
  );
}
