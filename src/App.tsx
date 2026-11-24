import { useCallback, useState, type ComponentType } from 'react';
import { ToastProvider } from './state/toast';
import { ProgressProvider } from './state/progress';
import { useRoute, type Route } from './lib/router';
import { BottomBar, Sidebar, TopBar } from './components/Nav';
import { PageStage } from './components/PageStage';
import { SettingsSheet } from './components/Settings';
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
  return (
    <div className="shell">
      <a className="skip" href="#main">ข้ามไปที่เนื้อหา</a>
      <Sidebar route={route} onSettings={openSettings} />
      <TopBar onSettings={openSettings} />
      <main id="main" className="main">
        <PageStage route={route} render={(r) => { const P = PAGES[r]; return <P key={r} />; }} />
      </main>
      <BottomBar route={route} />
      <SettingsSheet open={settings} onClose={closeSettings} />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <ProgressProvider>
        <Shell />
      </ProgressProvider>
    </ToastProvider>
  );
}
