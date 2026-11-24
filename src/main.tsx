import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import '@fontsource/kanit/300';
import '@fontsource/kanit/400';
import '@fontsource/kanit/500';
import '@fontsource/kanit/600';
import '@fontsource/kanit/700';
import '@fontsource/fredoka/500';
import '@fontsource/fredoka/600';
import '@fontsource/fredoka/700';
import './styles.css';
import './landing.css';
import './backdrops.css';
import './backdrops-more.css';
import './theme.css';
import './nav.css';
import App from './App.tsx';

gsap.registerPlugin(useGSAP);
if (import.meta.env.DEV) (window as unknown as { gsap: typeof gsap }).gsap = gsap;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js').catch(() => {});
  });
}
