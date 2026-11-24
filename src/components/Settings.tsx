import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { Icon } from './Icon';
import { useProgress, type Settings as S } from '../state/progress';
import { useToast } from '../state/toast';
import { canSpeak, englishVoices, onVoicesChanged, say } from '../lib/speech';
import { copyText, prefersReducedMotion } from '../lib/util';
import { clearSessions } from '../state/session';

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setSettings, reset, exportCode, importCode } = useProgress();
  const toast = useToast();
  const [voices, setVoices] = useState(englishVoices);
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [mounted, setMounted] = useState(open);
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => onVoicesChanged(() => setVoices(englishVoices())), []);
  useEffect(() => { if (open) setMounted(true); }, [open]);

  useGSAP(() => {
    if (!mounted || !panel.current || !backdrop.current) return;
    const fast = prefersReducedMotion();
    const wide = window.matchMedia('(min-width: 900px)').matches;
    const from = wide ? { xPercent: 100, yPercent: 0 } : { yPercent: 100, xPercent: 0 };
    if (open) {
      gsap.fromTo(backdrop.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: fast ? 0 : 0.25 });
      gsap.fromTo(panel.current, from, { xPercent: 0, yPercent: 0, duration: fast ? 0 : 0.42, ease: 'power3.out' });
      closeBtn.current?.focus();
    } else {
      gsap.to(backdrop.current, { autoAlpha: 0, duration: fast ? 0 : 0.2 });
      gsap.to(panel.current, { ...from, duration: fast ? 0 : 0.3, ease: 'power3.in', onComplete: () => { setMounted(false); setConfirm(false); } });
    }
  }, { dependencies: [open, mounted] });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  const st = state.settings;
  const themes: [S['theme'], string][] = [['system', 'ตามเครื่อง'], ['light', 'สว่าง'], ['dark', 'มืด']];
  const rates: [number, string][] = [[0.75, 'ช้า'], [0.9, 'ปกติ'], [1, 'เร็ว']];

  return (
    <div className="sheet-wrap">
      <div className="sheet-backdrop" ref={backdrop} onClick={onClose} />
      <div className="sheet" ref={panel} role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <div className="sheet-head">
          <h2 id="settings-title">ตั้งค่า</h2>
          <button type="button" className="icon-btn" ref={closeBtn} onClick={onClose} aria-label="ปิดการตั้งค่า"><Icon name="x" /></button>
        </div>

        <section className="field">
          <span className="field-label">เสียงอ่าน</span>
          {canSpeak ? (
            <>
              <select id="voice" value={st.voiceURI} onChange={(e) => { setSettings({ voiceURI: e.target.value }); }}>
                <option value="">เลือกให้อัตโนมัติ (แนะนำ)</option>
                {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} · {v.lang}</option>)}
              </select>
              <div className="seg" role="radiogroup" aria-label="ความเร็วเสียง">
                {rates.map(([r, l]) => (
                  <button key={r} type="button" role="radio" aria-checked={st.rate === r} className="seg-btn"
                    onClick={() => { setSettings({ rate: r }); }}>{l}</button>
                ))}
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => say('Good game, well played.')}>
                <Icon name="speaker" /> ทดลองฟังเสียง
              </button>
            </>
          ) : <p className="muted">เบราว์เซอร์นี้อ่านออกเสียงไม่ได้ ลองเปิดด้วย Chrome หรือ Safari</p>}
          <label className="switch">
            <input type="checkbox" checked={st.autoPlay} onChange={(e) => setSettings({ autoPlay: e.target.checked })} />
            <span>เล่นเสียงอัตโนมัติเมื่อขึ้นการ์ดหรือประโยคใหม่</span>
          </label>
        </section>

        <section className="field">
          <span className="field-label">ธีม</span>
          <div className="seg" role="radiogroup" aria-label="ธีม">
            {themes.map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={st.theme === k} className="seg-btn" onClick={() => setSettings({ theme: k })}>{l}</button>
            ))}
          </div>
        </section>

        <section className="field">
          <span className="field-label">สำรอง / ย้ายความคืบหน้า</span>
          <p className="muted small">ความคืบหน้าเก็บอยู่ในเบราว์เซอร์ของเครื่องนี้ สร้างรหัสสำรองเก็บไว้ แล้ววางในเครื่องอื่นเพื่อเล่นต่อ</p>
          <textarea id="backup" rows={3} value={code} onChange={(e) => setCode(e.target.value)} spellCheck={false}
            autoCapitalize="off" placeholder="วางรหัสสำรอง (ขึ้นต้นด้วย GG1:) ที่นี่" aria-label="รหัสสำรอง" />
          <div className="row">
            <button type="button" className="btn btn-ghost btn-sm" onClick={async () => {
              const c = exportCode(); setCode(c);
              toast((await copyText(c)) ? 'คัดลอกรหัสสำรองแล้ว เก็บไว้ในโน้ตได้เลย' : 'สร้างรหัสแล้ว กดค้างที่ช่องเพื่อคัดลอก');
            }}><Icon name="copy" /> สร้างรหัสสำรอง</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!code.trim()} onClick={() => {
              if (importCode(code)) { clearSessions(); toast('นำความคืบหน้ากลับมาแล้ว'); setCode(''); }
              else toast('รหัสไม่ถูกต้อง ลองคัดลอกใหม่ให้ครบ');
            }}>นำความคืบหน้ากลับมา</button>
          </div>
        </section>

        <section className="field">
          <span className="field-label">เริ่มใหม่</span>
          {confirm ? (
            <div className="confirm">
              <p className="small">ลบ XP สถิติ และการ์ดที่เรียนไว้ทั้งหมด ย้อนกลับไม่ได้ ยืนยันไหม?</p>
              <div className="row">
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { reset(); clearSessions(); setConfirm(false); toast('เริ่มต้นใหม่แล้ว'); }}>ยืนยันลบ</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>ยกเลิก</button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(true)}>ล้างความคืบหน้าทั้งหมด</button>
          )}
        </section>
      </div>
    </div>
  );
}
