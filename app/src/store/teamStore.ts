import { create } from "zustand";
import type { Board, FinalClue } from "../lib/schema";
import {
  boardForRound,
  buildDailyBoard,
  gameRoundCount,
  lightningValue,
  listPlayableGames,
  materializeGame,
  pickFinalForGame,
  pickLightningClues,
  type LightningClue,
} from "../lib/board";
import { awardPoints, missPenalty } from "../lib/scoring";
import { randomSeed, dailySeed } from "../lib/random";
import type { GameDef } from "../data/games";
import type { Records, Settings } from "../lib/saves";
import { useSaves } from "./savesStore";
import { setSoundMuted, sfx } from "../audio/sound";
import { say, setVoiceEnabled, stopVoice } from "../audio/voice";
import {
  aggregateCategoryStats,
  mergeCategoryStats,
  type TileOutcome,
} from "../lib/stats";

export type TeamPhase =
  | "sets"
  | "setup"
  | "board"
  | "clue"
  | "lightning"
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

/** The timed round after the last board (when the Lightning round mode is on). */
export interface LightningState {
  clues: LightningClue[];
  /** points per clue */
  value: number;
  index: number;
  revealed: boolean;
  /** team that got the current clue, null = nobody yet */
  winnerId: number | null;
}

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
  /** teams charged the wrong-answer penalty on the open clue */
  penalized: number[];
  lightning: LightningState | null;
  teams: Team[];
  /** whose turn it is to pick a tile */
  activeTeam: number;
  /** play the final wager round after the last board (default: game's own rule) */
  finalEnabled: boolean;
  wagers: number[];
  finalMarks: (boolean | null)[];
  /** the game was ended early via the Finish-game button */
  earlyFinished: boolean;
  /** per-tile outcomes this game (category + awarded/nobody) for training stats */
  outcomes: TileOutcome[];
  settings: Settings;
  records: Records;

  selectSet: (setId: string) => void;
  backToSets: () => void;
  setFinalEnabled: (v: boolean) => void;
  setWrongPenalty: (v: boolean) => void;
  setLightning: (v: boolean) => void;
  setPhones: (v: boolean) => void;
  startGame: (names: string[]) => void;
  openTile: (tileId: string) => void;
  revealClue: () => void;
  awardTo: (teamId: number) => void;
  noAward: () => void;
  /** a wrong answer checked on the card; costs the tile value when the penalty mode is on */
  missed: (teamId: number) => void;
  /** lightning round: this team got it (shows the answer) */
  lightningAward: (teamId: number) => void;
  /** lightning round: time's up or nobody knows — show the answer */
  lightningReveal: (timeUp?: boolean) => void;
  lightningNext: () => void;
  setWager: (teamId: number, wager: number) => void;
  revealFinal: () => void;
  markFinal: (teamId: number, correct: boolean) => void;
  finishGame: () => void;
  /** leave the game before the last board: to the final (if enabled) or straight to results */
  endGameEarly: (mode: "final" | "results") => void;
  playAgain: () => void;
  toggleSound: () => void;
  toggleMotion: () => void;
  toggleVoice: () => void;
  /** quizmaster reads the open clue again */
  repeatClue: () => void;
}

