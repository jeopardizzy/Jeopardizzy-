import { create } from "zustand";
import type { Board, FinalClue } from "../lib/schema";
import { boardForRound, gameRoundCount, pickFinalForGame } from "../lib/board";
import { randomSeed } from "../lib/random";
import { GAMES, type GameDef } from "../data/games";
import {
  loadRecords,
  loadSettings,
  saveRecords,
  saveSettings,
  type Records,
  type Settings,
} from "../lib/saves";
import { setSoundMuted, sfx } from "../audio/sound";

export type TeamPhase =
  | "sets"
  | "setup"
  | "board"
  | "clue"
  | "final-wager"
  | "final-clue"
  | "winner";

export interface Team {
  id: number;
  name: string;
  color: string;
  score: number;
}

export const TEAM_COLORS = ["#4f7a5d", "#c99700", "#d97762", "#6b93c0"];

interface TeamGameState {
  phase: TeamPhase;
  set: GameDef | null;
  seed: number;
  /** 0-based index of the current board within the game */
  roundIndex: number;
  board: Board | null;
  finalClue: FinalClue | null;
  playedTileIds: string[];
  currentTileId: string | null;
  revealed: boolean;
  teams: Team[];
  /** whose turn it is to pick a tile */
  activeTeam: number;
  wagers: number[];
  finalMarks: (boolean | null)[];
  settings: Settings;
  records: Records;

  selectSet: (setId: string) => void;
  backToSets: () => void;
  startGame: (names: string[]) => void;
  openTile: (tileId: string) => void;
  revealClue: () => void;
  awardTo: (teamId: number) => void;
  noAward: () => void;
  setWager: (teamId: number, wager: number) => void;
  revealFinal: () => void;
  markFinal: (teamId: number, correct: boolean) => void;
  finishGame: () => void;
  playAgain: () => void;
  toggleSound: () => void;
  toggleMotion: () => void;
}

const initialSettings: Settings =
  typeof window === "undefined"
    ? { version: 1, sound: true, reduceMotion: false, teamNames: ["Team Sage", "Team Butter"] }
    : loadSettings();
setSoundMuted(!initialSettings.sound);

