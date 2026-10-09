import { create } from "zustand";
import type { Board, FinalClue } from "../lib/schema";
import { quizData } from "../data/quizData";
import { generateRound, pickFinal } from "../lib/board";
import { dailySeed, randomSeed } from "../lib/random";
import { isCorrect } from "../lib/answerMatch";
import {
  DEFAULT_RECORDS,
  loadRecords,
  loadSettings,
  saveRecords,
  saveSettings,
  type Records,
  type Settings,
} from "../lib/saves";
import { setSoundMuted, sfx } from "../audio/sound";

export type GameMode = "classic" | "daily";
export type Phase = "idle" | "board" | "clue" | "final-wager" | "final-clue" | "results";

export type Feedback =
  | { kind: "correct"; answer: string }
  | { kind: "wrong"; answer: string }
  | { kind: "revealed"; answer: string }
  | null;

interface GameState {
  phase: Phase;
  mode: GameMode;
  seed: number;
  round: 1 | 2;
  board: Board | null;
  finalClue: FinalClue | null;
  playedTileIds: string[];
  currentTileId: string | null;
  score: number;
  streak: number;
  bestStreakThisGame: number;
  correctCount: number;
  answeredCount: number;
  wager: number;
  feedback: Feedback;
  settings: Settings;
  records: Records;

  startGame: (mode: GameMode) => void;
  openClue: (tileId: string) => void;
  submitAnswer: (text: string) => void;
  revealAnswer: () => void;
  selfGrade: (correct: boolean) => void;
  closeClue: () => void;
  setWager: (n: number) => void;
  beginFinalClue: () => void;
  submitFinal: (text: string) => void;
  revealFinal: () => void;
  selfGradeFinal: (correct: boolean) => void;
  quitToMenu: () => void;
  toggleSound: () => void;
  toggleMotion: () => void;
}

const DEFAULT_SETTINGS_FALLBACK: Settings = { version: 1, sound: true, reduceMotion: false };

const initialSettings: Settings =
  typeof window === "undefined" ? DEFAULT_SETTINGS_FALLBACK : loadSettings();
setSoundMuted(!initialSettings.sound);

