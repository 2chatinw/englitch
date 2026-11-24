import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { firebaseEnabled } from '../firebase.config';
import {
  renameUser, resetPassword, signInEmail, signInGoogle, signOutUser, signUpEmail, watchAuth, type CloudUser,
} from '../lib/cloud';

export type AuthStatus = 'disabled' | 'idle' | 'loading' | 'in' | 'out';

interface AuthApi {
  status: AuthStatus;
  user: CloudUser | null;
  /** Load the SDK and start listening (called when the account sheet opens). */
  ensure: () => void;
  google: () => Promise<void>;
  emailIn: (email: string, password: string) => Promise<void>;
  emailUp: (name: string, email: string, password: string) => Promise<void>;
  reset: (email: string) => Promise<void>;
  rename: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthApi | null>(null);
export function useAuth(): AuthApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth outside provider');
  return v;
}

// Visitors who have never signed in don't download the Firebase SDK until they open the account sheet.
const HINT = 'gg-auth';
const hasHint = () => { try { return localStorage.getItem(HINT) === '1'; } catch { return false; } };
const setHint = (on: boolean) => { try { if (on) localStorage.setItem(HINT, '1'); else localStorage.removeItem(HINT); } catch { /* storage blocked */ } };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(firebaseEnabled ? (hasHint() ? 'loading' : 'idle') : 'disabled');
  const [user, setUser] = useState<CloudUser | null>(null);
  const started = useRef(false);

  const start = useCallback(() => {
    if (!firebaseEnabled || started.current) return;
    started.current = true;
    setStatus((s) => (s === 'in' ? s : 'loading'));
    watchAuth((u) => {
      setUser(u);
      setStatus(u ? 'in' : 'out');
      setHint(!!u);
    });
  }, []);

  useEffect(() => { if (hasHint()) start(); }, [start]);

  const api = useMemo<AuthApi>(() => ({
    status,
    user,
    ensure: start,
    google: async () => { start(); setHint(true); await signInGoogle(); },
    emailIn: async (email, password) => { start(); await signInEmail(email, password); },
    emailUp: async (name, email, password) => { start(); const u = await signUpEmail(name, email, password); setUser(u); },
    reset: async (email) => { await resetPassword(email); },
    rename: async (name) => { const u = await renameUser(name); if (u) setUser(u); },
    signOut: async () => { await signOutUser(); setHint(false); },
  }), [status, user, start]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
