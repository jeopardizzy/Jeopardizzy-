# Quizzical Club — Team Trivia & Word-Game Night (Jeopardizzy-)

[![▶ Play online](https://img.shields.io/badge/%E2%96%B6_Play_online-Quizzical_Club-f5e6a8?style=for-the-badge&logoColor=2e3a33&labelColor=f6f4ec)](https://jeopardizzy.github.io/Jeopardizzy-/)
[![CI](https://github.com/jeopardizzy/Jeopardizzy-/actions/workflows/deploy.yml/badge.svg)](https://github.com/jeopardizzy/Jeopardizzy-/actions/workflows/deploy.yml)

A light, gentle trivia game for long family sessions: team Jeopardy boards,
a solo practice workbook, and guides for every puzzle type. Static site, no
backend — **play it live at
[jeopardizzy.github.io/Jeopardizzy-](https://jeopardizzy.github.io/Jeopardizzy-/)**.

## The three sections

- **🎯 Team Jeopardy** — pick one of five themed sets, split into 1–4 teams,
  and play two boards (round 2 is doubled) plus a final wager. The host reads
  the clue aloud, reveals the answer, and awards points to a team. All content
  comes from the curated book dataset (63 categories · 540 clues).
- **✏️ Workbook** — practice every puzzle type (homonyms, compound words,
  backwords, heteronyms, letter trivia, initials, hidden words, title swaps,
  geography, general knowledge) as a 10-question test at your chosen
  difficulty, with fuzzy answer checking and per-type best scores saved
  locally.
- **📖 Guides** — how each puzzle type works: rules, a worked example, and
  strategy tips, with one-tap "practice this type".

## Repository layout

This repo is served by GitHub Pages via **GitHub Actions** (Settings → Pages →
Source: GitHub Actions):

```
app/                    ← the source code (edit here)
  src/                  ← React app
  tests/  e2e/          ← vitest + playwright
.github/workflows/      ← CI: typecheck → test → build → deploy app/dist
```

## Development

```bash
npm run dev        # dev server (delegates to app/, forwards --port/--host)
npm test           # vitest: sets validity, workbook pools, guides, matcher, saves
npm run build      # type-check + production build (app/dist)
```

Run `npm install` once inside `app/` (`npm --prefix app install`).

## Deploying changes

Just push to `main`. The workflow in `.github/workflows/deploy.yml`
type-checks, tests, builds `app/`, and deploys `app/dist` via the official
GitHub Pages actions.

## Stack

Vite 8 · React 19 · TypeScript (strict) · Tailwind CSS v4 · React Router 7
(hash routing) · Zustand · Zod · Motion · Vitest · Playwright

## Content note

Trivia content is bundled for personal, non-commercial use; no source book
titles or author names appear in the app.

## What was verified

- `vitest`: 33 unit tests — set validity against the dataset, workbook pools,
  guide coverage, fuzzy answer matching, versioned saves with corrupt-save
  recovery, dataset anonymization and artifact regression.
- `playwright` (desktop + mobile): full team flow (set → teams → award
  points), workbook test to results, guides → practice shortcut, refresh
  redirects, reduced motion.
