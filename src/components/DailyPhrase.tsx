import { useEffect, useMemo, useRef, useState } from 'react';
import type { Phrase } from '../data/content';
import { sayTracked, speechRate, stopSpeaking } from '../lib/speech';
import { useToast } from '../state/toast';

/** decorative waveform heights (%), lit from left to right as the sentence is spoken */
const WAVE = [30, 55, 80, 45, 70, 95, 60, 35, 75, 90, 50, 65, 85, 40, 70, 55, 30, 60, 80, 45, 25, 50, 70, 35, 60, 85, 45, 30];

/**
 * Lobby phrase of the day as a little audio player (owner's pick: design 3 inside the bento's big card):
 * a big yellow play button, the sentence lighting up word by word with the voice, a waveform and a speed toggle.
 */
export function DailyPhrase({ phrase }: { phrase: Phrase }) {
  const toast = useToast();
  const [slow, setSlow] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [lit, setLit] = useState(0); // words spoken so far
  const timer = useRef<number | null>(null);
  const gotBoundary = useRef(false);

  // the words with where each starts in the text, so boundary events (character positions) map to words
  const words = useMemo(() => {
    const out: { w: string; at: number }[] = [];
    phrase.e.replace(/\S+/g, (w, at: number) => { out.push({ w, at }); return w; });
    return out;
  }, [phrase.e]);

  const clear = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };
  useEffect(() => () => { clear(); stopSpeaking(); }, []);

  const finish = () => {
    clear();
    setLit(words.length);
    window.setTimeout(() => { setPlaying(false); setLit(0); }, 700);
  };

  const play = () => {
    if (playing) { stopSpeaking(); clear(); setPlaying(false); setLit(0); return; }
    gotBoundary.current = false;
    const ok = sayTracked(phrase.s, slow, (ci) => {
      gotBoundary.current = true;
      clear();
      // the voice may read a slightly different text (`s`), so map its position onto the shown sentence
      const at = (ci * phrase.e.length) / Math.max(1, phrase.s.length);
      let i = 0;
      while (i + 1 < words.length && words[i + 1].at <= at) i++;
      setLit(i + 1);
    }, finish);
    if (!ok) { toast('อุปกรณ์นี้อ่านออกเสียงไม่ได้'); return; }
    setPlaying(true);
    setLit(1);
    // voices without word events: step through the words at roughly speaking pace
    const per = 360 / speechRate(slow);
    timer.current = window.setInterval(() => {
      if (gotBoundary.current) return clear();
      setLit((n) => Math.min(words.length, n + 1));
    }, per);
  };

  const progress = playing ? lit / words.length : 0;
  const date = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

  return (
    <article className={'dp' + (playing ? ' is-playing' : '')} aria-labelledby="dp-h">
      <span className="dp-tag" id="dp-h">✦ ประโยคประจำวัน · {date}</span>
      <div className="dp-main">
        <button type="button" className="dp-play" onClick={play} aria-label={(playing ? 'หยุด' : slow ? 'ฟังช้า' : 'ฟัง') + ' ' + phrase.e}>
          {playing
            ? <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2.5" /></svg>
            : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" /></svg>}
        </button>
        <div className="dp-body">
          <p className="dp-en" lang="en">
            {words.map((x, i) => <span key={i} className={playing && i >= lit ? 'is-dim' : undefined}>{x.w} </span>)}
          </p>
          <div className="dp-wave" aria-hidden="true">
            {WAVE.map((h, i) => <i key={i} style={{ height: h + '%' }} className={i < progress * WAVE.length ? 'on' : undefined} />)}
          </div>
        </div>
      </div>
      <div className="dp-foot">
        <div className="dp-speed" role="group" aria-label="ความเร็วเสียง">
          <button type="button" aria-pressed={!slow} onClick={() => setSlow(false)}>1×</button>
          <button type="button" aria-pressed={slow} onClick={() => setSlow(true)}>ช้า</button>
        </div>
        <span className="dp-th">{phrase.t}</span>
      </div>
      {phrase.n ? <p className="dp-note">{phrase.n}</p> : null}
    </article>
  );
}
