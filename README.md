# Quizzical — Trivia Board Game

A fast, tactile, Jeopardy-style trivia board game that runs entirely in the
browser. Static site, no backend — ready for GitHub Pages.

- **5 categories × 5 clues** per round, values 100–500
- **Round 2: Double Quizzical** — a fresh board, doubled values (200–1000)
- **Final Quizzical** — one last clue, wager up to your whole score
- **Daily Challenge** — deterministic UTC date seed: the same board all day
- **Typed answers** with fuzzy matching (typos, articles, alternates) *or*
  **Reveal + self-grade** for party / host-led play
- Local records (best score, best streak, games played) stored on-device only
- Sound effects synthesized live with the Web Audio API (mutable), reduced-motion
  support, touch / mouse / keyboard friendly
- 69 categories · 537 curated clues bundled with the app

## Development

```bash
npm install        # or: npm ci
npm run dev        # dev server (forwards --port/--host to vite)
npm test           # vitest: game rules, answer matching, save handling
npm run build      # type-check + production build to dist/
npm run preview    # serve the production build locally
npm run e2e        # playwright: gameplay, routing, reduced-motion, full session
```

## Stack

Vite 8 · React 19 · TypeScript (strict) · Tailwind CSS v4 · React Router 7
(hash routing for Pages) · Zustand · Zod (dataset + save validation) ·
Motion for React · Vitest · Playwright

## Deployment (GitHub Pages)

1. Push this repository to GitHub (default branch `main`).
2. In the GitHub repo: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**.
3. Push to `main` (or run the workflow manually). The included workflow
   `.github/workflows/deploy.yml` installs from the lockfile, type-checks,
   runs unit tests, builds `dist/`, and deploys via the official Pages actions.
4. The site works both at `https://<user>.github.io/<repo>/` and at a root or
   custom domain: Vite is configured with `base: "./"` so all asset URLs are
   relative, and routing is hash-based (`#/game`, `#/how`) so refreshes and
   direct links never hit server paths.

No environment variables or secrets are needed.

## Content note

The bundled trivia collection was assembled for personal, non-commercial use.
Source PDFs and the extraction pipeline are deliberately excluded from this
repository (see `.gitignore`).

## What was verified

- `vitest`: 26 unit tests — board generation (shape, values, determinism),
  dataset integrity and anonymization, fuzzy answer matching, versioned save
  round-trip and corrupt-save recovery.
- `playwright` (desktop + mobile viewport): full gameplay session across both
  rounds and the final, restart, record persistence, wrong-answer flow,
  reveal + self-grade flow, direct `#/how` links, refresh behavior, keyboard
  play, reduced-motion play.
- Built app tested under a repository-style subpath (`/quizzical/`) with zero
  failed asset requests.
