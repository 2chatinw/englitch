import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { setCategoryOpen, useCategoryOpen } from '../lib/lobby';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { LEVELS, type Group, type Level } from '../data/content';
import { Icon } from './Icon';
import { AccentChip } from './AccentChip';
import { SkillArt, type Skill } from './SkillArt';
import { useProgress } from '../state/progress';
import { useChooseMission } from './MissionMenu';
import { activeMission, allMissions } from '../lib/missions';
import { PAGES, navigate, type Route } from '../lib/router';
import { prefersReducedMotion } from '../lib/util';
import { clearSessions } from '../state/session';

/** the level picker under the title (owner's design): Auto plus the three ring colours */
const LEVEL_PICK: { k: 'auto' | Level; label: string; hint: string }[] = [
  { k: 'auto', label: 'อัตโนมัติ', hint: 'เริ่มจากประโยคสั้น แล้วค่อยเปิดประโยคยาวขึ้นให้เอง' },
  { k: 'easy', label: 'สั้น', hint: 'ฝึกเฉพาะประโยคสั้น คำพื้นฐาน' },
  { k: 'medium', label: 'ยาวขึ้น', hint: 'ฝึกเฉพาะประโยคยาวขึ้น ไวยากรณ์ระดับกลาง' },
  { k: 'hard', label: 'ยาว', hint: 'ฝึกเฉพาะประโยคยาว คำทางการ สำนวน ศัพท์เฉพาะ' },
];

gsap.registerPlugin(Flip);

type Id = Group | 'all';
interface Node { id: Id; icon: string; name: string; short: string; done: number; total: number; stages: { k: Level; total: number; done: number }[] }

const LEVEL_TH: Record<Level, string> = { easy: 'ง่าย', medium: 'กลาง', hard: 'ยาก' };
/** how long a circle takes to move to its new place (seconds) */
const MOVE = 0.62;
/** when the picked category is saved as the mission: after the circle and the skill keys have finished moving (ms) */
const SAVE_AFTER = 1100;
/** where a circle was before a tap, and a copy of how it looked then (for the cross-fade) */
type Snap = { rect: DOMRect; kind: string; look: HTMLElement };
/** a name split into letters (Thai vowel and tone marks stay with their letter), so it can appear one letter at a time */
const SEG = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter('th', { granularity: 'grapheme' }) : null;
const letters = (t: string) => (SEG ? Array.from(SEG.segment(t), (x) => x.segment) : Array.from(t));
const kindOf = (n: Element) => (n.classList.contains('is-chosen') ? 'chosen' : n.classList.contains('is-mini') ? 'mini' : 'grid');
/** the four skills sit on an arc under the chosen circle: listen on the left, round the bottom, write on the right (degrees clockwise from the top) */
const SKILLS: { r: Route; a: number }[] = [{ r: 'listen', a: 252 }, { r: 'speak', a: 206 }, { r: 'read', a: 154 }, { r: 'write', a: 108 }];

/** picking: three, two, three circles on a six-column grid, each spanning two columns ([column, row]) */
const PICK_AT: [number, number][] = [[1, 1], [3, 1], [5, 1], [2, 2], [4, 2], [1, 3], [3, 3], [5, 3]];

/**
 * A ring in three arcs, one per level (green short, yellow longer, orange long sentences), each as long as
 * that level's share of the category; the pale arc fills with the phrases already answered right.
 */
