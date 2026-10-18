# Trivia Night on several phones — design

Status: proposal, October 2026. Nothing here is built yet.

## Goal

Today Trivia Night runs on **one shared phone**: the quizmaster voice reads
the clue, teams answer on the clue card (typed or out loud), a miss passes
the turn to the next team (`app/src/lib/turns.ts`), and the host's buttons
award the points (`app/src/components/HostClueModal.tsx`,
`app/src/store/teamStore.ts`).

Next: **each team on its own phone.** The host phone (usually on a TV or in
the middle of the table) shows the board and the clue; team phones buzz in,
answer, and wager in the final round privately.

Non-goals for the first version: playing across different homes with video,
chat between teams, accounts, leaderboards.

## What stays the same

- **The host phone is the referee.** It owns the game state that
  `teamStore` already models (board, current clue, turns, scores, final
  wagers) and judges answers with the existing checkers (`isCorrect`,
  `spokenMatch`). Team phones send requests; they never decide anything.
- **One-phone mode stays** and stays fully offline. Multi-device is an
  extra mode that needs a connection.
- **Voice stays on the device.** Spoken answers are recognized on the
  phone that hears them (`app/src/voice`); only the recognized text is sent.

## How phones talk: options

| | A. Tiny relay server (WebSocket) | B. Peer-to-peer WebRTC | C. Local "nearby" networking |
|---|---|---|---|
| How | Each phone opens a WebSocket to a room on a small server that forwards messages | Phones connect directly; a server is still needed to introduce them ("signalling"), plus a relay (TURN) when networks block direct links | Apple Multipeer Connectivity, Android Nearby Connections, or Bonjour/mDNS over the same Wi-Fi |
| iPhone + Android in one game | Yes | Yes | **No**: Multipeer is Apple-only and Nearby is Android-first; mixing needs custom LAN code |
| Works offline | No (needs internet) | No (signalling) | Yes, on the same Wi-Fi |
| Extra permissions | None | None | iOS "Local Network" prompt; Android nearby/location permissions |
| Browser players (no app) | Yes | Yes | No |
| Effort | Small server + client | Medium–high (signalling, TURN, connection edge cases) | High (two native plugins + LAN fallback) |
| Running cost | Low (one small serverless service) | Signalling + TURN bandwidth | None |

**Recommendation: A, a tiny relay**, built so it never keeps anything:

- One room per game, in memory only, deleted when the host leaves or after
  2 hours idle. No database, no logs of message contents, no accounts.
- **End-to-end encrypted messages.** The host creates a random room key and
  puts it in the join QR code / link (in the URL fragment, which browsers
  never send to servers). Phones encrypt every message with it (AES-GCM via
  WebCrypto), so the relay forwards bytes it cannot read.
- A good fit is a Cloudflare Worker with one Durable Object per room
  (WebSockets, single place per room for fair ordering, cheap at our
  scale). Any equivalent WebSocket host works; the protocol doesn't depend
  on it.
- The app stays free of third-party SDKs: a plain browser WebSocket and
  WebCrypto, which matters for Google's Families policy (Play targets 9+).

B can come later as an optimization (lower latency on the same Wi-Fi)
using the same relay for signalling. C isn't worth it: it splits iPhone and
Android families, which is exactly who plays together.

## Joining

1. Host taps **Play on several phones**: the app opens a room and shows a
   4-letter code and a QR code (`…/join#ROOM-KEY`).
2. Team phones scan the QR code or type the code in the app. **Phones
   without the app** can join through the website (the web build already
   runs the whole game), so a guest needs nothing installed.
