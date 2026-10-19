import { create } from "zustand";
import { useTeamStore } from "../store/teamStore";
import { gameRoundCount } from "../lib/board";
import { sfx } from "../audio/sound";
import { hostRoom, RELAY_URL, type HostRoom, type PhoneView, type PlayerMsg, type RoomStatus } from "./connection";
import { answer, buzz, newRound, openBuzzers, withGaps, type Round } from "./round";

/**
 * Trivia Night on several phones, host side. The normal Trivia Night game
 * (useTeamStore) stays the referee's game: board, scores, penalties,
 * lightning and final rounds work as on one phone. This session adds a room
 * that team phones join, turns their buzzes, answers and final wagers into
 * moves in that game, and sends every phone a public view of it.
 */
interface PartyHostState {
  room: HostRoom | null;
  code: string | null;
  link: string | null;
  status: RoomStatus;
  /** phone (peer id) → team id */
  members: Record<string, number>;
  online: Record<string, boolean>;
  /** the open clue, played on phones */
  round: Round | null;
  /** final round: teams whose phone sent a wager, and each team's answer (host only) */
  wagered: number[];
  finalAnswers: Record<number, { text: string; spoken: boolean }>;
  open: () => void;
  close: () => void;
  openBuzzers: () => void;
}

export const usePartyHost = create<PartyHostState>((set, get) => ({
  room: null,
  code: null,
  link: null,
  status: "connecting",
  members: {},
  online: {},
  round: null,
  wagered: [],
  finalAnswers: {},

  open: () => {
    if (!RELAY_URL || get().room) return;
    const room = hostRoom(RELAY_URL, {
      status: (status) => set({ status }),
      peer: (peer, up) => {
        set({ online: { ...get().online, [peer]: up } });
        if (up) {
          room.sendTo(peer, { t: "view", view: phoneView() });
          room.sendTo(peer, { t: "you", team: get().members[peer] ?? null });
        }
      },
      message: (peer, msg, at) => handle(peer, msg, at),
    });
    set({ room, code: null, link: null, status: "connecting", members: {}, online: {}, round: null, wagered: [], finalAnswers: {} });
    room.code.then((code) => set({ code }));
    room.link.then((link) => set({ link }));
  },

  close: () => {
    get().room?.close();
    set({ room: null, code: null, link: null, members: {}, online: {}, round: null });
  },

  openBuzzers: () => {
    const r = get().round;
    if (r) set({ round: openBuzzers(r) });
  },
}));

/** Phones on a team that are connected right now. */
export function phonesOn(team: number, s: Pick<PartyHostState, "members" | "online">): number {
  return Object.entries(s.members).filter(([peer, t]) => t === team && s.online[peer] !== false).length;
}

function handle(peer: string, msg: PlayerMsg, at: number): void {
  const party = usePartyHost.getState();
  const game = useTeamStore.getState();
  if (msg.t === "team") {
    if (!game.teams.some((t) => t.id === msg.team)) return;
    usePartyHost.setState({ members: { ...party.members, [peer]: msg.team } });
    party.room?.sendTo(peer, { t: "you", team: msg.team });
    return;
  }
  const team = party.members[peer];
  if (team === undefined) return;

  if (msg.t === "buzz" || msg.t === "answer") {
    const r = party.round;
    if (game.phase !== "clue" || game.revealed || !r || msg.key !== r.key) return; // stale
    if (msg.t === "buzz") {
      const next = buzz(r, team, at);
      if (next !== r) {
        sfx.tick();
        usePartyHost.setState({ round: next });
      }
      return;
    }
    const tile = game.board?.tiles.find((t) => t.id === game.currentTileId);
    if (!tile) return;
    const next = answer(r, team, msg.text, msg.spoken, tile.answer);
    if (next === r) return;
    usePartyHost.setState({ round: next });
    if (next.winner !== null) {
      game.revealClue(); // the quizmaster says the answer; the host awards the points
    } else {
      sfx.buzz();
      game.missed(team); // costs points when "wrong answers cost points" is on
    }
    return;
  }

  if (msg.t === "wager") {
    if (game.phase !== "final-wager") return;
    game.setWager(team, msg.amount); // clamped to the team's score
    if (!party.wagered.includes(team)) usePartyHost.setState({ wagered: [...party.wagered, team] });
    return;
  }

  if (msg.t === "final") {
    if (game.phase !== "final-clue" || game.revealed || !msg.text.trim()) return;
    usePartyHost.setState({
      finalAnswers: { ...party.finalAnswers, [team]: { text: msg.text.trim().slice(0, 80), spoken: msg.spoken } },
    });
  }
}

