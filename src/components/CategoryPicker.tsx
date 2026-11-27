import { useEffect, useLayoutEffect, useRef } from 'react';
import { setCategoryOpen, useCategoryOpen } from '../lib/lobby';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { LEVELS, type Group, type Level } from '../data/content';
import { Icon } from './Icon';
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
  const current: Id = activeMission(state) ?? 'all';
  // remembered while the app is open: coming back from a practice page shows the chosen category again
  const focus = useCategoryOpen();
  const stage = useRef<HTMLDivElement>(null);
  const pending = useRef<{ flip: Flip.FlipState; h: number } | null>(null);

  const setFocus = setCategoryOpen;
  /** record where every circle is now, so the layout change can be animated from there */
  const capture = () => {
    const el = stage.current;
    if (!el || prefersReducedMotion()) return;
    pending.current = { flip: Flip.getState(el.querySelectorAll('.cp-node')), h: el.offsetHeight };
  };
  const pick = (id: Id) => {
    capture();
    if (id !== current) choose(id === 'all' ? null : id);
    if (!state.settings.onboarded) setSettings({ onboarded: true });
    setFocus(true);
  };
  const back = () => { capture(); setFocus(false); };

  useLayoutEffect(() => {
    const el = stage.current, p = pending.current;
    pending.current = null;
    if (!el) return;
    if (p) {
      Flip.from(p.flip, { duration: 0.62, ease: 'power3.inOut', absolute: true, stagger: 0.015 });
      gsap.fromTo(el, { height: p.h }, { height: el.offsetHeight, duration: 0.62, ease: 'power3.inOut', clearProps: 'height' });
    }
    if (focus && !prefersReducedMotion()) {
      gsap.fromTo(el.querySelectorAll('.cp-skill'), { scale: 0.3, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.45, stagger: 0.07, delay: p ? 0.4 : 0.1, ease: 'back.out(2.2)' });
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
        {focus ? <p className="muted small">ฝึกครบทั้ง 4 ทักษะได้ในหมวดเดียวกัน ตอบถูกครบทุกประโยค = ผ่าน Mission</p> : null}
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
                <span className="cp-name">{isChosen ? n.name : n.short}</span>
                <span className="cp-count num">{n.done === n.total ? '✓ ผ่านแล้ว' : isChosen ? n.done + '/' + n.total : pct + '%'}</span>
              </span>
            </button>
          );
        })}
        {focus ? (
          <>
            <div className="cp-skills" role="group" aria-label={'ฝึก ' + chosen.name}>
              {SKILLS.map(({ r, a }, i) => (
                <button key={r} type="button" className={'cp-skill cp-skill-' + r} data-key={i + 1} onClick={() => navigate(r)}
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
      </div>
    </section>
  );
}
