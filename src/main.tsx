import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import '@fontsource/bai-jamjuree/400.css';
import '@fontsource/bai-jamjuree/500.css';
import '@fontsource/bai-jamjuree/600.css';
import '@fontsource/bai-jamjuree/700.css';
import '@fontsource/big-shoulders-display/600';
import '@fontsource/big-shoulders-display/800';
import './styles.css';
import './landing.css';
import './backdrops.css';
import './backdrops-more.css';
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
