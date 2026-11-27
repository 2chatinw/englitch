# Englitch — notes for Claude

English-practice web app for Thai learners of English (everyday, travel, work, study, pop culture, specific jobs and gaming). UI text is Thai; reply to the owner in Thai. Was gamer-themed until Nov 2026; the owner asked to make it for all English learners.

## Owner's rules (always follow)

- **Localhost first.** Build and check everything on `http://localhost:5173` and commit to branch `dev`.
  Do **not** push, merge to `main` or upload anything until the owner says so ("ขึ้นเว็บ" / "อัพโหลด").
- `main` = live site. Cloudflare Pages builds and deploys every push to `main` (englitch.pages.dev).
- When the owner asks for design ideas ("ขอ N แบบ"), make an HTML Artifact with all the options to pick from first,
  then build the chosen one in the app.
- Never type secrets (App Secret, API keys, passwords) into forms; the owner pastes them. Don't put personal emails in files.
- Check light **and** dark mode, desktop **and** phone, before committing.

## Stack

- React 19 + Vite + TypeScript, GSAP 3 (`@gsap/react`, ScrollTrigger), hash router (`src/lib/router.ts`).
- Fonts: Fredoka (display) + Kanit (Thai/body) via `@fontsource`.
- Logo: `public/brand/englitch-logo.webp` (836×400, word + graduation cap + cloud mascot, transparent background), cut out
  from the owner's picture (Nov 2026). `Brand.tsx` draws it with a light sweep (masked by the logo) and twinkling CSS
  stars; heights in `nav.css` (`--logo-h`). The old `englitch-wordmark.webp` was removed. `englitch-720.webp` is still
  the square mascot icon (`LOGO_URL`).
- Firebase (modular SDK, lazy-loaded), project `englitch-da50c`: Auth (Discord via Cloudflare Functions custom token,
  Google, Facebook) + Firestore (`users/{uid}`, `members/{uid}`). Rules in `firestore.rules`.
- Cloudflare Pages Functions in `functions/` (Discord OAuth, `/__/auth/*` proxy to Firebase in `_middleware.ts`).

```
npm install
npm run dev     # http://localhost:5173
npm run build   # tsc -b && vite build → dist/
# production check: build, then launch config "preview" (http://localhost:4173)
```

## Where things are

