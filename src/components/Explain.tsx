import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import type { Phrase } from '../data/content';
import type { Explanation } from '../lib/explain';
import { SpeakButton } from './ui';
import { prefersReducedMotion } from '../lib/util';

/**
 * "อธิบายประโยคนี้", shown beside the story card after an answer (owner: below the card it went unnoticed):
 * meaning, when to use it, how it's built, word meanings and similar sentences. The explanation code and glossary
 * load on first use.
 */
export function Explain({ phrase }: { phrase: Phrase }) {
  const [x, setX] = useState<Explanation | null>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let alive = true;
    import('../lib/explain').then((m) => { if (alive) setX(m.explain(phrase)); });
    return () => { alive = false; };
  }, [phrase]);
  useLayoutEffect(() => {
    if (box.current && !prefersReducedMotion()) gsap.fromTo(box.current, { x: 24, autoAlpha: 0 }, { x: 0, autoAlpha: 1, duration: 0.45, ease: 'power3.out' });
  }, [phrase]);

  return (
    <div className="explain" ref={box} id="explain" aria-live="polite">
      <div className="explain-head">
        <span className="explain-badge" aria-hidden="true">📖</span>
        <span>
          <small>อธิบายประโยคนี้</small>
          <b lang="en">{phrase.e}</b>
        </span>
        <SpeakButton text={phrase.s} quiet label="ฟัง" />
      </div>
      {!x ? <p className="muted small">กำลังโหลด…</p> : (
        <div className="explain-body">
          <section>
            <h3>แปลว่า</h3>
            <p className="explain-meaning">{x.meaning}</p>
          </section>
          <section>
            <h3>ใช้เมื่อไหร่</h3>
            <p>{x.when}</p>
            {x.tone ? <span className="explain-tone">น้ำเสียง: {x.tone}</span> : null}
            {x.note ? <p className="explain-note">💡 {x.note}</p> : null}
          </section>
          {x.patterns.length ? (
            <section>
              <h3>รูปประโยคนี้</h3>
              <ul className="explain-patterns">
                {x.patterns.map((pt) => <li key={pt.title}><b lang="en">{pt.title}</b><span>{pt.body}</span></li>)}
              </ul>
            </section>
          ) : null}
          {x.words.length ? (
            <section>
              <h3>คำศัพท์ในประโยค</h3>
              <ul className="explain-words">
                {x.words.map((w) => <li key={w.w}><b lang="en">{w.w}</b><span>{w.th}</span></li>)}
              </ul>
            </section>
          ) : null}
          {x.more.length ? (
            <section>
              <h3>ประโยคคล้ายกันที่ใช้ได้</h3>
              <ul className="explain-more">
                {x.more.map((m) => (
                  <li key={m.e}>
                    <span><b lang="en">{m.e}</b><small>{m.t}</small></span>
                    <SpeakButton text={m.s} quiet label="ฟัง" />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Desktop placeholder in the side column before answering, so the layout doesn't jump when the explanation comes. */
export function ExplainWaiting() {
  return (
    <div className="explain explain-wait">
      <span className="explain-badge" aria-hidden="true">📖</span>
      <b>คำอธิบายจะขึ้นตรงนี้</b>
      <span className="muted small">ตอบแล้วจะได้ดูความหมาย วิธีใช้ รูปประโยค คำศัพท์ และประโยคคล้ายกัน</span>
    </div>
  );
}

/** Phones: the explanation sits under the card, so the answer sheet links down to it. */
export function ExplainJump() {
  return (
    <button type="button" className="explain-jump" onClick={() => document.getElementById('explain')?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })}>
      <span aria-hidden="true">📖</span> ดูคำอธิบายประโยคนี้ <span aria-hidden="true">↓</span>
    </button>
  );
}
