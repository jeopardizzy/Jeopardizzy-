import type { Board, BoardTile, Category, FinalClue, QuizData } from "./schema";
import { mulberry32, shuffle } from "./random";
import type { SetDef } from "../data/sets";

const CLUES_PER_CATEGORY = 5;

const ROUND_VALUES: Record<1 | 2, number[]> = {
  1: [100, 200, 300, 400, 500],
  2: [200, 400, 600, 800, 1000],
};

/**
 * Pick 5 clues from a category, preserving the source order (curated
 * easy → hard, so position maps to point value). Prefers answers that are
 * reasonable to say aloud; stride-samples when a category has extras.
 */
function pickClues(cat: Category, rng: () => number) {
  const clues = cat.clues;
  if (clues.length <= CLUES_PER_CATEGORY) return [...clues];
  const span = clues.length - CLUES_PER_CATEGORY + 1;
  const start = Math.floor(rng() * span);
  const step = (clues.length - start) / CLUES_PER_CATEGORY;
  const picked = [];
  for (let i = 0; i < CLUES_PER_CATEGORY; i++) {
    picked.push(clues[Math.min(clues.length - 1, Math.floor(start + i * step))]);
  }
  return picked;
}

function findCategory(data: QuizData, name: string): Category {
  const cat = data.categories.find((c) => c.name === name);
  if (!cat) throw new Error(`Set references unknown category: ${name}`);
  return cat;
}

/** Build a board from the set's explicit category list. */
export function boardFromSet(
  data: QuizData,
  set: SetDef,
  round: 1 | 2,
  seed: number,
): Board {
  const rng = mulberry32(seed ^ (round === 1 ? 0x9e3779b9 : 0x85ebca6b));
  const names = round === 1 ? set.round1 : set.round2;
  const cats = names.map((n) => findCategory(data, n));
  const values = ROUND_VALUES[round];
  const tiles: BoardTile[] = [];
  cats.forEach((cat, ci) => {
    const clues = pickClues(cat, rng);
    if (clues.length < CLUES_PER_CATEGORY) {
      throw new Error(`Category "${cat.name}" has only ${clues.length} clues`);
    }
    clues.forEach((c, ri) => {
      tiles.push({
        id: `${set.id}-r${round}-c${ci}-v${values[ri]}`,
        categoryId: cat.id,
        categoryName: cat.name,
        value: values[ri],
        clue: c.clue,
        answer: c.answer,
      });
    });
  });
  return {
    round,
    categories: cats.map((c) => ({ id: c.id, name: c.name })),
    tiles,
  };
}

/** Final-round clue from a category outside the set's two boards. */
export function pickFinalForSet(data: QuizData, set: SetDef, seed: number): FinalClue {
  const rng = mulberry32(seed ^ 0xc2b2ae35);
  const used = new Set([...set.round1, ...set.round2]);
  const pool = shuffle(data.categories.filter((c) => !used.has(c.name)), rng);
  const cat = pool[0] ?? data.categories[0];
  const clue = cat.clues[Math.floor(rng() * cat.clues.length)];
  return { categoryName: cat.name, clue: clue.clue, answer: clue.answer };
}