export function StageRing({ stages }: { stages: Node['stages'] }) {
  const sum = stages.reduce((a, s) => a + s.total, 0) || 1;
  // round caps reach past each arc's end by about 1.3 units, so this leaves a clear ~3-unit gap between arcs
  const gap = stages.length > 1 ? 5.6 : 0;
  // every level gets at least a short visible arc: a level with only a few sentences would otherwise shrink
  // below the gap and show up as a dot jammed against its neighbour
  const MIN = 10;
  const raw = stages.map((s) => Math.max((s.total / sum) * 100, MIN));
  const scale = 100 / raw.reduce((a, x) => a + x, 0);
  let at = 0;
  return (
    <svg className="sring" viewBox="0 0 100 100" aria-hidden="true">
      {stages.map((s, i) => {
        const share = raw[i] * scale;
        const len = Math.max(0.5, share - gap);
        const fill = s.total ? (s.done / s.total) * len : 0;
        const off = -(at + gap / 2);
        at += share;
        return (
          <g key={s.k} className={'sring-' + s.k}>
            <circle className="sring-track" cx="50" cy="50" r="45" pathLength="100" strokeDasharray={len + ' ' + (100 - len)} strokeDashoffset={off} />
            <circle className="sring-fill" cx="50" cy="50" r="45" pathLength="100" strokeDasharray={fill + ' ' + (100 - fill)} strokeDashoffset={off}
              style={{ strokeOpacity: fill > 0 ? 1 : 0 }} />
          </g>
        );
      })}
    </svg>
  );
}

/**
 * Lobby: eight circles (the seven categories and "all of them"), each in its three-level progress ring.
 * Tapping one picks it as the mission; it slides to the middle and grows, the others move down into a row,
 * and the four skills (listen, speak, read, write) pop out around it.
 */
