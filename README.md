# Guitar Ear Trainer

Desktop app for drilling interval recognition on guitar. Plays a randomly-rooted interval with a real guitar sound, you guess it, the fretboard reveals both notes.

## Stack

- **Electron + Vite + React + TypeScript** (via `electron-vite`)
- **Tone.js** with nbrosowsky's free guitar samples (acoustic + clean electric)
- **Zustand** (with localStorage persistence) for settings + stats
- **Tailwind** for styling, **Recharts** for the stats line chart, **lucide-react** for icons

## Setup

```powershell
cd "EarTraining"
npm install
npm run dev
```

First launch fetches the guitar samples from GitHub Pages (a few MB, cached after that). You need internet on first run; subsequent runs work offline once samples are cached.

## Run / Build

| Command | What it does |
|---|---|
| `npm run dev` | Electron desktop app with HMR + devtools |
| `npm run build` | Compile Electron main + preload + renderer into `out/` |
| `npm run start` | Run the compiled Electron app |
| `npm run package` | Build + run electron-builder to produce a distributable |
| `npm run dev:web` | Standalone web mode on `http://0.0.0.0:5174` — for phone use |
| `npm run build:web` | Production web build into `dist-web/` (deploy anywhere) |
| `npm run preview:web` | Serve the built web app over LAN |
| `npm run typecheck` | TypeScript check, no emit |

## Install as a real app on your phone (free, no app store)

This builds as an installable **PWA** — a web app you host online for free, then install on your phone so it gets a real icon, opens fullscreen, and works offline. No Android Studio, no Xcode, no developer account.

### One-time build (already done for you)
```powershell
npm install
npm run gen:icons     # generates app icons from public/icon.svg
npm run build:web     # outputs the deployable app into dist-web/
```

### Deploy it free (pick one)

**Easiest — Netlify Drop (no CLI):**
1. Go to **https://app.netlify.com/drop**
2. Drag the entire **`dist-web`** folder onto the page.
3. It gives you a public HTTPS link like `https://random-name.netlify.app`. Sign up free to keep it permanently (and rename it).

**Other free hosts** (same idea — upload `dist-web/`): Cloudflare Pages, Vercel, GitHub Pages, tiiny.host. Any static host with HTTPS works. HTTPS is required for install + offline to work (all of these provide it automatically).

### Install on your phone
1. Open your public link in the phone browser (Chrome on Android, Safari on iOS).
2. **Android:** a banner or ⋮ menu → **Install app**. **iOS:** Share → **Add to Home Screen**.
3. It now lives on your home screen like any app, launches fullscreen, and works without your PC.

After the first time you play a few notes, the guitar samples are cached, so it works offline afterward.

---

## Phone use over local Wi-Fi (dev only)

Alternatively, to test on your phone while tethered to your PC:

1. On your computer, run `npm run dev:web`. Vite will print something like:
   ```
   ➜  Local:   http://localhost:5174/
   ➜  Network: http://192.168.1.42:5174/
   ```
2. Make sure your phone is on the same Wi-Fi.
3. Open the Network URL in your phone's browser (Safari on iOS, Chrome on Android).
4. **Add to Home Screen** — iOS: Share → Add to Home Screen. Android: ⋮ → Install app / Add to Home screen. It'll launch fullscreen like a native app via the PWA manifest.

For a permanent setup, run `npm run build:web` and host `dist-web/` anywhere (Netlify, Vercel, GitHub Pages, your own server). No backend required — everything runs client-side.

**Note**: First load on phone needs internet to fetch the guitar samples from `nbrosowsky.github.io`. After that the browser caches them. On iOS audio requires a user gesture — the first Play tap unlocks it.

## Keyboard shortcuts

| Key | Action |
|---|---|
| Space | Start / replay the current interval |
| Enter | Next question (after answering) |
| 1–9 | Select interval answer (in order shown on screen) |

## How it works

1. **Pick a root** somewhere on the configured fret/string range.
2. **Pick an interval** from your enabled set.
3. **Plan a target note** that lands on the fretboard within 0–24 frets, ascending by default.
4. **Play root → randomized gap (re-rolled every time) → target.**
5. You answer; the fretboard reveals both notes labeled with pitch class.

## Modes

- **Comfortable** — drills the intervals you've already got (m3/M3/P4/TT/P5 by default).
- **Progressive Unlock** — starts with P5+P4; unlocks the next interval (in the order P5, P4, M3, m3, TT, P8, M6, m6, M2, m2, M7, m7) once every currently-enabled interval crosses 85% over its last 20 reps.
- **Custom** — check whatever boxes you want.

## Data

Settings live in localStorage under `ear-trainer-settings`. Stats live under `ear-trainer-stats`. The Stats screen has a "Reset stats" button. If you blow away the app's localStorage you reset everything.

## File layout

```
src/
├── main/          # Electron main process (window lifecycle only for now)
├── preload/       # Safe contextBridge
├── shared/        # Types shared by main + renderer
└── renderer/
    ├── audio/     # Tone.js sampler + interval playback
    ├── music/     # Tuning, interval defs, fretboard pitch math
    ├── trainer/   # Trainer state machine + screen
    ├── fretboard/ # Reusable SVG fretboard component
    ├── settings/  # Settings UI + progressive-unlock logic
    ├── stats/     # Stats UI, confusion matrix, accuracy chart
    ├── store/     # Zustand stores (settings/stats/session)
    └── shortcuts/ # Keyboard binding hook
```

## Adding new training modes (Phase 2)

The state machine in `src/renderer/trainer/useTrainer.ts` and the Fretboard component are designed to be reused. To add chord recognition:

1. Add a new `chords/` folder under `src/renderer/`.
2. Define chord shapes (root + interval stack + suggested fingering).
3. Write a `playChord` analogue of `playInterval` that strums the notes.
4. Reuse `<Fretboard>` with one marker per chord-tone.
5. Add a new tab in `App.tsx`.

The session/stats stores already accept arbitrary `intervalId`-keyed results — for chords/scales we'd either extend `IntervalId` to a discriminated union or add parallel stat keys.

## Known limitations / follow-ups

- Samples are loaded from `nbrosowsky.github.io` on first run. To make the app fully offline-first, download those `.mp3` files into `src/renderer/audio/samples/` and switch `baseUrl` in `src/renderer/audio/sampler.ts`.
- Stats are in localStorage. If you want them durable across reinstalls, swap the persist storage to a file via Electron IPC (`app.getPath('userData')`).
- No chord/scale modes yet — that's Phase 2.
- No tests yet — the music math (`fretboard.ts`, `intervals.ts`) and progressive unlock (`modes.ts`) are the natural candidates to add unit tests for first.