const initialSettings: Settings = useSaves.getState().settings;
setSoundMuted(!initialSettings.sound);
setVoiceEnabled(initialSettings.voice !== false);

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
  penalized: [],
  lightning: null,
  teams: [],
  activeTeam: 0,
  finalEnabled: true,
  wagers: [],
  finalMarks: [],
  earlyFinished: false,
  outcomes: [],
  settings: initialSettings,
  records: useSaves.getState().records,

  selectSet: (setId) => {
    const found = listPlayableGames().find((s) => s.id === setId);
    if (!found) return;
    sfx.tick();
    // toggle starts at the game's own default, unless the player overrode it before
    const override = get().settings.finalWager;
    set({ set: found, phase: "setup", finalEnabled: override ?? found.final });
  },

  backToSets: () => set({ phase: "sets", set: null, board: null, teams: [] }),

  setFinalEnabled: (v) => {
    useSaves.getState().patchSettings({ finalWager: v });
    set({ finalEnabled: v });
  },

  setWrongPenalty: (v) => {
    useSaves.getState().patchSettings({ wrongPenalty: v });
  },

  setLightning: (v) => {
    useSaves.getState().patchSettings({ lightning: v });
  },

  setPhones: (v) => {
    useSaves.getState().patchSettings({ phones: v });
  },

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
    const game = materializeGame(s.set, seed);
    const board = game.daily ? buildDailyBoard(dailySeed()) : boardForRound(game, 0, seed);
    useSaves.getState().patchSettings({ teamNames: teams.map((t) => t.name) });
    sfx.chime();
    say({ line: game.daily ? "dailyBoard" : "newGame" });
    set({
      phase: "board",
      seed,
      set: game,
      roundIndex: 0,
      board,
      playedTileIds: [],
      currentTileId: null,
      revealed: false,
      penalized: [],
      lightning: null,
      teams,
      activeTeam: 0,
      wagers: teams.map(() => 0),
      finalMarks: teams.map(() => null),
      earlyFinished: false,
      outcomes: [],
    });
  },

  openTile: (tileId) => {
    const s = get();
    if (s.phase !== "board" || s.playedTileIds.includes(tileId)) return;
    sfx.flip();
    const tile = s.board?.tiles.find((t) => t.id === tileId);
    if (tile) say({ kind: "clue", text: tile.clue });
    set({ phase: "clue", currentTileId: tileId, revealed: false, penalized: [] });
  },

  revealClue: () => {
    const s = get();
    if (s.phase !== "clue") return;
    sfx.tick();
    const tile = s.board?.tiles.find((t) => t.id === s.currentTileId);
    if (tile) say({ line: "answerIs" }, { kind: "answer", text: tile.answer });
    set({ revealed: true });
  },

  repeatClue: () => {
    const s = get();
    if (s.phase === "clue") {
      const tile = s.board?.tiles.find((t) => t.id === s.currentTileId);
      if (tile) say({ kind: "clue", text: tile.clue });
    } else if (s.phase === "final-clue" && s.finalClue) {
      say({ kind: "clue", text: s.finalClue.clue });
    }
  },

  awardTo: (teamId) => {
    const s = get();
    if (s.phase !== "clue" || !s.revealed || !s.board) return;
    const tile = s.board.tiles.find((t) => t.id === s.currentTileId);
    if (!tile) return;
    stopVoice();
    sfx.ding();
    const points = awardPoints(tile.value, s.penalized.includes(teamId));
    const teams = s.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + points } : t));
    const outcomes = [
      ...s.outcomes,
      { categoryName: tile.categoryName, value: tile.value, awarded: true },
    ];
    set({ outcomes });
    advanceAfterTile(teams, teamId, set, get);
  },

  noAward: () => {
    const s = get();
    if (s.phase !== "clue" || !s.revealed || !s.board) return;
    const tile = s.board.tiles.find((t) => t.id === s.currentTileId);
    stopVoice();
    sfx.buzz();
    const outcomes = tile
      ? [...s.outcomes, { categoryName: tile.categoryName, value: tile.value, awarded: false }]
      : s.outcomes;
    set({ outcomes });
    const next = (s.activeTeam + 1) % s.teams.length;
    advanceAfterTile(s.teams, next, set, get);
  },

  missed: (teamId) => {
    const s = get();
    if (s.phase !== "clue" || s.revealed) return;
    const tile = s.board?.tiles.find((t) => t.id === s.currentTileId);
    if (!tile) return;
    const cost = missPenalty(s.settings.wrongPenalty === true, tile.value, s.penalized.includes(teamId));
    if (cost === 0) return;
    set({
      teams: s.teams.map((t) => (t.id === teamId ? { ...t, score: t.score - cost } : t)),
      penalized: [...s.penalized, teamId],
    });
  },

  lightningAward: (teamId) => {
    const s = get();
    const l = s.lightning;
    if (s.phase !== "lightning" || !l || l.winnerId !== null) return;
    sfx.ding();
    say({ kind: "answer", text: l.clues[l.index].answer });
    set({
      teams: s.teams.map((t) => (t.id === teamId ? { ...t, score: t.score + l.value } : t)),
      lightning: { ...l, revealed: true, winnerId: teamId },
    });
  },

  lightningReveal: (timeUp = false) => {
    const s = get();
    const l = s.lightning;
    if (s.phase !== "lightning" || !l || l.revealed) return;
    if (timeUp) sfx.buzz();
    else sfx.tick();
    say({ line: timeUp ? "timeUp" : "answerIs" }, { kind: "answer", text: l.clues[l.index].answer });
    set({ lightning: { ...l, revealed: true } });
  },

  lightningNext: () => {
    const s = get();
    const l = s.lightning;
    if (s.phase !== "lightning" || !l || !l.revealed) return;
    stopVoice();
    const index = l.index + 1;
    if (index < l.clues.length) {
      sfx.flip();
      say({ kind: "clue", text: l.clues[index].clue });
      set({ lightning: { ...l, index, revealed: false, winnerId: null } });
      return;
    }
    afterBoards(s.teams, s.activeTeam, s.playedTileIds, true, set, get);
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
    const s = get();
    if (s.phase !== "final-clue") return;
    sfx.tick();
    if (s.finalClue) say({ line: "answerIs" }, { kind: "answer", text: s.finalClue.answer });
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
    recordGame(s.outcomes);
    sfx.fanfare();
    say({ line: winnerLine(s.teams) });
    set({ phase: "winner" });
  },

  endGameEarly: (mode) => {
    const s = get();
    // only from the board between clues — never while a clue window is open
    if (s.phase !== "board" || !s.set) return;
    if (mode === "final" && s.finalEnabled) {
      const finalClue = pickFinalForGame(s.set, s.seed);
      sfx.chime();
      say({ line: "finalRound" });
      set({
        phase: "final-wager",
        finalClue,
        earlyFinished: true,
        currentTileId: null,
        revealed: false,
        wagers: s.teams.map((t) => Math.max(0, t.score)),
      });
      return;
    }
    recordGame(s.outcomes);
    sfx.fanfare();
    say({ line: winnerLine(s.teams) });
    set({ phase: "winner", earlyFinished: true, currentTileId: null });
  },

  playAgain: () => {
    set({ phase: "sets", set: null, board: null, teams: [], finalClue: null, earlyFinished: false });
  },

  toggleSound: () => {
    const next = useSaves.getState().patchSettings({ sound: !useSaves.getState().settings.sound });
    setSoundMuted(!next.sound);
    if (next.sound) sfx.tick();
  },

  toggleMotion: () => {
    useSaves.getState().patchSettings({ reduceMotion: !useSaves.getState().settings.reduceMotion });
  },

  toggleVoice: () => {
    const on = useSaves.getState().settings.voice === false;
    useSaves.getState().patchSettings({ voice: on });
    setVoiceEnabled(on);
  },
}));

