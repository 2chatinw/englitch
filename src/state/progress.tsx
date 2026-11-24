import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { INTERVALS, MISSIONS, type Kind } from '../data/content';
import { addDays, today } from '../lib/util';
import { setVoiceSettings } from '../lib/speech';
import { useToast } from './toast';

export interface DayStats { cards: number; listen: number; speak: number; quiz: number; chat: number; xp: number; newCards: number }
export interface Settings {
  voiceURI: string;
  rate: number;
  autoPlay: boolean;
  theme: 'system' | 'light' | 'dark';
  onboarded: boolean;
  installHintDismissed: boolean;
}
export interface SrsItem { b: number; d: string }
export interface State {
  v: 1;
  xp: number;
  streak: number;
  lastActive: string | null;
  days: Record<string, DayStats>;
  srs: Record<string, SrsItem>;
  settings: Settings;
  updatedAt: number;
}
export type Grade = 'again' | 'good' | 'easy';

const KEY = 'gg-english-v1';
const emptyDay = (): DayStats => ({ cards: 0, listen: 0, speak: 0, quiz: 0, chat: 0, xp: 0, newCards: 0 });
const fresh = (): State => ({
  v: 1, xp: 0, streak: 0, lastActive: null, days: {}, srs: {}, updatedAt: 0,
  settings: { voiceURI: '', rate: 0.9, autoPlay: true, theme: 'system', onboarded: false, installHintDismissed: false },
});

export function normalize(raw: unknown): State {
  const f = fresh();
  if (!raw || typeof raw !== 'object') return f;
  const s = raw as Partial<State>;
  return {
    ...f,
    xp: Number(s.xp) || 0,
    streak: Number(s.streak) || 0,
    lastActive: typeof s.lastActive === 'string' ? s.lastActive : null,
    days: s.days && typeof s.days === 'object' ? s.days : {},
    srs: s.srs && typeof s.srs === 'object' ? s.srs : {},
    settings: { ...f.settings, ...(s.settings && typeof s.settings === 'object' ? s.settings : {}) },
    updatedAt: Number(s.updatedAt) || 0,
  };
}
function load(): State {
  try { const raw = localStorage.getItem(KEY); return raw ? normalize(JSON.parse(raw)) : fresh(); } catch { return fresh(); }
}

export interface XpEvent { pts: number; id: number }

interface Api {
  state: State;
  day: DayStats;
  streak: number;
  level: number;
  levelXp: number;
  xpEvent: XpEvent | null;
  gain: (kind: Kind, pts: number) => void;
  grade: (id: string, g: Grade) => void;
  setSettings: (patch: Partial<Settings>) => void;
  reset: () => void;
  exportCode: () => string;
  importCode: (code: string) => boolean;
}
const Ctx = createContext<Api | null>(null);
export function useProgress(): Api {
  const v = useContext(Ctx);
  if (!v) throw new Error('useProgress outside provider');
  return v;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);
  const [xpEvent, setXpEvent] = useState<XpEvent | null>(null);
  const ref = useRef(state);
  ref.current = state;
  const toast = useToast();

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
  }, [state]);

  useEffect(() => {
    setVoiceSettings({ rate: state.settings.rate, voiceURI: state.settings.voiceURI });
  }, [state.settings.rate, state.settings.voiceURI]);

  useEffect(() => {
    const root = document.documentElement;
    if (state.settings.theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = state.settings.theme;
  }, [state.settings.theme]);

  const gain = useCallback((kind: Kind, pts: number) => {
    const t = today();
    const before = ref.current.days[t]?.[kind] || 0;
    const mission = MISSIONS.find((m) => m.k === kind);
    setState((s) => {
      const d = { ...emptyDay(), ...(s.days[t] || {}) };
      d[kind] = (d[kind] || 0) + 1;
      d.xp += pts;
      let streak = s.streak, lastActive = s.lastActive;
      if (lastActive !== t) { streak = lastActive === addDays(t, -1) ? streak + 1 : 1; lastActive = t; }
      const days = { ...s.days, [t]: d };
      const keys = Object.keys(days).sort();
      while (keys.length > 60) delete days[keys.shift() as string];
      return { ...s, xp: s.xp + pts, streak, lastActive, days, updatedAt: Date.now() };
    });
    if (pts > 0) setXpEvent({ pts, id: Date.now() + Math.random() });
    if (mission && before + 1 === mission.goal) toast('ภารกิจ "' + mission.label + '" สำเร็จแล้ว!');
  }, [toast]);

  const grade = useCallback((id: string, g: Grade) => {
    const t = today();
    setState((s) => {
      const cur = s.srs[id];
      const d = { ...emptyDay(), ...(s.days[t] || {}) };
      if (!cur) d.newCards += 1;
      let item: SrsItem;
      if (g === 'again') item = { b: 0, d: t };
      else {
        const b = Math.min(6, (cur ? cur.b : 0) + (g === 'easy' ? 2 : 1));
        item = { b, d: addDays(t, INTERVALS[b]) };
      }
      return { ...s, srs: { ...s.srs, [id]: item }, days: { ...s.days, [t]: d }, updatedAt: Date.now() };
    });
    gain('cards', g === 'again' ? 1 : 2);
  }, [gain]);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch }, updatedAt: Date.now() }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...fresh(), settings: { ...s.settings }, updatedAt: Date.now() }));
  }, []);

  const exportCode = useCallback(() => {
    const json = JSON.stringify(ref.current);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return 'GG1:' + btoa(bin);
  }, []);

  const importCode = useCallback((code: string) => {
    const raw = code.trim();
    if (!raw.startsWith('GG1:')) return false;
    try {
      const bin = atob(raw.slice(4));
      const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
      const next = normalize(JSON.parse(new TextDecoder().decode(bytes)));
      setState({ ...next, updatedAt: Date.now() });
      return true;
    } catch {
      return false;
    }
  }, []);

  const api = useMemo<Api>(() => {
    const t = today();
    const streak = state.lastActive === t || state.lastActive === addDays(t, -1) ? state.streak : 0;
    return {
      state,
      day: { ...emptyDay(), ...(state.days[t] || {}) },
      streak,
      level: Math.floor(state.xp / 100) + 1,
      levelXp: state.xp % 100,
      xpEvent, gain, grade, setSettings, reset, exportCode, importCode,
    };
  }, [state, xpEvent, gain, grade, setSettings, reset, exportCode, importCode]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
