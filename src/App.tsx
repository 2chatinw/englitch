import { useCallback, useEffect, useState, type ComponentType } from 'react';
import { ToastProvider } from './state/toast';
import { ProgressProvider } from './state/progress';
import { useRoute, type Route } from './lib/router';
import { BottomBar, Sidebar, TopBar } from './components/Nav';
import { PageStage } from './components/PageStage';
import { SettingsSheet } from './components/Settings';
import { AccountSheet } from './components/Account';
import { AuthProvider, useAuth, wasSignedIn } from './state/auth';
import { Splash } from './components/Login';
import Landing from './pages/Landing';
import Today from './pages/Today';
import Cards from './pages/Cards';
import Listen from './pages/Listen';
import Speak from './pages/Speak';
import Quiz from './pages/Quiz';
import Chat from './pages/Chat';

const PAGES: Record<Route, ComponentType> = { today: Today, cards: Cards, listen: Listen, speak: Speak, quiz: Quiz, chat: Chat };

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
    <div className="shell">
      <a className="skip" href="#main">ข้ามไปที่เนื้อหา</a>
      <Sidebar route={route} onSettings={openSettings} onAccount={openAccount} />
      <TopBar onSettings={openSettings} onAccount={openAccount} />
      <main id="main" className="main">
        <PageStage route={route} render={(r) => { const P = PAGES[r]; return <P key={r} />; }} />
      </main>
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
