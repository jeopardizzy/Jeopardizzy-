import { create } from "zustand";
import { quizData } from "../data/quizData";
import { CATEGORY_TYPES, type TaskType } from "../data/categoryTypes";
import { isCorrect } from "../lib/answerMatch";
import { mulberry32, randomSeed, shuffle } from "../lib/random";
import { loadRecords, saveRecords, type Records } from "../lib/saves";
import { sfx } from "../audio/sound";

export type Level = "all" | "easy" | "medium" | "hard";
export type WorkbookPhase = "pick" | "test" | "results";

export interface TestQuestion {
  categoryName: string;
  clue: string;
  answer: string;
}

export interface TestResult {
  question: TestQuestion;
  given: string;
  correct: boolean;
}

const TEST_LENGTH = 10;

interface WorkbookState {
  phase: WorkbookPhase;
  type: TaskType | "all";
  level: Level;
  questions: TestQuestion[];
  index: number;
  results: TestResult[];
  feedback: { correct: boolean; answer: string } | null;
  records: Records;

  pick: (type: TaskType | "all", level: Level) => void;
  startTest: () => void;
  answerCurrent: (text: string) => void;
  nextQuestion: () => void;
  quit: () => void;
}

const LEVEL_TIERS: Record<Exclude<Level, "all">, number[]> = {
  easy: [1],
  medium: [2],
  hard: [3],
};

/** Pool of clues for a type + level filter. */
export function workbookPool(type: TaskType | "all", level: Level): TestQuestion[] {
  const out: TestQuestion[] = [];
  for (const cat of quizData.categories) {
    const catType = CATEGORY_TYPES[cat.name] ?? "knowledge";
    if (type !== "all" && catType !== type) continue;
    if (level !== "all" && !LEVEL_TIERS[level].includes(cat.difficulty)) continue;
    for (const c of cat.clues) {
      out.push({ categoryName: cat.name, clue: c.clue, answer: c.answer });
    }
  }
  return out;
}

export const useWorkbookStore = create<WorkbookState>((set, get) => ({
  phase: "pick",
  type: "all",
  level: "all",
  questions: [],
  index: 0,
  results: [],
  feedback: null,
  records: typeof window === "undefined"
    ? { version: 1, gamesPlayed: 0, workbookBests: {} }
    : loadRecords(),

  pick: (type, level) => set({ type, level }),

  startTest: () => {
    const s = get();
    const pool = workbookPool(s.type, s.level);
    if (pool.length === 0) return;
    const rng = mulberry32(randomSeed());
    const questions = shuffle([...pool], rng).slice(0, TEST_LENGTH);
    sfx.chime();
    set({ phase: "test", questions, index: 0, results: [], feedback: null });
  },

  answerCurrent: (text) => {
    const s = get();
    if (s.phase !== "test" || s.feedback) return;
    const q = s.questions[s.index];
    if (!q) return;
    const correct = isCorrect(text, q.answer);
    if (correct) sfx.ding();
    else sfx.buzz();
    set({
      results: [...s.results, { question: q, given: text, correct }],
      feedback: { correct, answer: q.answer },
    });
  },

  nextQuestion: () => {
    const s = get();
    if (!s.feedback) return;
    const nextIndex = s.index + 1;
    if (nextIndex < s.questions.length) {
      set({ index: nextIndex, feedback: null });
      return;
    }
    // test finished — persist best score
    const correctCount = s.results.filter((r) => r.correct).length;
    const key = `${s.type}|${s.level}`;
    const best = Math.max(s.records.workbookBests[key] ?? 0, correctCount);
    const records = { ...s.records, workbookBests: { ...s.records.workbookBests, [key]: best } };
    saveRecords(records);
    sfx.fanfare();
    set({ phase: "results", feedback: null, records });
  },

  quit: () => set({ phase: "pick", questions: [], results: [], feedback: null }),
}));