// mirror the shared saves, so screens can keep reading s.settings / s.records here
useSaves.subscribe(({ settings, records }) => useTeamStore.setState({ settings, records }));

/** "And we have a winner!" unless the top score is shared. */
function winnerLine(teams: Team[]): "winner" | "tie" {
  const top = Math.max(...teams.map((t) => t.score));
  return teams.filter((t) => t.score === top).length > 1 ? "tie" : "winner";
}

type Set = (partial: Partial<TeamGameState>) => void;
type Get = () => TeamGameState;

/** Fold the finished game's per-category stats into the all-time record (the current saved one). */
function recordGame(outcomes: TileOutcome[]): Records {
  const gameStats = aggregateCategoryStats(outcomes);
  return useSaves.getState().updateRecords((r) => ({
    ...r,
    gamesPlayed: r.gamesPlayed + 1,
    categoryStats: mergeCategoryStats(r.categoryStats ?? {}, gameStats),
  }));
}

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
  } else {
    afterBoards(teams, activeTeam, playedTileIds, false, set, get);
  }
}

/** After the last board: the lightning round (if on and not played yet), the final, or the podium. */
function afterBoards(
  teams: Team[],
  activeTeam: number,
  playedTileIds: string[],
  lightningDone: boolean,
  set: Set,
  get: Get,
): void {
  const s = get();
  if (!s.set) return;
  if (!lightningDone && s.settings.lightning === true) {
    const clues = pickLightningClues(s.set, s.seed);
    if (clues.length > 0) {
      sfx.chime();
      say({ line: "lightningRound" }, { kind: "clue", text: clues[0].clue });
      set({
        teams, activeTeam, playedTileIds,
        phase: "lightning", currentTileId: null, revealed: false,
        lightning: { clues, value: lightningValue(s.set), index: 0, revealed: false, winnerId: null },
      });
      return;
    }
  }
  if (s.finalEnabled) {
    const finalClue = pickFinalForGame(s.set, s.seed);
    sfx.chime();
    say({ line: "finalRound" });
    set({
      teams, activeTeam, playedTileIds, finalClue, lightning: null,
      phase: "final-wager", currentTileId: null, revealed: false,
      wagers: teams.map((t) => Math.max(0, t.score)),
    });
  } else {
    // no final round in this game — straight to the podium
    recordGame(s.outcomes);
    sfx.fanfare();
    say({ line: winnerLine(teams) });
    set({ teams, activeTeam, playedTileIds, lightning: null, phase: "winner", currentTileId: null });
  }
}
