import { useEffect, useState } from 'react';
import type { Phrase } from '../data/content';
import type { Explanation } from '../lib/explain';
import { SpeakButton } from './ui';

/**
 * "อธิบายประโยคนี้" under an answer: meaning, when to use it, how it's built, word meanings and similar sentences.
 * Open by default after a wrong answer; folded after a right one (so the 3-second auto-next stays — opening it,
 * like any other tap, stops the countdown). The explanation code and glossary load on first use.
 */
export function Explain({ phrase, open: startOpen }: { phrase: Phrase; open: boolean }) {
  const [x, setX] = useState<Explanation | null>(null);
  const [open, setOpen] = useState(startOpen);
  useEffect(() => {
    let alive = true;
    import('../lib/explain').then((m) => { if (alive) setX(m.explain(phrase)); });
    return () => { alive = false; };
  }, [phrase]);

  return (
    <details className="explain" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary><span aria-hidden="true">📖</span> อธิบายประโยคนี้</summary>
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
    </details>
  );
}
