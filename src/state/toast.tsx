import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

type Show = (msg: string) => void;
const Ctx = createContext<Show>(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState('');
  const [n, setN] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const show = useCallback<Show>((m) => { setMsg(m); setN((x) => x + 1); }, []);

  useGSAP(() => {
    if (!n || !ref.current) return;
    gsap.killTweensOf(ref.current);
    gsap.timeline()
      .fromTo(ref.current, { autoAlpha: 0, y: 16, xPercent: -50 }, { autoAlpha: 1, y: 0, xPercent: -50, duration: 0.28, ease: 'power3.out' })
      .to(ref.current, { autoAlpha: 0, y: 8, duration: 0.25, ease: 'power2.in' }, '+=3');
  }, { dependencies: [n] });

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className="toast" ref={ref} role="status" aria-live="polite" style={{ visibility: 'hidden' }}>{msg}</div>
    </Ctx.Provider>
  );
}