3. Each phone picks a team (name and colour from the host's team list;
   free-text names stay on the host's phone, see Privacy).
4. Reconnecting: a phone that drops (screen lock, network change) rejoins
   with the same team token from memory; the host shows a dot for teams
   that are offline.

## Game protocol

Messages are small JSON objects, encrypted, sent through the room.

Host → everyone (state, after every change; never contains answers before
the reveal, so team phones can't peek):

```
{ t: "state", phase, board: {categories, tiles:[{id, value, played}]},
  clue?: {id, text, value, category}, answering?: teamId, tried: teamId[],
  buzzOpen: bool, scores: {teamId: n}, final?: {...}, revealed?: {answer} }
```

Team phone → host:

```
{ t: "join", team }                  // pick a team
{ t: "buzz", team, at }              // wants to answer (at = local clock, see Fairness)
{ t: "answer", team, text, spoken }  // typed or recognized text, never audio
{ t: "wager", team, amount }         // final round, private
```

Host → one team: `{ t: "yourTurn" }`, `{ t: "result", correct }`.

### Turn rules (same as one phone, plus buzzing)

- The team that picked the tile answers first (existing rule).
- After a miss, **buzzing opens** for the teams that haven't tried
  (`nextAnswering` today picks the next in seating order; with phones the
  fastest buzz wins instead, falling back to seating order if nobody buzzes
  within a few seconds).
- A correct answer is credited to the answering team; the host can still
  override with the award buttons, as now.

### Fairness of "first to buzz"

- The relay stamps each buzz with its own arrival time; one room lives in
  one place, so there is a single clock. Earliest stamp wins.
- Phones on the same Wi-Fi differ by tens of milliseconds, which is fine
  for a family game. If two buzzes land within 150 ms, the tie is broken
  by the phones' own timestamps corrected with a measured clock offset (each
  phone pings the room on joining; offset ≈ server time − phone time −
  round-trip/2).
- Buzzing is locked until the quizmaster has finished reading the clue (the
  host knows when the clue's audio ends), so nobody buzzes on the first
  word.

### Final round

Wagers are entered **privately on each team's phone**, which a single
shared phone can't do. The host shows "3 of 4 teams have wagered"; amounts
appear only at the reveal.

## Privacy and store impact

What leaves a phone in multi-device mode: the room code and key (in the
join link), team choice, buzzes, answer **text**, wagers. No audio, no
names of people, no device identifiers, nothing stored.

- **Apple App Privacy**: Apple counts data as "collected" when it leaves
  the device in a way that can be accessed longer than needed to serve the
  request in real time. A relay that keeps nothing and can't read the
  messages (end-to-end encrypted) fits "not collected"; we keep **Data Not
  Collected**, with the reasoning documented for App Review.
- **Google Play Data safety**: end-to-end encrypted data that no
  intermediary (including us) can read is excluded; data processed only
  ephemerally is declared in the form but not shown publicly. With
  encryption on, the public section can stay "no data collected"; the form
  answers need care and must match the design exactly.
- **Families policy / COPPA (Play targets 9+)**: no personal information,
  no accounts, no chat, no third-party SDKs, no ads. Free-text team names
  never leave the host phone (team phones choose from the host's list), so
  nothing typed by a child is sent anywhere.
- **No chat between teams**, deliberately. Chat is user-generated content,
  which brings moderation, reporting and blocking requirements in both
  stores.
- The privacy policy gets a "Playing on several phones" section; the
  support page explains the join code and that one-phone mode works offline.

## Build plan

| Phase | What | Effort (rough) |
|---|---|---|
| 0. Spike | Relay with rooms + encryption; web-only host and team screens; buzz + typed answers on a LAN | 3–4 days |
| 1. MVP | In-app host and team modes, QR join, reconnect, turns and steals, buzz fairness, scores, host overrides, offline-dot | 1.5–2 weeks |
| 2. Phones shine | Spoken answers on team phones, private final wagers, website join for guests, sounds/haptics on buzz | 1 week |
| 3. Ship | Privacy policy and store forms, App Review notes, load test (100 rooms), relay monitoring without content logs, e2e tests with several browser contexts | 3–5 days |

Testing: Playwright already drives the app; several browser contexts in
one test can play host and teams against a local relay, so the full flow
gets end-to-end tests like the one-phone game.

## Open questions for later

- Name and look of the mode ("Party mode"? "Play on several phones").
- Should a team phone also show the clue text (accessibility, noisy rooms),
  or only the host screen? Proposal: yes, after the quizmaster finishes
  reading.
- Spectators (grandparents watching on a tablet) — cheap to add once rooms
  exist.
- A wrong-answer penalty (TV-style) as an option, for one-phone and
  multi-device modes alike.
