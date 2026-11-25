import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { INTERVALS, MISSIONS, type Kind } from '../data/content';
import { addDays, today } from '../lib/util';
import { setVoiceSettings } from '../lib/speech';
import { useToast } from './toast';
import { useAuth } from './auth';
import { saveProgress, watchProgress } from '../lib/cloud';

export interface DayStats { listen: number; speak: number; read: number; write: number; chat: number; xp: number }
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
  /** Account this device's progress belongs to; null for a guest. */
  owner: string | null;
}
export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error';

const KEY = 'englitch-v1';
const OLD_KEY = 'gg-english-v1'; // before the rename; read once so earlier progress isn't lost
const emptyDay = (): DayStats => ({ listen: 0, speak: 0, read: 0, write: 0, chat: 0, xp: 0 });
const fresh = (): State => ({
  v: 1, xp: 0, streak: 0, lastActive: null, days: {}, srs: {}, updatedAt: 0, owner: null,
  settings: { voiceURI: '', rate: 0.9, autoPlay: true, theme: 'system', onboarded: false, installHintDismissed: false },
});

/** Combine two copies of the same player's progress without losing work done on either device. */
export function mergeStates(local: State, remote: State, addXp = false): State {
  const days: Record<string, DayStats> = { ...remote.days };
  for (const [k, d] of Object.entries(local.days)) {
    const r = days[k];
    if (!r) { days[k] = d; continue; }
    const m = { ...emptyDay() };
    (Object.keys(m) as (keyof DayStats)[]).forEach((f) => { m[f] = Math.max(d[f] || 0, r[f] || 0); });
    days[k] = m;
  }
  const srs: Record<string, SrsItem> = { ...remote.srs };
  for (const [k, a] of Object.entries(local.srs)) {
    const b = srs[k];
    if (!b || a.b > b.b || (a.b === b.b && a.d > b.d)) srs[k] = a;
  }
  const la = local.lastActive || '', ra = remote.lastActive || '';
  const streakSrc = la > ra ? local : ra > la ? remote : (local.streak >= remote.streak ? local : remote);
  // Re-count the run of active days from the merged history (guest days can bridge account days).
  let walked = 0;
  if (streakSrc.lastActive) {
    for (let k = streakSrc.lastActive; days[k] && days[k].xp > 0; k = addDays(k, -1)) walked++;
  }
  return {
    ...remote,
    xp: addXp ? remote.xp + local.xp : Math.max(local.xp, remote.xp),
    streak: Math.max(streakSrc.streak, walked),
    lastActive: streakSrc.lastActive,
    days, srs,
    settings: local.settings,
    updatedAt: Math.max(local.updatedAt, remote.updatedAt),
  };
}

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
    owner: typeof s.owner === 'string' ? s.owner : null,
  };
}
function load(): State {
  try { const raw = localStorage.getItem(KEY) ?? localStorage.getItem(OLD_KEY); return raw ? normalize(JSON.parse(raw)) : fresh(); } catch { return fresh(); }
}


interface Api {
  state: State;
  day: DayStats;
  streak: number;
  sync: SyncStatus;
  gain: (kind: Kind, pts: number) => void;
  /** Record how a practised sentence went, so missed ones come back sooner (spaced review). */
  remember: (id: string, ok: boolean) => void;
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
  const ref = useRef(state);
  ref.current = state;
  const toast = useToast();
  const { user } = useAuth();
  const uid = user?.uid ?? null;
  const [sync, setSync] = useState<SyncStatus>('off');

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage blocked */ }
  }, [state]);

  /* ---- Cloud sync (only while signed in) ---- */
  const lastCloud = useRef<string | null>(null);   // JSON last read from or written to the cloud
  const cloudReady = useRef(false);                // never write before the first read, or we'd overwrite the account
  const prevUid = useRef<string | null>(null);

  useEffect(() => {
    if (prevUid.current && !uid) {
      // Signed out: progress is safe in the cloud; this device goes back to a fresh guest.
      setState((s) => ({ ...fresh(), settings: s.settings }));
      setSync('off');
    }
    prevUid.current = uid;
    if (!uid) return;
    cloudReady.current = false;
    lastCloud.current = null;
    setSync('syncing');
    let first = true;
    const stop = watchProgress(uid, (json) => {
      const isFirst = first;
      first = false;
      let remote: State | null = null;
      if (json) { try { remote = normalize(JSON.parse(json)); } catch { remote = null; } }
      setState((cur) => {
        let next: State;
        if (cur.owner && cur.owner !== uid) next = remote ? { ...remote, settings: cur.settings } : { ...fresh(), settings: cur.settings };
        else if (!remote) next = cur;
        else next = mergeStates(cur, remote, isFirst && !cur.owner); // a guest's first sign-in adds its XP to the account
        next = { ...next, owner: uid };
        return JSON.stringify(next) === JSON.stringify(cur) ? cur : next;
      });
      lastCloud.current = json;
      cloudReady.current = true;
      setSync('synced');
    }, () => setSync('error'));
    return stop;
  }, [uid]);

  // Progress is private: it is written only to users/{uid}, which no one but its owner can read.
  const saveTimer = useRef<number | undefined>(undefined);
  const flush = useCallback(() => {
    window.clearTimeout(saveTimer.current);
    const s = ref.current;
    if (!uid || !cloudReady.current || s.owner !== uid) return;
    const json = JSON.stringify(s);
    if (json !== lastCloud.current) {
      lastCloud.current = json;
      saveProgress(uid, json, s.updatedAt).then(() => setSync('synced'), () => { lastCloud.current = null; setSync('error'); });
    }
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(flush, 1500);
    return () => window.clearTimeout(saveTimer.current);
  }, [state, uid, flush]);

  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') flush(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [flush]);

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
    if (mission && before + 1 === mission.goal) toast('ภารกิจ "' + mission.label + '" สำเร็จแล้ว!');
  }, [toast]);

  const remember = useCallback((id: string, ok: boolean) => {
    const t = today();
    setState((s) => {
      const cur = s.srs[id];
      if (ok && cur && cur.d > t) return s; // right again before it was due: keep the schedule
      const b = ok ? Math.min(6, (cur ? cur.b : 0) + 1) : 0;
      const item: SrsItem = { b, d: addDays(t, INTERVALS[b]) };
      return { ...s, srs: { ...s.srs, [id]: item }, updatedAt: Date.now() };
    });
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch }, updatedAt: Date.now() }));
  }, []);

  const reset = useCallback(() => {
    setState((s) => ({ ...fresh(), settings: { ...s.settings }, owner: s.owner, updatedAt: Date.now() }));
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
      setState((s) => (s.owner ? mergeStates(next, s) : { ...next, owner: null, updatedAt: Date.now() }));
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
      sync, gain, remember, setSettings, reset, exportCode, importCode,
    };
  }, [state, sync, gain, remember, setSettings, reset, exportCode, importCode]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
