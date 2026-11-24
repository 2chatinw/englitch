import { useState } from 'react';
import { useAuth } from '../state/auth';
import { Brand } from './Brand';
import { Backdrop } from './Backdrop';

const DiscordMark = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M20.3 4.4A19.6 19.6 0 0 0 15.4 3l-.6 1.3a18.2 18.2 0 0 0-5.6 0L8.6 3a19.5 19.5 0 0 0-4.9 1.4C.6 9 0 13.6.3 18.1a19.7 19.7 0 0 0 6 3l1.3-2a12.7 12.7 0 0 1-2-1l.5-.4a14 14 0 0 0 11.9 0l.5.4c-.6.4-1.3.7-2 1l1.3 2a19.6 19.6 0 0 0 6-3c.4-5.2-.7-9.8-3.5-13.7zM8.5 15.3c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4zm7 0c-1.2 0-2.1-1.1-2.1-2.4s.9-2.4 2.1-2.4 2.2 1.1 2.1 2.4c0 1.3-.9 2.4-2.1 2.4z" />
  </svg>
);

const GoogleMark = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.2 3.5-8.8z" />
    <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8z" />
    <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
  </svg>
);

const FacebookMark = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="currentColor" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z" />
  </svg>
);

/** The sign-in buttons (Discord, Facebook, Google) plus the note on what we keep; used inside the landing page's sign-in dialog. */
export function SignInOptions() {
  const { error, google, facebook, discord } = useAuth();
  const [busy, setBusy] = useState<'' | 'google' | 'facebook' | 'discord'>('');
  return (
    <div className="signin">
      <p className="muted">เข้าสู่ระบบเพื่อเริ่มฝึก ความคืบหน้าจะเก็บในบัญชี เล่นต่อได้ทุกเครื่อง</p>
      <div className="login-actions">
        <button type="button" className="btn btn-lg btn-block btn-discord" disabled={!!busy}
          onClick={() => { setBusy('discord'); discord(); }}>
          <DiscordMark /> {busy === 'discord' ? 'กำลังไปที่ Discord…' : 'เข้าสู่ระบบด้วย Discord'}
        </button>
        <button type="button" className="btn btn-lg btn-block btn-facebook" disabled={!!busy}
          onClick={async () => { setBusy('facebook'); await facebook(); setBusy(''); }}>
          <FacebookMark /> {busy === 'facebook' ? 'กำลังเปิดหน้า Facebook…' : 'เข้าสู่ระบบด้วย Facebook'}
        </button>
        <button type="button" className="btn btn-lg btn-block btn-ghost btn-google" disabled={!!busy}
          onClick={async () => { setBusy('google'); await google(); setBusy(''); }}>
          <GoogleMark /> {busy === 'google' ? 'กำลังเปิดหน้า Google…' : 'เข้าสู่ระบบด้วย Google (Gmail)'}
        </button>
      </div>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <p className="login-note">
        เมื่อเข้าสู่ระบบ เราเก็บชื่อ อีเมล และรูปโปรไฟล์ไว้เป็นรายชื่อสมาชิก และใช้บันทึกความคืบหน้าของคุณเท่านั้น
        {' '}<a href="./privacy.html" target="_blank" rel="noopener">อ่านนโยบายความเป็นส่วนตัว</a>
      </p>
    </div>
  );
}

/** Shown while Firebase restores a returning member's session or finishes a Discord sign-in. */
export function Splash({ text }: { text: string }) {
  return (
    <>
      <Backdrop kind="sky" />
      <div className="splash" role="status">
        <Brand size="lg" />
        <p className="muted">{text}</p>
      </div>
    </>
  );
}
