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
- Firebase (modular SDK, lazy-loaded), project `englitch-da50c`: Auth (Discord via Cloudflare Functions custom token,
  Google, Facebook) + Firestore (`users/{uid}`, `members/{uid}`). Rules in `firestore.rules`.
- Cloudflare Pages Functions in `functions/` (Discord OAuth, `/__/auth/*` proxy to Firebase in `_middleware.ts`).

```
npm install
npm run dev     # http://localhost:5173
npm run build   # tsc -b && vite build → dist/
```

## Where things are

- `src/App.tsx` — Gate (landing vs app) and the app Shell.
- `src/components/Nav.tsx` — TopBar, QuestRail (desktop icon rail with mission progress rings), BottomBar (phone).
- `src/components/AccountMenu.tsx` — avatar pill + drop-down (copied from the owner's scholarship project, `C:\ProjectWeb\scholarship`).
- `src/pages/Landing.tsx` — landing; `HeroKeys.tsx` (keypad hero: one key per category, shows a sample sentence), `Keypad.tsx` (isometric SVG),
  `SectionNav.tsx` (scroll-spy links), `SignInDrop.tsx` (rope-ladder sign-in badges), `ThemeToggle.tsx` (sun/moon).
- `src/components/PageStage.tsx` — page-change wipe (the same keypad taps four keys and Space).
- Practice modes = the four skills + AI chat: `pages/Listen.tsx` (hear → type), `Speak.tsx` (mic; Brave blocks web speech
  recognition, so it falls back to keyboard/Win+H voice typing), `Read.tsx` (situations + meanings, multiple choice),
  `Write.tsx` (Thai → type English, two-step hints), `Chat.tsx`. Flashcards were removed (owner's choice, Nov 2026);
  `remember()` in `state/progress.tsx` keeps a spaced-review schedule from right/wrong answers in every mode.
- Content: 7 main categories (`Group` in `data/content.ts`, owner's list): general, travel, gaming, business,
  academic, entertainment, esp (medical / IT / aviation). Each phrase has a subtopic `c` and its main category `g`
  (`GROUP_OF`). Gaming/everyday phrases live in `data/content.ts`, the other categories in `data/more.ts`.
  English and Thai must stay unique (Write shows the Thai as the question).
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
- Owner still needs to: test sign-in on localhost, upload the app icon (`englitch-icon-1024.png` in this folder, not committed),
  and later switch to Live (needs privacy.html on the live site; Meta may ask for verification/review).

## Next upload checklist (only when the owner says so)

1. Merge `dev` into `main` and push.
2. Publish `firestore.rules` in the Firebase console (members: owner may read/delete own doc — used by delete-account).
3. Check the live site (sign-in with Discord / Google / Facebook, dark mode, phone).

## Open questions for the owner

- Keep the keypad in the page-change wipe as well as the hero, or bring back the old wipe?
