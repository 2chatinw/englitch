/* Text-to-speech and speech-to-text with the browser's own engines. */

export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

let voices: SpeechSynthesisVoice[] = [];
const listeners = new Set<() => void>();
function loadVoices() {
  try { voices = window.speechSynthesis.getVoices() || []; } catch { voices = []; }
  listeners.forEach((fn) => fn());
}
if (canSpeak) {
  loadVoices();
  try { window.speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch { /* old Safari */ }
}
export function onVoicesChanged(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function englishVoices(): SpeechSynthesisVoice[] {
  return voices
    .filter((v) => /^en[-_]/i.test(v.lang))
    .sort((a, b) => Number(/en[-_]US/i.test(b.lang)) - Number(/en[-_]US/i.test(a.lang)));
}

function bestVoice(uri: string): SpeechSynthesisVoice | null {
  const en = englishVoices();
  if (uri) { const chosen = en.find((v) => v.voiceURI === uri); if (chosen) return chosen; }
  return en.find((v) => /en[-_]US/i.test(v.lang) && /Samantha|Google|Natural|Aria|Jenny|Ava|Allison/i.test(v.name))
    || en.find((v) => /en[-_]US/i.test(v.lang)) || en[0] || null;
}

export interface VoiceSettings { rate: number; voiceURI: string }
let current: VoiceSettings = { rate: 0.9, voiceURI: '' };
export function setVoiceSettings(v: VoiceSettings) { current = v; }

export function say(text: string, slow = false): boolean {
  if (!canSpeak) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = Math.max(0.5, current.rate * (slow ? 0.72 : 1));
    const v = bestVoice(current.voiceURI);
    if (v) u.voice = v;
    synth.speak(u);
    return true;
  } catch {
    return false;
  }
}

/* ---- Speech recognition ---- */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRec = any;
const SR: AnyRec = typeof window !== 'undefined'
  ? (window as AnyRec).SpeechRecognition || (window as AnyRec).webkitSpeechRecognition
  : null;

let broken = false;
export const micSupported = (): boolean => !!SR && !broken;

export interface ListenHandlers {
  onPartial: (text: string) => void;
  onDone: (text: string, error?: string) => void;
}

export interface Listener { stop: () => void; abort: () => void }

/** Start listening (call from a click). Returns null when the browser can't. */
export function listen(h: ListenHandlers): Listener | null {
  if (!micSupported()) return null;
  let rec: AnyRec;
  try { rec = new SR(); } catch { broken = true; return null; }
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = false;
  rec.maxAlternatives = 1;
  let finalText = '';
  let error: string | undefined;
  let done = false;
  rec.onresult = (e: AnyRec) => {
    let interim = '';
    finalText = '';
    for (const r of e.results) { if (r.isFinal) finalText += r[0].transcript + ' '; else interim += r[0].transcript; }
    h.onPartial((finalText + interim).trim());
  };
  rec.onerror = (e: AnyRec) => {
    error = e.error;
    if (['not-allowed', 'service-not-allowed', 'audio-capture'].includes(e.error)) broken = true;
  };
  rec.onend = () => { if (done) return; done = true; h.onDone(finalText.trim(), error); };
  try { rec.start(); } catch { broken = true; return null; }
  return {
    stop: () => { try { rec.stop(); } catch { /* already stopped */ } },
    abort: () => { done = true; try { rec.abort(); } catch { /* already stopped */ } },
  };
}

export function micErrorText(code?: string): string {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'เบราว์เซอร์ไม่อนุญาตให้ใช้ไมค์ กดอนุญาตไมค์ที่แถบที่อยู่ หรือใช้ไมค์บนคีย์บอร์ดแทน';
    case 'audio-capture': return 'ไม่พบไมค์ในเครื่องนี้';
    case 'network': return 'ระบบแปลงเสียงต้องใช้อินเทอร์เน็ต ลองใหม่อีกครั้ง';
    case 'no-speech': return 'ไม่ได้ยินเสียง ลองพูดใกล้ไมค์อีกนิด';
    default: return 'ฟังไม่ชัด ลองพูดใหม่อีกครั้ง';
  }
}