- `src/App.tsx` — Gate (landing vs app) and the app Shell.
- `src/components/Nav.tsx` — TopBar: three columns — logo left (links back to the home page), centre = "ฝึกต่อเนื่องวันที่ N" in the lobby (plain text, "วันที่ N" on phones) and, on desktop practice pages, the skills menu `TopMenu` (glass pill, sliding highlight) instead; theme + account right. No side rail any more (owner: keep the content centred). Phones keep `BottomBar` (thumb reach) and the streak in the top bar. The Mission button and the category label by the menus were removed (owner's choice — categories are picked only in the lobby). `MissionMenu.tsx` only keeps `useChooseMission`. Changing mission restarts the open practice page (App keys it by mission).
- `src/components/AccountMenu.tsx` — avatar pill + drop-down (copied from the owner's scholarship project, `C:\ProjectWeb\scholarship`).
- `src/pages/Landing.tsx` — landing (kept in the app's look: feature cards use the pastel skill keys / level ring, the closing call to action is liquid glass; "How it works" = sign in → tap a category → pick a skill; the phrase ticker runs at a set reading speed, `TICKER_PX_PER_S` = 45 — owner found ~160 px/s too fast); `HeroKeys.tsx` (keypad hero: one key per category, shows a sample sentence), `Keypad.tsx` (isometric SVG),
  `SectionNav.tsx` (scroll-spy links), `SignInDrop.tsx` (rope-ladder sign-in badges), `ThemeToggle.tsx` (sun/moon).
- `src/components/PageStage.tsx` — page-change wipe. Going to a skill page shows that skill's mascot (`WipeMascot.tsx`,
  owner picked from 12 drawings, Nov 2026: speak = yellow podcast mic rocking + sound waves, listen = the cloud with
  yellow headphones nodding + notes, read = open mint book in glasses with a page flipping, write = pencil scribbling on a
  lavender notebook). SVG strings + CSS idle wiggle (`.wm-*` in theme.css, quick squash-and-spring like the keypad keys).
  Other pages (lobby, settings …) keep the keypad tapping four keys and Space. The 12-option picker is the artifact
  "Englitch wipe mascots".
- Practice modes = the four skills only: `pages/Listen.tsx` (hear → type), `Speak.tsx` (mic; Brave blocks web speech
  recognition, so it falls back to keyboard/Win+H voice typing), `Read.tsx` (situations + meanings, multiple choice),
  `Write.tsx` (Thai → type English, two-step hints; in the word bank a word already in the answer is greyed out and can't be added again; tapping it again removes it from the answer — owner). Flashcards and the AI chat page were removed (owner's choice, Nov 2026; `#chat` goes to the lobby);
  `remember()` in `state/progress.tsx` keeps a spaced-review schedule from right/wrong answers in every mode.
- Practice pages look like a social-media story (owner picked design 4 of 5, Nov 2026): `components/Story.tsx` — one tall
  card per question (colour per skill: listen blue, speak pink, read green-blue, write purple), dashes on top for the set
  of 10 (`n` in each page's session; Read uses its round), category tag + progress in the top row, big content in the
  middle (`StoryButton`: round play button, long-press = slow), and a white answer sheet at the bottom. Swipe up after
  answering = next. The old page header / mission strip were removed.
  Top row = 3-column grid: category tag + auto-next | **level badge in the CENTRE** (owner, Nov 2026: Story's `level`
  prop = the phrase's `l`; signal bars 1 green / 2 yellow / 3 orange + ง่าย/กลาง/ยาก; Read situations get
  `levelOf(answer, 'basics')`) | skill name · progress. Phones (≤480px) hide the skill name (bottom bar shows it) so the
  badge stays centred; a long category name (สายอาชีพ ✓) pushes it a little right on narrow phones.
- After every answer: `components/Explain.tsx` "📖 อธิบายประโยคนี้" (owner's request) — meaning, when to use it
  (per-subtopic `USAGE` + tone + the phrase note), sentence patterns (`PATTERNS` in `lib/explain.ts`, fallback by
  sentence type), word meanings (`data/glossary.ts`: `GLOSS` ~1,130 words + `MULTI` phrases like "check in"), up to 2
  similar sentences (`similar()` in `lib/explain.ts`; owner: must MEAN the same / have the same purpose — one shared
  word like "new" is NOT enough, nor is close-looking Thai or the same grammar pattern; those gave wrong pairs): only
  sentences in the same meaning group (`lib/meanings.ts`, ~130 hand-made groups: Thai label + regex on "english | thai")
  count; Thai letter pairs / shared words / same subtopic only rank them. The tag under each shows the most specific
  shared group's label. Slang only matches slang; no group → section hidden (~20% of phrases). New phrases: add them to
  a group's regex if one fits. `.story-side` has `overflow-x: hidden` (it showed a sideways scrollbar). Shown in `Story`'s `side` slot: on screens ≥1180px the card stays CENTRED (owner) and the explanation sits in
  the space to its right (practice pages widen the frame; a dashed placeholder waits there before answering); narrower,
  it goes under the card and the answer sheet has a "ดูคำอธิบาย ↓" jump button. Loaded lazily. New words need a GLOSS line. Names keep their capital in the word list (Mike); a capital "May"
  mid-sentence = the month. Don't give names radio-alphabet meanings (mike/tango/oscar were wrong before).
- Auto-next on/off: `settings.autoNext` (default on). `AutoNextButton` (ui.tsx) = round cyan→magenta play button right of the
  category tag in the story top row (owner's design); off = faded grey, on = a flowing glowing colour ring (owner's reference:
  "Newgrade.gif" by Damian Kidd on Pinterest), bursts once when switched on, toast says on/off. Also a checkbox in Settings.
  `NextButton` honours it; tapping the button doesn't cancel a running countdown.
- Content: 7 main categories (`Group` in `data/content.ts`, owner's list): general, travel, gaming, business,
  academic, entertainment, esp (medical / IT / aviation). Each phrase has a subtopic `c` and its main category `g`
  (`GROUP_OF`). Gaming/everyday phrases live in `data/content.ts`, the other categories in `data/more.ts`.
  English and Thai must stay unique (Write shows the Thai as the question).
- Lobby (`pages/Today.tsx`) = `components/CategoryPicker.tsx` (owner's sketch, Nov 2026): 8 circles in a 3-2-3 grid
  (7 categories + "รวมทุกหมวด"), each in a 3-colour level ring (`StageRing`: green easy, yellow medium, orange hard).
  Tapping one sets the mission; GSAP Flip slides it to the middle and grows it, the others drop into a row below,
  and listen/speak/read/write pop out on an arc around it. A full reload starts back at the 8 circles.
  Smoothness (owner said it stuttered, fixed Nov 2026): Flip uses `scale: true` (transforms only, no `absolute`) and the
  content below slides with `y` instead of tweening the stage height; inline transform styles are removed on complete
  (a left-over `scale: none` blocks the hover grow). Owner: the chosen circle grows steadily all the way while it moves
  (`sine.inOut`) and nothing may grow past its final size then shrink back — no `back.out` on the skill keys. Measure with the `preview` launch config (production build) —
  dev mode is ~2× slower; a hidden browser pane runs no animation frames (advance `gsap.globalTimeline` by hand).
  The phone bottom bar is hidden in the whole lobby and slides in only on the practice (quiz) pages
  (`data-menus` on `.shell`; owner's choice). `lib/lobby.ts` remembers the opened category for the session.
  Ring style (owner's sketch): rounded arcs with clear gaps, a little space, then the outlined inner circle. Each level
  gets at least 10% of the ring (`MIN` in `StageRing`) so a level with few sentences is not a dot touching its neighbour.
  Under the title the ring colours are a bar (`.cp-legend`, owner picked design 3 of 6) that is also the LEVEL PICKER
  (owner): อัตโนมัติ (rainbow) / สั้น / ยาวขึ้น / ยาว = `settings.level`; the chosen one is coloured and larger, the rest grey;
  a hint line under it explains the choice. Same setting as in Settings.
  Under that: the ACCENT chip (`components/AccentChip.tsx`, owner picked design 4 of 6 in the artifact "Englitch
  ปุ่มเลือกสำเนียง", Nov 2026): "สำเนียง: อเมริกัน ▾" with a round flag; tap → small menu อเมริกัน / บริทิช / ออสเตรเลีย / อินเดีย (owner asked to add it) /
  อัตโนมัติ, picking one says "Hello! Nice to meet you." in it. `settings.accent` ('auto' = American); `lib/speech.ts`
  picks a voice of that accent (`bestVoice`, falls back to auto when the device has none) and the mic listens in the
  same language (`speechLang()`). Accents with no voice on this device are greyed out ("เครื่องนี้ไม่มีเสียงนี้"; the
  browser pane only has US voices). Picking an accent clears `voiceURI`; picking a voice in Settings sets the accent.
  Skill buttons = design 3 "keyboard keys" made round (owner's pick): raised round keycaps with a number 1-4 (keys 1-4
  press them on a computer), a shaded SVG picture from `components/SkillArt.tsx` (owner wants pictures, not flat icons/emoji)
  and the name; pastel side colours (listen blue, speak pink, read mint, write lavender). Dark mode tints the keycap face
  more (`--cap-mix`) so the pictures stay visible. Owner wants roomy spacing around the circles (gap in `.cp`).
  Below the circles: a bento (owner picked design 1) — `components/DailyPhrase.tsx` is the phrase of the day as an audio
  player (design 3: big yellow play, words light up with the voice via `sayTracked` in `lib/speech.ts` or a timed
  fallback, waveform, 1×/ช้า toggle) in a "liquid glass" card (owner's choice: frosted glass `--glass-*` over slowly
  drifting pastel blobs `.dp-liquid`, `--blob-*`; a subtle shine on top), beside tiles for learned (ring),
  solid and due counts.
- Missions (no daily missions, owner's choice): one mission per main category (`lib/missions.ts`,
  `components/Missions.tsx`), each practised by listen/speak/read/write. Passed when every phrase in it was answered
  right once, in any mode. The active mission is `settings.mission`; practice then draws only from that category,
  short sentences first (3 stages = levels). No mission = mixed practice from every category.
- Levels: `difficulty()` in `data/content.ts` scores length, long words, grammar (if/would, perfect, passive,
  linking clauses, formal words) and kind of language (idioms, academic, job jargon); <3 easy, <5.2 medium, else hard.
  Phrases: `RAW` (content.ts), `MORE` (more.ts), `MORE2` (more2.ts) — 1,220 in total.
  In mixed practice, auto mode opens medium after 25 easy right answers and hard after 20 medium (`UNLOCK` in
  `pages/practice.ts`). Settings can fix one level (applies inside missions too).
- Owner's preferences: no timers or "minutes per day" anywhere (no pressure), no XP or levels-as-score on screen,
  night mode is pure black. The 3-second auto-next after a right answer stays (owner asked for it).
- Styles: `src/styles.css` (base + tokens), `src/theme.css` (logo retheme, wipe, hero), `src/nav.css` (navbars, logo, sign-in, app shell) — loaded last.
- Design tokens: sky blue, sun yellow `#FFC53D` (edge `#DE8F00`), navy `#15275C`, accent `#1E6BFF`.
- `public/privacy.html` — privacy policy + data-deletion section (`#delete`), needed by Meta.

## Testing the signed-in app locally

The browser pane can't finish real sign-in popups. Temporary trick (never commit it — mark lines `// TEMP-UX-REVIEW`):
make `firebaseEnabled` false when the URL has `?guest` in `src/firebase.config.ts`, and give `AuthProvider` a fake user
in `src/state/auth.tsx`. Revert with `git checkout -- src/firebase.config.ts src/state/auth.tsx` and check `grep -rn TEMP-UX src` is empty before committing.
Hidden browser panes throttle animation frames; GSAP animations may look paused there.

## Facebook login (Meta app "Englitch", App ID 1132839822843907)

- Set up and enabled in Firebase. Still in **Development mode** (only the owner can sign in).
- Owner still needs to: upload the app icon (`englitch-icon-1024.png` in this folder, not committed), set Privacy Policy URL
  `https://englitch.pages.dev/privacy.html` and data-deletion URL `…/privacy.html#delete` (both live since 27 Nov 2026),
  then switch to Live (Meta may ask for verification/review).

## Owner's open to-dos (saved 27 Nov 2026 at the owner's request — remind them when relevant)

1. Publish `firestore.rules` in the Firebase console (copy the file → Firestore → Rules → paste → Publish):
   https://console.firebase.google.com/project/englitch-da50c/firestore/rules
2. Test sign-in on the live site in a private window: Discord, Google, Facebook (owner's own account only for now); then the
   four skill pages and the phone.
3. Facebook → Live (see the section above).

## Next upload checklist (only when the owner says so)

Last upload: 27 Nov 2026 (main = b4c1825, 48 commits incl. the whole redesign). After it the owner still had to publish
firestore.rules and test sign-in on the live site (the browser pane cannot finish sign-in popups).

1. Merge `dev` into `main` and push.
2. Publish `firestore.rules` in the Firebase console (members: owner may read/delete own doc — used by delete-account).
3. Check the live site (sign-in with Discord / Google / Facebook, dark mode, phone).