/** The public view of the game for team phones. */
export function phoneView(): PhoneView {
  const g = useTeamStore.getState();
  const p = usePartyHost.getState();
  const tile = g.phase === "clue" ? (g.board?.tiles.find((t) => t.id === g.currentTileId) ?? null) : null;
  const total = g.set ? gameRoundCount(g.set) : 0;
  const base: PhoneView = {
    stage: "board",
    game: g.set?.name ?? "",
    roundLabel: `Round ${g.roundIndex + 1} of ${total}`,
    teams: g.teams.map(({ id, name, color, score }) => ({ id, name, color, score })),
    picker: g.teams[g.activeTeam]?.id ?? null,
    clue: null,
    revealed: false,
    answer: null,
    buzz: null,
    winner: null,
    wagered: [],
    finalAnswered: [],
  };
  if (g.phase === "clue" && tile) {
    const r = p.round?.key === tile.id ? p.round : null;
    return {
      ...base,
      stage: "clue",
      clue: { key: tile.id, category: tile.categoryName, text: tile.clue, value: tile.value },
      revealed: g.revealed,
      answer: g.revealed ? tile.answer : null,
      buzz: r && {
        open: r.open && !g.revealed,
        order: withGaps(r.buzzes),
        answering: g.revealed ? null : r.answering,
        tried: r.tried,
        lastAnswer: r.lastAnswer,
      },
      winner: r?.winner ?? null,
    };
  }
  if (g.phase === "lightning" && g.lightning) {
    const l = g.lightning;
    const c = l.clues[l.index];
    return {
      ...base,
      stage: "lightning",
      roundLabel: `Lightning ${l.index + 1} of ${l.clues.length}`,
      clue: { key: `lightning-${l.index}`, category: c.categoryName, text: c.clue, value: l.value },
      revealed: l.revealed,
      answer: l.revealed ? c.answer : null,
      winner: l.winnerId,
    };
  }
  if ((g.phase === "final-wager" || g.phase === "final-clue") && g.finalClue) {
    const fc = g.finalClue;
    return {
      ...base,
      stage: g.phase,
      roundLabel: "Final",
      clue: { key: "final", category: fc.categoryName, text: g.phase === "final-clue" ? fc.clue : "", value: 0 },
      revealed: g.phase === "final-clue" && g.revealed,
      answer: g.phase === "final-clue" && g.revealed ? fc.answer : null,
      wagered: p.wagered,
      finalAnswered: Object.keys(p.finalAnswers).map(Number),
    };
  }
  if (g.phase === "winner") return { ...base, stage: "winner", roundLabel: "Final scores" };
  return base;
}

// keep the session in step with the game, and every phone in step with both
let lastSent = "";
function sync(): void {
  const g = useTeamStore.getState();
  const p = usePartyHost.getState();
  if (!p.room) return;
  // a new clue starts a new round on the phones
  if (g.phase === "clue" && g.currentTileId && p.round?.key !== g.currentTileId) {
    usePartyHost.setState({ round: newRound(g.currentTileId) });
    return; // the state change calls sync again
  }
  const view = JSON.stringify(phoneView());
  if (view === lastSent) return;
  lastSent = view;
  p.room.sendAll({ t: "view", view: JSON.parse(view) as PhoneView });
}

let prevPhase = useTeamStore.getState().phase;
useTeamStore.subscribe((g) => {
  const p = usePartyHost.getState();
  const changed = g.phase !== prevPhase;
  prevPhase = g.phase; // before any change below, which calls this again
  if (p.room && changed) {
    // final round on phones: wagers start at 0 and come from each team's phone
    if (g.phase === "final-wager") {
      usePartyHost.setState({ wagered: [], finalAnswers: {} });
      useTeamStore.setState({ wagers: g.teams.map(() => 0) });
    }
    // leaving the game closes the room
    if (g.phase === "sets" || g.phase === "setup") p.close();
  }
  sync();
});
usePartyHost.subscribe(() => {
  lastSent = usePartyHost.getState().room ? lastSent : "";
  sync();
});
