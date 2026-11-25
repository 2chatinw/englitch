import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { ToastProvider } from './state/toast';
import { ProgressProvider } from './state/progress';
import { useRoute, type Route } from './lib/router';
import { BottomBar, QuestRail, TopBar } from './components/Nav';
import { PageStage } from './components/PageStage';
import { SettingsSheet } from './components/Settings';
import { AccountSheet } from './components/Account';
import { AuthProvider, useAuth, wasSignedIn } from './state/auth';
import { Splash } from './components/Login';
import Landing from './pages/Landing';
import { Backdrop } from './components/Backdrop';
import Today from './pages/Today';
import Listen from './pages/Listen';
import Speak from './pages/Speak';
import Read from './pages/Read';
import Write from './pages/Write';
import Chat from './pages/Chat';

const PAGES: Record<Route, ComponentType> = { today: Today, listen: Listen, speak: Speak, read: Read, write: Write, chat: Chat };

function Shell() {
  const route = useRoute();
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
    <div className="shell has-bd">
      <Backdrop kind="sky" />
      <a className="skip" href="#main">ข้ามไปที่เนื้อหา</a>
      <TopBar onSettings={openSettings} onAccount={openAccount} />
      <div className="app-body">
        <QuestRail route={route} />
        <main id="main" className="main">
          <PageStage route={route} render={(r) => { const P = PAGES[r]; return <P key={r} />; }} />
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