export const useTeamStore = create<TeamGameState>((set, get) => ({
  phase: "sets",
  set: null,
  seed: 0,
  roundIndex: 0,
  board: null,
  finalClue: null,
  playedTileIds: [],
  currentTileId: null,
  revealed: false,
  teams: [],
  activeTeam: 0,
  wagers: [],
  finalMarks: [],
  settings: initialSettings,
  records: typeof window === "undefined"
    ? { version: 1, gamesPlayed: 0, workbookBests: {} }
    : loadRecords(),

  selectSet: (setId) => {
    const found = GAMES.find((s) => s.id === setId);
    if (!found) return;
    sfx.tick();
    set({ set: found, phase: "setup" });
  },

  backToSets: () => set({ phase: "sets", set: null, board: null, teams: [] }),

  startGame: (names) => {
    const s = get();
    if (!s.set) return;
    const teams: Team[] = names.map((name, i) => ({
      id: i,
      name: name.trim() || `Team ${i + 1}`,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      score: 0,
    }));
    if (teams.length === 0) return;
    const seed = randomSeed();
    const board = boardForRound(s.set, 0, seed);
    saveSettings({ ...s.settings, teamNames: teams.map((t) => t.name) });
    sfx.chime();
    set({
      phase: "board",
      seed,
      roundIndex: 0,
      board,
      playedTileIds: [],
      currentTileId: null,
      revealed: false,
      teams,
      activeTeam: 0,
      wagers: teams.map(() => 0),
      finalMarks: teams.map(() => null),
    });
  },

  openTile: (tileId) => {
    const s = get();
    if (s.phase !== "board" || s.playedTileIds.includes(tileId)) return;
    sfx.flip();
    set({ phase: "clue", currentTileId: tileId, revealed: false });
  },

  revealClue: () => {
    if (get().phase !== "clue") return;
    sfx.tick();
    set({ revealed: true });
  },

  awardTo: (teamId) => {
    const s = get();
    if (s.phase !== "clue" || !s.revealed || !s.board) return;
    const tile = s.board.tiles.find((t) => t.id === s.currentTileId);
    if (!tile) return;
    sfx.ding();
    const teams = s.teams.map((t) =>
      t.id === teamId ? { ...t, score: t.score + tile.value } : t,
    );
    advanceAfterTile(teams, teamId, set, get);
  },

  noAward: () => {
    const s = get();
    if (s.phase !== "clue" || !s.revealed || !s.board) return;
    sfx.buzz();
    const next = (s.activeTeam + 1) % s.teams.length;
    advanceAfterTile(s.teams, next, set, get);
  },

  setWager: (teamId, wager) => {
    const s = get();
    const team = s.teams.find((t) => t.id === teamId);
    if (!team) return;
    const max = Math.max(0, team.score);
    const w = Math.max(0, Math.min(Number.isFinite(wager) ? Math.floor(wager) : 0, max));
    set({ wagers: s.wagers.map((v, i) => (i === teamId ? w : v)) });
  },

  revealFinal: () => {
    if (get().phase !== "final-clue") return;
    sfx.tick();
    set({ revealed: true });
  },

  markFinal: (teamId, correct) => {
    const s = get();
    if (s.phase !== "final-clue" || !s.revealed || !s.finalClue) return;
    if (s.finalMarks[teamId] !== null) return;
    const wager = s.wagers[teamId] ?? 0;
    const teams = s.teams.map((t) =>
      t.id === teamId ? { ...t, score: t.score + (correct ? wager : -wager) } : t,
    );
    const finalMarks = s.finalMarks.map((m, i) => (i === teamId ? correct : m));
    if (correct) sfx.ding();
    else sfx.buzz();
    set({ teams, finalMarks });
  },

  finishGame: () => {
    const s = get();
    if (s.phase === "final-clue" && s.finalMarks.some((m) => m === null)) return;
    const records = { ...s.records, gamesPlayed: s.records.gamesPlayed + 1 };
    saveRecords(records);
    set({ records });
    sfx.fanfare();
    set({ phase: "winner" });
  },

  playAgain: () => {
    set({ phase: "sets", set: null, board: null, teams: [], finalClue: null });
  },

  toggleSound: () => {
    const next: Settings = { ...get().settings, sound: !get().settings.sound };
    setSoundMuted(!next.sound);
    saveSettings(next);
    set({ settings: next });
    if (next.sound) sfx.tick();
  },

  toggleMotion: () => {
    const next: Settings = { ...get().settings, reduceMotion: !get().settings.reduceMotion };
    saveSettings(next);
    set({ settings: next });
  },
}));

type Set = (partial: Partial<TeamGameState>) => void;
type Get = () => TeamGameState;

/** Mark the tile played and either return to the board or advance the game. */
function advanceAfterTile(teams: Team[], activeTeam: number, set: Set, get: Get): void {
  const s = get();
  const board = s.board;
  if (!board || !s.set) return;
  const playedTileIds = [...s.playedTileIds, s.currentTileId as string];
  const allPlayed = board.tiles.every((t) => playedTileIds.includes(t.id));

  if (!allPlayed) {
    set({ teams, activeTeam, playedTileIds, phase: "board", currentTileId: null, revealed: false });
    return;
  }

  const totalRounds = gameRoundCount(s.set);
  const nextIndex = s.roundIndex + 1;
  if (nextIndex < totalRounds) {
    const nextBoard = boardForRound(s.set, nextIndex, s.seed);
    sfx.chime();
    set({
      teams, activeTeam, playedTileIds: [], board: nextBoard, roundIndex: nextIndex,
      phase: "board", currentTileId: null, revealed: false,
    });
  } else if (s.set.final) {
    const finalClue = pickFinalForGame(s.set, s.seed);
    sfx.chime();
    set({
      teams, activeTeam, playedTileIds, finalClue,
      phase: "final-wager", currentTileId: null, revealed: false,
      wagers: teams.map((t) => Math.max(0, t.score)),
    });
  } else {
    // no final round in this game — straight to the podium
    const records = { ...s.records, gamesPlayed: s.records.gamesPlayed + 1 };
    saveRecords(records);
    sfx.fanfare();
    set({ teams, activeTeam, playedTileIds, records, phase: "winner", currentTileId: null });
  }
}
