import type { Board, BoardTile, Category, FinalClue, QuizData } from "./schema";
import { mulberry32, shuffle } from "./random";

const CATEGORY_COUNT = 5;
const CLUES_PER_CATEGORY = 5;

const ROUND_VALUES: Record<1 | 2, number[]> = {
  1: [100, 200, 300, 400, 500],
  2: [200, 400, 600, 800, 1000],
};

function eligible(data: QuizData, round: 1 | 2): Category[] {
  return data.categories.filter((c) => {
    if (c.clues.length < CLUES_PER_CATEGORY) return false;
    return round === 1 ? c.difficulty <= 2 : c.difficulty >= 2;
  });
}

/**
 * Build a deterministic board for a seed. Round 1 draws from easier
 * categories, round 2 ("Double Quizzical") from harder ones with doubled values.
 */
export function generateRound(data: QuizData, seed: number, round: 1 | 2): Board {
  const rng = mulberry32(seed ^ (round === 1 ? 0x9e3779b9 : 0x85ebca6b));
  const pool = shuffle([...eligible(data, round)], rng);
  if (pool.length < CATEGORY_COUNT) {
    throw new Error(`Not enough eligible categories for round ${round}`);
  }
  const picked = pool.slice(0, CATEGORY_COUNT);
  const values = ROUND_VALUES[round];
  const tiles: BoardTile[] = [];
  picked.forEach((cat, ci) => {
    const clues = shuffle([...cat.clues], rng).slice(0, CLUES_PER_CATEGORY);
    clues.forEach((c, ri) => {
      tiles.push({
        id: `r${round}-c${ci}-v${values[ri]}`,
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
    categories: picked.map((c) => ({ id: c.id, name: c.name })),
    tiles,
  };
}

/** Pick one final-round clue from a category not used on either board. */
export function pickFinal(data: QuizData, seed: number, usedCategoryIds: string[]): FinalClue {
  const rng = mulberry32(seed ^ 0xc2b2ae35);
  const used = new Set(usedCategoryIds);
  const pool = shuffle(
    data.categories.filter((c) => !used.has(c.id) && c.clues.length >= 1),
    rng,
  );
  const cat = pool[0] ?? data.categories[0];
  const clue = cat.clues[Math.floor(rng() * cat.clues.length)];
  return { categoryName: cat.name, clue: clue.clue, answer: clue.answer };
}