export const useGameStore = create<GameState>((set, get) => ({
  phase: "idle",
  mode: "classic",
  seed: 0,
  round: 1,
  board: null,
  finalClue: null,
  playedTileIds: [],
  currentTileId: null,
  score: 0,
  streak: 0,
  bestStreakThisGame: 0,
  correctCount: 0,
  answeredCount: 0,
  wager: 0,
  feedback: null,
  settings: initialSettings,
  records: typeof window === "undefined" ? DEFAULT_RECORDS : loadRecords(),

  startGame: (mode) => {
    const seed = mode === "daily" ? dailySeed() : randomSeed();
    const board = generateRound(quizData, seed, 1);
    sfx.chime();
    set({
      phase: "board",
      mode,
      seed,
      round: 1,
      board,
      finalClue: null,
      playedTileIds: [],
      currentTileId: null,
      score: 0,
      streak: 0,
      bestStreakThisGame: 0,
      correctCount: 0,
      answeredCount: 0,
      wager: 0,
      feedback: null,
    });
  },

  openClue: (tileId) => {
    const { playedTileIds, phase } = get();
    if (phase !== "board" || playedTileIds.includes(tileId)) return;
    sfx.flip();
    set({ phase: "clue", currentTileId: tileId, feedback: null });
  },

  submitAnswer: (text) => {
    const s = get();
    if (s.phase !== "clue" || s.feedback) return;
    const tile = s.board?.tiles.find((t) => t.id === s.currentTileId);
    if (!tile) return;
    applyBoardResult(tile, isCorrect(text, tile.answer), set, get);
  },

  revealAnswer: () => {
    const s = get();
    if (s.phase !== "clue" || s.feedback) return;
    const tile = s.board?.tiles.find((t) => t.id === s.currentTileId);
    if (!tile) return;
    sfx.tick();
    set({ feedback: { kind: "revealed", answer: tile.answer } });
  },

  selfGrade: (correct) => {
    const s = get();
    if (s.phase !== "clue" || s.feedback?.kind !== "revealed") return;
    const tile = s.board?.tiles.find((t) => t.id === s.currentTileId);
    if (!tile) return;
    applyBoardResult(tile, correct, set, get);
  },

  closeClue: () => {
    const s = get();
    if (s.phase !== "clue" || !s.feedback) return; // clue must be resolved first
    const board = s.board;
    if (!board) return;
    const allPlayed = board.tiles.every((t) => s.playedTileIds.includes(t.id));
    if (!allPlayed) {
      set({ phase: "board", currentTileId: null, feedback: null });
      return;
    }
    if (s.round === 1) {
      const board2 = generateRound(quizData, s.seed, 2);
      sfx.chime();
      set({
        phase: "board",
        round: 2,
        board: board2,
        playedTileIds: [],
        currentTileId: null,
        feedback: null,
      });
    } else {
      const used = board.categories.map((c) => c.id);
      const b1 = generateRound(quizData, s.seed, 1);
      used.push(...b1.categories.map((c) => c.id));
      const finalClue = pickFinal(quizData, s.seed, used);
      sfx.chime();
      set({
        phase: "final-wager",
        finalClue,
        wager: Math.max(0, s.score),
        currentTileId: null,
        feedback: null,
      });
    }
  },

  setWager: (n) => {
    const max = Math.max(0, get().score);
    const wager = Math.max(0, Math.min(Number.isFinite(n) ? Math.floor(n) : 0, max));
    set({ wager });
  },

  beginFinalClue: () => {
    if (get().phase !== "final-wager") return;
    sfx.flip();
    set({ phase: "final-clue", feedback: null });
  },

  submitFinal: (text) => {
    const s = get();
    if (s.phase !== "final-clue" || s.feedback || !s.finalClue) return;
    finishWith(isCorrect(text, s.finalClue.answer), s.finalClue.answer, s, set);
  },

  revealFinal: () => {
    const s = get();
    if (s.phase !== "final-clue" || s.feedback || !s.finalClue) return;
    sfx.tick();
    set({ feedback: { kind: "revealed", answer: s.finalClue.answer } });
  },

  selfGradeFinal: (correct) => {
    const s = get();
    if (s.phase !== "final-clue" || s.feedback?.kind !== "revealed" || !s.finalClue) return;
    finishWith(correct, s.finalClue.answer, s, set);
  },

  quitToMenu: () => {
    set({ phase: "idle", board: null, finalClue: null, currentTileId: null, feedback: null });
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

/* ---------- helpers ---------- */

type Set = (partial: Partial<GameState>) => void;
type Get = () => GameState;

function applyBoardResult(
  tile: { id: string; value: number; answer: string },
  correct: boolean,
  set: Set,
  get: Get,
): void {
  const s = get();
  const delta = correct ? tile.value : -tile.value;
  const streak = correct ? s.streak + 1 : 0;
  if (correct) sfx.ding();
  else sfx.buzz();
  set({
    score: s.score + delta,
    streak,
    bestStreakThisGame: Math.max(s.bestStreakThisGame, streak),
    correctCount: s.correctCount + (correct ? 1 : 0),
    answeredCount: s.answeredCount + 1,
    playedTileIds: [...s.playedTileIds, tile.id],
    feedback: { kind: correct ? "correct" : "wrong", answer: tile.answer },
  });
}

function finishWith(correct: boolean, answer: string, s: GameState, set: Set): void {
  const delta = correct ? s.wager : -s.wager;
  const score = s.score + delta;
  const streak = correct ? s.streak + 1 : 0;
  const correctCount = s.correctCount + (correct ? 1 : 0);
  const answeredCount = s.answeredCount + 1;
  if (correct) sfx.ding();
  else sfx.buzz();

  const prev = s.records;
  const records: Records = {
    ...prev,
    bestScore: Math.max(prev.bestScore, score),
    bestStreak: Math.max(prev.bestStreak, streak, s.bestStreakThisGame),
    gamesPlayed: prev.gamesPlayed + 1,
    totalCorrect: prev.totalCorrect + correctCount,
    totalAnswered: prev.totalAnswered + answeredCount,
    dailyScores:
      s.mode === "daily"
        ? { ...prev.dailyScores, [new Date().toISOString().slice(0, 10)]: score }
        : prev.dailyScores,
  };
  saveRecords(records);
  set({
    score,
    streak,
    bestStreakThisGame: Math.max(s.bestStreakThisGame, streak),
    correctCount,
    answeredCount,
    records,
    feedback: { kind: correct ? "correct" : "wrong", answer },
  });
  window.setTimeout(() => {
    sfx.fanfare();
    set({ phase: "results" });
  }, 1400);
}
