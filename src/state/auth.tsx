import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { firebaseEnabled } from '../firebase.config';
import {
  authErrorText, recordMember, renameUser, signInDiscordToken, signInGoogle, signOutUser, watchAuth, type CloudUser,
} from '../lib/cloud';

/** 'loading' until Firebase says who is signed in; the app itself only renders for 'in'. */
export type AuthStatus = 'disabled' | 'loading' | 'in' | 'out';

interface AuthApi {
  status: AuthStatus;
  user: CloudUser | null;
  /** Message from a sign-in attempt that failed (shown on the sign-in screen). */
  error: string;
  /** True while a Discord sign-in is being finished after the redirect back. */
  finishing: boolean;
  google: () => Promise<void>;
  discord: () => void;
  rename: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthApi | null>(null);
export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
}

/** Remembered per device so a returning member sees a short splash instead of the landing page while Firebase restores the session. */
const MEMBER_HINT = 'englitch-member';
export function wasSignedIn(): boolean { try { return localStorage.getItem(MEMBER_HINT) === '1'; } catch { return false; } }
function setMemberHint(on: boolean) { try { if (on) localStorage.setItem(MEMBER_HINT, '1'); else localStorage.removeItem(MEMBER_HINT); } catch { /* storage blocked */ } }

/** What /api/auth/discord/callback leaves in sessionStorage before sending the browser back to the app. */
const DISCORD_KEY = 'englitch-discord';
interface DiscordHandoff { token?: string; name?: string; photo?: string; email?: string; error?: string }

function takeDiscordHandoff(): DiscordHandoff | null {
  try {
    const raw = sessionStorage.getItem(DISCORD_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(DISCORD_KEY);
    return JSON.parse(raw) as DiscordHandoff;
  } catch {
    return null;
  }
}

const DISCORD_ERRORS: Record<string, string> = {
  access_denied: 'ยกเลิกการเข้าสู่ระบบด้วย Discord แล้ว',
  not_configured: 'ระบบล็อกอินด้วย Discord ยังตั้งค่าไม่เสร็จ ใช้ Google ไปก่อนได้',
  state: 'การเข้าสู่ระบบหมดเวลา ลองกดใหม่อีกครั้ง',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(firebaseEnabled ? 'loading' : 'disabled');
  const [user, setUser] = useState<CloudUser | null>(null);
  const [error, setError] = useState('');
  const [finishing, setFinishing] = useState(false);
  const recorded = useRef<string | null>(null);
  const memberEmail = useRef<string | null>(null);

  useEffect(() => {
    if (!firebaseEnabled) return;
    const handoff = takeDiscordHandoff();
    if (handoff?.error) setError(DISCORD_ERRORS[handoff.error] || 'เข้าสู่ระบบด้วย Discord ไม่สำเร็จ ลองใหม่อีกครั้ง');
    if (handoff?.token) {
      setFinishing(true);
      memberEmail.current = handoff.email || null;
      signInDiscordToken(handoff.token, handoff.name || '', handoff.photo || '')
        .then((u) => setUser(u))
        .catch((e) => setError(authErrorText(e)))
        .finally(() => setFinishing(false));
    }
    return watchAuth((u) => {
      setUser((prev) => (u && prev && prev.uid === u.uid && prev.named && !u.named ? prev : u));
      setStatus(u ? 'in' : 'out');
      setMemberHint(!!u);
    });
  }, []);

  // Keep the member list current: one write per sign-in session.
  useEffect(() => {
    if (!user || finishing || recorded.current === user.uid) return; // wait for a Discord sign-in to set its name first
    recorded.current = user.uid;
    recordMember(user, memberEmail.current).catch(() => { recorded.current = null; });
  }, [user, finishing]);

  const api = useMemo<AuthApi>(() => ({
    status,
    user,
    error,
    finishing,
    google: async () => {
      setError('');
      try { await signInGoogle(); } catch (e) { setError(authErrorText(e)); }
    },
    discord: () => {
      setError('');
      window.location.assign('/api/auth/discord/start');
    },
    rename: async (name) => {
      const u = await renameUser(name);
      if (u) { setUser(u); recorded.current = null; }
    },
    signOut: async () => { await signOutUser(); recorded.current = null; memberEmail.current = null; },
  }), [status, user, error, finishing]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
