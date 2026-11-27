import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { ToastProvider } from './state/toast';
import { ProgressProvider, useProgress } from './state/progress';
import { useRoute, type Route } from './lib/router';
import { BottomBar, TopBar } from './components/Nav';
import { PageStage } from './components/PageStage';
import { SettingsSheet } from './components/Settings';
import { AccountSheet } from './components/Account';
import { AuthProvider, useAuth, wasSignedIn } from './state/auth';
import { Splash } from './components/Login';
import Landing from './pages/Landing';
import { Backdrop } from './components/Backdrop';
import Today from './pages/Today';
import { useProgressToasts } from './components/Missions';
import { setCategoryOpen } from './lib/lobby';
import Listen from './pages/Listen';
import Speak from './pages/Speak';
import Read from './pages/Read';
import Write from './pages/Write';

const PAGES: Record<Route, ComponentType> = { today: Today, listen: Listen, speak: Speak, read: Read, write: Write };

function Shell() {
  const route = useRoute();
  useProgressToasts();
  const mission = useProgress().state.settings.mission;
  // the practice menus show only on the practice (quiz) pages; the lobby keeps just the circles and skill buttons
  // after practising, the lobby opens on the chosen category (its skill buttons), not the eight circles
  useEffect(() => { if (route !== 'today') setCategoryOpen(true); }, [route]);
  const menus = route !== 'today';
  const [settings, setSettings] = useState(false);
  const openSettings = useCallback(() => setSettings(true), []);
  const closeSettings = useCallback(() => setSettings(false), []);
  const [account, setAccount] = useState(false);
  const openAccount = useCallback(() => setAccount(true), []);
  const closeAccount = useCallback(() => setAccount(false), []);
  useEffect(() => {
    const onOpen = () => setAccount(true);
    window.addEventListener('gg:account', onOpen);
    return () => window.removeEventListener('gg:account', onOpen);
  }, []);
  return (
    <div className="shell has-bd" data-menus={menus ? 'on' : 'off'}>
      <Backdrop kind="sky" />
      <a className="skip" href="#main">ข้ามไปที่เนื้อหา</a>
      <TopBar route={route} onSettings={openSettings} onAccount={openAccount} />
      <div className="app-body">
        <main id="main" className="main">
          {/* keyed by the mission too, so switching it mid-practice starts the page fresh with the new category */}
          <PageStage route={route} render={(r) => { const P = PAGES[r]; return <P key={r === 'today' ? r : r + ':' + (mission ?? 'all')} />; }} />
          <footer className="copyright app-copy">© {Math.max(2026, new Date().getFullYear())} Chatchathep Meekaew</footer>
        </main>
      </div>
      <BottomBar route={route} />
      <SettingsSheet open={settings} onClose={closeSettings} />
      <AccountSheet open={account} onClose={closeAccount} />
    </div>
  );
}

/** Visitors see the landing page; members (Discord or Google sign-in) get the app. */
function Gate() {
  const { status, finishing } = useAuth();
  if (finishing) return <Splash text="กำลังเข้าสู่ระบบด้วย Discord…" />;
  if (status === 'in' || status === 'disabled') return <Shell />;
  if (status === 'loading' && wasSignedIn()) return <Splash text="กำลังโหลด…" />;
  return <Landing />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ProgressProvider>
          <Gate />
        </ProgressProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
