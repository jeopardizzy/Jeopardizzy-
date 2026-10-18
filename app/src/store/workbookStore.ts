import { create } from "zustand";
import { quizData } from "../data/quizData";
import { CATEGORY_TYPES, type TaskType } from "../data/categoryTypes";
import { boardCluesForCategory } from "../lib/board";
import { isCorrect } from "../lib/answerMatch";
import { mulberry32, randomSeed, shuffle } from "../lib/random";
import { loadRecords, loadSettings, saveRecords, saveSettings, type Records, type Settings } from "../lib/saves";
import { sfx } from "../audio/sound";
import { say, stopVoice } from "../audio/voice";

const initialSettings: Settings =
  typeof window === "undefined"
    ? { version: 1, sound: true, reduceMotion: false, teamNames: [] }
    : loadSettings();

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
export const TEST_LENGTHS = [5, 10, 20] as const;

/** Best-score key includes the test length so different lengths never compare. */
export function bestKey(type: string, level: string, count: number): string {
  return `${type}|${level}|${count}`;
}

interface WorkbookState {
  phase: WorkbookPhase;
  type: TaskType | "all";
  level: Level;
  /** chosen test length (5/10/20) */
  questionCount: number;
  /** when set, the test drills these categories (from the winner's drill list) */
  drillCategories: string[] | null;
  questions: TestQuestion[];
  index: number;
  results: TestResult[];
  feedback: { correct: boolean; answer: string } | null;
  records: Records;
  settings: Settings;

  pick: (type: TaskType | "all", level: Level) => void;
  setQuestionCount: (n: number) => void;
  /** enter drill mode with explicit category names (drill list on the podium) */
  startDrill: (categoryNames: string[]) => void;
  clearDrill: () => void;
  startTest: () => void;
  answerCurrent: (text: string) => void;
  nextQuestion: () => void;
  quit: () => void;
  /** remember that the player has seen the microphone explainer and turned spoken answers on */
  enableSpokenAnswers: () => void;
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

/**
 * Pool for a drill test: every clue from the named categories, resolved
 * against both the book dataset and the standalone boards (UoE/legacy/arenas).
 */
export function drillPool(categoryNames: string[]): TestQuestion[] {
  const out: TestQuestion[] = [];
  const seen = new Set<string>();
  const push = (cat: string, clue: string, answer: string) => {
    const k = `${cat}|${clue}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push({ categoryName: cat, clue, answer });
  };
  for (const name of categoryNames) {
    for (const cat of quizData.categories.filter((c) => c.name === name)) {
      for (const cl of cat.clues) push(name, cl.clue, cl.answer);
    }
    for (const cl of boardCluesForCategory(name)) {
      push(name, cl.clue, cl.answer);
    }
  }
  return out;
}

export const useWorkbookStore = create<WorkbookState>((set, get) => ({
  phase: "pick",
  type: "all",
  level: "all",
  questionCount: initialSettings.workbookCount ?? TEST_LENGTH,
  drillCategories: null,
  questions: [],
  index: 0,
  results: [],
  feedback: null,
  records: typeof window === "undefined"
    ? { version: 1, gamesPlayed: 0, workbookBests: {} }
    : loadRecords(),
  settings: initialSettings,

  pick: (type, level) => set({ type, level }),

  setQuestionCount: (n) => {
    if (!TEST_LENGTHS.includes(n as (typeof TEST_LENGTHS)[number])) return;
    const settings = { ...get().settings, workbookCount: n };
    saveSettings(settings);
    set({ questionCount: n, settings });
  },

  startDrill: (categoryNames) => {
    if (categoryNames.length === 0) return;
    sfx.tick();
    set({ drillCategories: categoryNames, phase: "pick" });
  },

  clearDrill: () => set({ drillCategories: null }),

  startTest: () => {
    const s = get();
    const pool = s.drillCategories ? drillPool(s.drillCategories) : workbookPool(s.type, s.level);
    if (pool.length === 0) return;
    const rng = mulberry32(randomSeed());
    const count = Math.min(s.questionCount, pool.length);
    const questions = shuffle([...pool], rng).slice(0, count);
    sfx.chime();
    say({ kind: "clue", text: questions[0].clue });
    set({ phase: "test", questions, index: 0, results: [], feedback: null });
  },

  answerCurrent: (text) => {
    const s = get();
    if (s.phase !== "test" || s.feedback) return;
    const q = s.questions[s.index];
    if (!q) return;
    const correct = isCorrect(text, q.answer);
    stopVoice();
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
      say({ kind: "clue", text: s.questions[nextIndex].clue });
      set({ index: nextIndex, feedback: null });
      return;
    }
    // test finished — persist best score (keyed by type × level × length);
    // drill tests don't record bests (their pools vary)
    const correctCount = s.results.filter((r) => r.correct).length;
    const key = bestKey(s.type, s.level, s.questions.length);
    let records = s.records;
    if (!s.drillCategories) {
      const best = Math.max(s.records.workbookBests[key] ?? 0, correctCount);
      records = { ...s.records, workbookBests: { ...s.records.workbookBests, [key]: best } };
      saveRecords(records);
    }
    sfx.fanfare();
    set({ phase: "results", feedback: null, records });
  },

  quit: () => {
    stopVoice();
    set({ phase: "pick", questions: [], results: [], feedback: null, drillCategories: null });
  },

  enableSpokenAnswers: () => {
    const settings = { ...loadSettings(), spokenAnswers: true };
    saveSettings(settings);
    set({ settings });
  },
}));
