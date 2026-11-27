import { useEffect, useState } from 'react';
import { Sheet } from './Sheet';
import { Icon } from './Icon';
import { useProgress, type Settings as S } from '../state/progress';
import { useToast } from '../state/toast';
import { canSpeak, englishVoices, onVoicesChanged, say } from '../lib/speech';
import { copyText } from '../lib/util';
import { clearSessions } from '../state/session';

export function SettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setSettings, reset, exportCode, importCode } = useProgress();
  const toast = useToast();
  const [voices, setVoices] = useState(englishVoices);
  const [code, setCode] = useState('');
  const [confirm, setConfirm] = useState(false);
  useEffect(() => onVoicesChanged(() => setVoices(englishVoices())), []);
  const st = state.settings;
  const themes: [S['theme'], string][] = [['system', 'ตามเครื่อง'], ['light', 'สว่าง'], ['dark', 'มืด']];
  const rates: [number, string][] = [[0.75, 'ช้า'], [0.9, 'ปกติ'], [1, 'เร็ว']];
  const levels: [S['level'], string][] = [['auto', 'อัตโนมัติ'], ['easy', 'ง่าย'], ['medium', 'กลาง'], ['hard', 'ยาก']];

  return (
    <Sheet open={open} onClose={onClose} title="ตั้งค่า" onClosed={() => setConfirm(false)}>
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
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => say('Nice to meet you. How are you today?')}>
                <Icon name="speaker" /> ทดลองฟังเสียง
              </button>
            </>
          ) : <p className="muted">เบราว์เซอร์นี้อ่านออกเสียงไม่ได้ ลองเปิดด้วย Chrome หรือ Safari</p>}
          <label className="switch">
            <input type="checkbox" checked={st.autoPlay} onChange={(e) => setSettings({ autoPlay: e.target.checked })} />
            <span>เล่นเสียงอัตโนมัติเมื่อขึ้นประโยคใหม่</span>
          </label>
        </section>

        <section className="field">
          <span className="field-label">ระดับความยาก</span>
          <div className="seg" role="radiogroup" aria-label="ระดับความยาก">
            {levels.map(([k, l]) => (
              <button key={k} type="button" role="radio" aria-checked={st.level === k} className="seg-btn"
                onClick={() => { setSettings({ level: k }); clearSessions(); }}>{l}</button>
            ))}
          </div>
          <p className="muted small">
            {st.level === 'auto'
              ? 'เริ่มจากประโยคง่าย จำได้มากพอแล้วระบบจะเปิดระดับที่ยากขึ้นให้เอง'
              : 'ฝึกเฉพาะประโยคระดับนี้ ง่าย = สั้น คำพื้นฐาน · กลาง = ยาวขึ้น มีคำและไวยากรณ์ระดับกลาง · ยาก = คำทางการ ไวยากรณ์ซับซ้อน สำนวน ศัพท์เฉพาะ'}
          </p>
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
          <p className="muted small">
            {state.owner
              ? 'คุณเข้าสู่ระบบอยู่ ความคืบหน้าซิงก์ทุกเครื่องให้อัตโนมัติ รหัสสำรองใช้เก็บไว้เผื่อเท่านั้น'
              : 'ความคืบหน้าเก็บอยู่ในเบราว์เซอร์ของเครื่องนี้ สร้างรหัสสำรองเก็บไว้ แล้ววางในเครื่องอื่นเพื่อฝึกต่อ หรือเข้าสู่ระบบเพื่อซิงก์อัตโนมัติ'}
          </p>
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
              <p className="small">ลบความคืบหน้า สถิติ และประโยคที่ฝึกไว้ทั้งหมด ย้อนกลับไม่ได้ ยืนยันไหม?</p>
              <div className="row">
                <button type="button" className="btn btn-danger btn-sm" onClick={() => { reset(); clearSessions(); setConfirm(false); toast('เริ่มต้นใหม่แล้ว'); }}>ยืนยันลบ</button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>ยกเลิก</button>
              </div>
            </div>
          ) : (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(true)}>ล้างความคืบหน้าทั้งหมด</button>
          )}
        </section>
    </Sheet>
  );
}