export function CategoryPicker() {
  const { state, setSettings } = useProgress();
  const choose = useChooseMission();
  const ms = allMissions(state);
  const nodes: Node[] = [
    ...ms.map((m) => ({ id: m.c, icon: m.icon, name: m.name, short: m.short, done: m.done, total: m.total, stages: m.stages })),
    {
      id: 'all', icon: '🌏', name: 'รวมทุกหมวด', short: 'ทุกหมวด',
      done: ms.reduce((a, m) => a + m.done, 0), total: ms.reduce((a, m) => a + m.total, 0),
      stages: LEVELS.map(({ k }) => ms.reduce((acc, m) => {
        const s = m.stages.find((x) => x.k === k);
        return s ? { k, total: acc.total + s.total, done: acc.done + s.done } : acc;
      }, { k, total: 0, done: 0 })).filter((s) => s.total > 0),
    },
  ];
  // A tap first changes only this picker (`picked`), so the move starts at once; the mission itself — a setting
  // the whole app reads, so saving it redraws every part of the page (~25-35 ms in dev, the jerk the owner saw
  // when signed in) — is saved after the move (`SAVE_AFTER`), or straight away when a skill key is pressed first.
  const [picked, setPicked] = useState<Id | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const saved: Id = activeMission(state) ?? 'all';
  const current: Id = picked ?? saved;
  const commit = useRef<() => void>(() => {});
  commit.current = () => {
    window.clearTimeout(saveTimer.current);
    if (picked === null) return;
    if (picked !== saved) choose(picked === 'all' ? null : picked);
    if (!state.settings.onboarded) setSettings({ onboarded: true });
    setPicked(null); // same batch as the save, so `current` never flickers back
  };
  useEffect(() => () => commit.current(), []); // leaving the lobby mid-move still saves the pick
  // remembered while the app is open: coming back from a practice page shows the chosen category again
  const focus = useCategoryOpen();
  const stage = useRef<HTMLDivElement>(null);
  const ghostLayer = useRef<HTMLDivElement>(null);
  const pending = useRef<{ flip: Flip.FlipState; belowTop: number | null; snaps: Map<string, Snap>; extras: Snap[] } | null>(null);
  const prevFocus = useRef<boolean | null>(null);

  const setFocus = setCategoryOpen;
  /** record where every circle is now (and how it looks), so the layout change can be animated from there */
  const capture = () => {
    const el = stage.current;
    if (!el || prefersReducedMotion()) return;
    ghostLayer.current?.replaceChildren(); // a tap during the last move: drop its leftover ghosts
    const nodes = Array.from(el.querySelectorAll<HTMLElement>('.cp-node'));
    const snap = (n: HTMLElement): Snap => ({ rect: n.getBoundingClientRect(), kind: kindOf(n), look: n.cloneNode(true) as HTMLElement });
    const snaps = new Map(nodes.map((n) => [n.dataset.flipId ?? '', snap(n)]));
    // the skill keys, the back link and the "other categories" label: faded out when going back to the eight circles
    const extras = Array.from(el.querySelectorAll<HTMLElement>('.cp-skills, .cp-back, .cp-strip-label')).map(snap);
    const below = el.closest('.cp')?.nextElementSibling;
    pending.current = { flip: Flip.getState(nodes), belowTop: below ? below.getBoundingClientRect().top : null, snaps, extras };
  };
  const pick = (id: Id) => {
    capture();
    setPicked(id);
    setFocus(true);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => commit.current(), SAVE_AFTER);
  };
  const back = () => { capture(); setFocus(false); };

  useLayoutEffect(() => {
    const el = stage.current, p = pending.current;
    pending.current = null;
    if (!el) return;
    if (p) {
      // Transforms only (owner: the old version stuttered). The circles are square, so moving + scaling them from
      // where they were is the same picture as resizing them, without a layout every frame; `absolute: true`
      // cost ~20 ms before the first frame. The stage takes its new height at once and the content under it
      // slides from the old spot instead of the stage's height being tweened.
      // afterwards take GSAP's inline transform styles off again (a left-over `scale: none` stopped the hover grow)
      const tidy = (els: Element[]) => () => els.forEach((t) => ['transform', 'translate', 'rotate', 'scale'].forEach((k) => (t as HTMLElement).style.removeProperty(k)));
      // owner: the chosen circle grows steadily all the way while it travels, and nothing goes past its final size —
      // so a gentle in-out ease (power3 left it small for the first 0.15 s, then grew it all at once) and no overshoot
      const nodes = Array.from(el.querySelectorAll<HTMLElement>('.cp-node'));
      // A circle that changes kind (grid ↔ chosen ↔ small) also changes what it shows (a small one hides its name),
      // so scaling its new look from the old size showed e.g. a huge bare icon in the middle (owner's video). Those
      // cross-fade: a copy of the old look rides the same path and fades out while the new look fades in.
      const box = stage.current!.getBoundingClientRect();
      const swaps = nodes.flatMap((n) => {
        const s = p.snaps.get(n.dataset.flipId ?? '');
        return s && s.kind !== kindOf(n) ? [{ n, s, to: n.getBoundingClientRect() }] : [];
      });
      Flip.from(p.flip, { duration: MOVE, ease: 'sine.inOut', scale: true, onComplete: tidy(nodes) });
      // Owner's pick ("ตัวอักษรโผล่ทีละตัว", option 6 of the artifact "Englitch circle label"): the old words fade out
      // at once (the copy of the old look, 0.15 s), the circle travels with its icon, and just before it arrives the
      // new name appears one letter at a time in a small wave, then the count. Small circles show no words.
      for (const { n, s, to } of swaps) {
        const g = s.look;
        g.removeAttribute('style'); g.removeAttribute('data-flip-id'); g.removeAttribute('aria-label'); g.classList.add('cp-ghost');
        g.tabIndex = -1;
        Object.assign(g.style, { left: s.rect.left - box.left + 'px', top: s.rect.top - box.top + 'px', width: s.rect.width + 'px', height: s.rect.height + 'px' });
        ghostLayer.current?.appendChild(g);
        const ride = gsap.to(g, { x: to.left - s.rect.left, y: to.top - s.rect.top, scale: to.width / s.rect.width, duration: MOVE, ease: 'sine.inOut' });
        gsap.to(g, { opacity: 0, duration: 0.15, ease: 'power1.in', onComplete: () => { ride.kill(); g.remove(); } });
        if (kindOf(n) === 'mini') continue;
        const chars = Array.from(n.querySelectorAll<HTMLElement>('.cp-ch')), count = n.querySelector<HTMLElement>('.cp-count');
        const words = count ? [...chars, count] : chars;
        gsap.killTweensOf(words);
        gsap.set(words, { opacity: 0 });
        const at = MOVE - 0.12, step = 0.014;
        gsap.fromTo(chars, { opacity: 0, top: 5 }, { opacity: 1, top: 0, duration: 0.2, stagger: step, delay: at, ease: 'power2.out', clearProps: 'opacity,top' });
        if (count) gsap.to(count, { opacity: 1, duration: 0.22, delay: at + chars.length * step, ease: 'power1.out', clearProps: 'opacity' });
      }
      // the content under the circles slides from where it was (measured on the content itself, so a change in
      // the heading above counts too — it used to jump by that much on the first frame)
      const below: Element[] = [];
      for (let n = el.closest('.cp')?.nextElementSibling; n; n = n.nextElementSibling) below.push(n);
      const dh = below.length && p.belowTop !== null ? p.belowTop - below[0].getBoundingClientRect().top : 0;
      if (Math.abs(dh) > 0.5) gsap.fromTo(below, { y: dh }, { y: 0, duration: MOVE, ease: 'sine.inOut', onComplete: tidy(below) });
      // going back: the skill keys, back link and label fade out where they were instead of vanishing in one frame
      if (!focus) {
        for (const x of p.extras) {
          const g = x.look;
          g.classList.add('cp-exit'); g.setAttribute('aria-hidden', 'true'); g.removeAttribute('data-key');
          Object.assign(g.style, { left: x.rect.left - box.left + 'px', top: x.rect.top - box.top + 'px', width: x.rect.width + 'px', height: x.rect.height + 'px' });
          ghostLayer.current?.prepend(g);
          gsap.to(g, { opacity: 0, scale: 0.94, duration: 0.24, ease: 'power1.out', onComplete: () => g.remove() });
        }
      }
    }
    // the skill keys and the back link appear when the category opens; switching straight to another category
    // leaves them in place (they used to vanish and pop out again on every switch)
    const opened = focus && prevFocus.current !== true;
    prevFocus.current = focus;
    if (opened && !prefersReducedMotion()) {
      // the skill keys grow out to their size and stop there (they used to pop to 111 % and settle back)
      gsap.fromTo(el.querySelectorAll('.cp-skill'), { scale: 0.4, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.4, stagger: 0.06, delay: p ? 0.45 : 0.1, ease: 'power2.out' });
      gsap.fromTo(el.querySelectorAll('.cp-back, .cp-strip-label'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, delay: p ? 0.35 : 0 });
    }
  }, [focus, current]);

  // round keycaps: on a computer, keys 1-4 press the matching skill
  useEffect(() => {
    if (!focus) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement)?.closest?.('input, textarea, [contenteditable]')) return;
      const btn = stage.current?.querySelector<HTMLButtonElement>('.cp-skill[data-key="' + e.key + '"]');
      if (!btn) return;
      btn.classList.add('is-down');
      setTimeout(() => { btn.classList.remove('is-down'); btn.click(); }, 140);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [focus]);

  const chosen = nodes.find((n) => n.id === current)!;
  const others = nodes.filter((n) => n.id !== current);

  return (
    <section className="cp" data-reveal aria-labelledby="cp-h">
      <div className="cp-head">
        <h1 id="cp-h" className="cp-title">{focus ? 'เลือกทักษะที่จะฝึก' : 'เลือกหมวดหมู่'}</h1>
        {/* the ring colours as a three-part bar under the title (owner's pick, design 3) */}
        {/* the ring colours double as the level picker (owner's design): the chosen one is coloured and larger, the rest grey */}
        <div className="cp-legend" role="radiogroup" aria-label="ระดับความยาก (สีเดียวกับวงแหวนรอบปุ่ม)">
          {LEVEL_PICK.map((x) => (
            <button key={x.k} type="button" role="radio" aria-checked={state.settings.level === x.k}
              className={'cp-legend-' + x.k + (state.settings.level === x.k ? ' is-on' : '')} title={x.hint}
              onClick={() => { if (state.settings.level !== x.k) { setSettings({ level: x.k }); clearSessions(); } }}>
              <i aria-hidden="true" /><small>{x.label}</small>
            </button>
          ))}
        </div>
        <p key={state.settings.level} className="cp-legend-hint muted small">{LEVEL_PICK.find((x) => x.k === state.settings.level)?.hint}</p>
        <AccentChip />
        {/* always in the layout (only faded), so opening a category doesn't push everything down a line in one frame */}
        <p className={'cp-tip muted small' + (focus ? ' is-on' : '')} aria-hidden={!focus}>ฝึกครบทั้ง 4 ทักษะได้ในหมวดเดียวกัน ตอบถูกครบทุกประโยค = ผ่าน Mission</p>
      </div>
      <div className={'cp-stage' + (focus ? ' is-focus' : '')} ref={stage}>
        {focus ? (
          <button type="button" className="cp-back" onClick={back}>
            <Icon name="arrow" /> เลือกหมวดอื่น
          </button>
        ) : null}
        {nodes.map((n, i) => {
          const isChosen = focus && n.id === current;
          const slot = focus ? others.indexOf(n) : i;
          const pct = n.total ? Math.round((n.done / n.total) * 100) : 0;
          return (
            <button key={n.id} type="button" data-flip-id={n.id}
              className={'cp-node' + (isChosen ? ' is-chosen' : focus ? ' is-mini' : '') + (n.id === current ? ' is-current' : '') + (n.done === n.total ? ' is-done' : '')}
              style={isChosen ? { gridColumn: '1 / -1', gridRow: 2 }
                : focus ? { gridColumn: slot + 1, gridRow: 4 }
                : { gridColumn: PICK_AT[slot][0] + ' / span 2', gridRow: PICK_AT[slot][1] }}
              aria-pressed={n.id === current}
              aria-label={n.name + ' ผ่านแล้ว ' + n.done + ' จาก ' + n.total + ' ประโยค ('
                + n.stages.map((s) => LEVEL_TH[s.k] + ' ' + s.done + '/' + s.total).join(', ') + ')'
                + (isChosen ? ' แตะเพื่อกลับไปเลือกหมวด' : '')}
              onClick={() => (isChosen ? back() : pick(n.id))}>
              <StageRing stages={n.stages} />
              <span className="cp-face">
                <span className="cp-icon" aria-hidden="true">{n.icon}</span>
                <span className="cp-name">{letters(isChosen ? n.name : n.short).map((c, k) => <span key={k} className="cp-ch">{c}</span>)}</span>
                <span className="cp-count num">{n.done === n.total ? '✓ ผ่านแล้ว' : isChosen ? n.done + '/' + n.total : pct + '%'}</span>
              </span>
            </button>
          );
        })}
        {focus ? (
          <>
            <div className="cp-skills" role="group" aria-label={'ฝึก ' + chosen.name}>
              {SKILLS.map(({ r, a }, i) => (
                <button key={r} type="button" className={'cp-skill cp-skill-' + r} data-key={i + 1} onClick={() => { commit.current(); navigate(r); }}
                  aria-label={PAGES[r].th} aria-keyshortcuts={String(i + 1)}
                  style={{ ['--sx' as string]: Math.sin((a * Math.PI) / 180).toFixed(3), ['--sy' as string]: (-Math.cos((a * Math.PI) / 180)).toFixed(3) }}>
                  <span className="cp-cap">
                    <kbd className="cp-cap-key">{i + 1}</kbd>
                    <SkillArt kind={r as Skill} size={36} />
                    <span className="cp-skill-lbl">{PAGES[r].short}</span>
                  </span>
                </button>
              ))}
            </div>
            <span className="cp-strip-label muted small">หมวดอื่น</span>
          </>
        ) : null}
        {/* copies of circles fading out while they change kind (filled by the layout effect, never by React) */}
        <div className="cp-ghosts" ref={ghostLayer} aria-hidden="true" />
      </div>
    </section>
  );
}
