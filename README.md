# Quizzical — Trivia Board Game (Jeopardizzy-)

A fast, tactile, Jeopardy-style trivia board game that runs entirely in the
browser. Static site, no backend — live at
**https://jeopardizzy.github.io/Jeopardizzy-/**

- **5 categories × 5 clues** per round, values 100–500
- **Round 2: Double Quizzical** — a fresh board, doubled values (200–1000)
- **Final Quizzical** — one last clue, wager up to your whole score
- **Daily Challenge** — deterministic UTC date seed: the same board all day
- **Typed answers** with fuzzy matching (typos, articles, alternates) *or*
  **Reveal + self-grade** for party / host-led play
- Local records (best score, best streak, games played) stored on-device only
- Web Audio sound effects (mutable), reduced-motion support, touch / mouse /
  keyboard friendly
- 63 categories · 540 curated clues bundled with the app

## Repository layout

This repo is published via GitHub Pages **"Deploy from a branch"** mode
(`main`, root). That means the repository root holds the **built** site:

```
index.html, assets/     ← published build output (do not edit by hand)
app/                    ← the actual source code (edit here)
  src/                  ← React app
  data/                 ← bundled trivia dataset (anonymized)
  extract/              ← content extraction pipeline (local tooling)
  tests/  e2e/          ← vitest + playwright
  scripts/publish.mjs   ← copies app/dist to the repo root
.github/workflows/      ← CI: typecheck → test → build → publish to root
```

## Development

```bash
npm run dev        # dev server (delegates to app/, forwards --port/--host)
npm test           # vitest: game rules, answer matching, save handling
npm run build      # type-check + production build (app/dist)
npm run publish    # build + copy app/dist to the repo root
```

Run `npm install` once inside `app/` (`npm --prefix app install`).

## Deploying changes

Just push to `main`. The workflow in `.github/workflows/deploy.yml`
type-checks, tests, builds `app/`, and commits the fresh build output to the
repository root — GitHub Pages then serves it automatically (legacy branch
mode). Only changes under `app/` trigger a rebuild.

To switch to the modern flow later: Settings → Pages → Source → **GitHub
Actions**, then replace the workflow with `actions/deploy-pages` and stop
committing build output to root.

## Stack

Vite 8 · React 19 · TypeScript (strict) · Tailwind CSS v4 · React Router 7
(hash routing) · Zustand · Zod (dataset + save validation) · Motion ·
Vitest · Playwright

## Content note

The bundled trivia collection was assembled for personal, non-commercial use.
Source PDFs and raw extraction output are deliberately excluded from this
repository (see `.gitignore`).

## What was verified

- `vitest`: 27 unit tests — board generation (shape, values, determinism,
  no cross-round or same-family repeats), dataset integrity and
  anonymization, ligature-artifact regression, fuzzy answer matching,
  versioned save round-trip and corrupt-save recovery.
- `playwright` (desktop + mobile viewport): full gameplay session across both
  rounds and the final, restart, record persistence, wrong-answer flow,
  reveal + self-grade flow, direct `#/how` links, refresh behavior, keyboard
  play, reduced-motion play.
- Built app tested under the `/Jeopardizzy-/` subpath with zero failed asset
  requests.
