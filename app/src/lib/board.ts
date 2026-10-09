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
    return round === 1 ? c.difficulty === 1 : c.difficulty >= 2;
  });
}

/** A long or list-style answer is painful to type — better for reveal play. */
function isTypeable(answer: string): boolean {
  return answer.split(" ").length <= 5 && (answer.match(/,/g) ?? []).length < 2;
}

/**
 * Pick 5 clues from a category, preserving the source order (clues are
 * curated easy → hard, so position maps to point value). Prefers typeable
 * answers; falls back to the full set when a category needs them.
 */
function pickClues(cat: Category, rng: () => number) {
  const clues = cat.clues;
  const typeable = clues.filter((c) => isTypeable(c.answer));
  const source = typeable.length >= CLUES_PER_CATEGORY ? typeable : clues;
  if (source.length <= CLUES_PER_CATEGORY) return [...source];
  // seeded starting offset for the stride
  const span = source.length - CLUES_PER_CATEGORY + 1;
  const start = Math.floor(rng() * span);
  const step = (source.length - start) / CLUES_PER_CATEGORY;
  const picked = [];
  for (let i = 0; i < CLUES_PER_CATEGORY; i++) {
    picked.push(source[Math.min(source.length - 1, Math.floor(start + i * step))]);
  }
  return picked;
}

/** Base name without trailing roman numerals — used to keep one family per board. */
function family(name: string): string {
  return name.replace(/\s+(II|III|IV|V|VI)$/, "");
}

/**
 * Build a deterministic board for a seed. Round 1 draws from the easiest
 * tier; round 2 ("Double Quizzical") draws from tiers 2–3 with doubled
 * values and never repeats a category already seen in this game.
 */
export function generateRound(
  data: QuizData,
  seed: number,
  round: 1 | 2,
  excludeCategoryIds: string[] = [],
): Board {
  const rng = mulberry32(seed ^ (round === 1 ? 0x9e3779b9 : 0x85ebca6b));
  const exclude = new Set(excludeCategoryIds);
  let pool = eligible(data, round).filter((c) => !exclude.has(c.id));
  if (pool.length < CATEGORY_COUNT) {
    // extreme safety valve: relax the exclusion rather than crash a game
    pool = eligible(data, round);
  }
  if (pool.length < CATEGORY_COUNT) {
    throw new Error(`Not enough eligible categories for round ${round}`);
  }
  shuffle(pool, rng);
  // one category family per board (no "Homonyms" + "Homonyms II" together)
  const picked: Category[] = [];
  const usedFamilies = new Set<string>();
  for (const c of pool) {
    const f = family(c.name);
    if (usedFamilies.has(f)) continue;
    usedFamilies.add(f);
    picked.push(c);
    if (picked.length === CATEGORY_COUNT) break;
  }
  if (picked.length < CATEGORY_COUNT) {
    for (const c of pool) {
      if (!picked.includes(c)) picked.push(c);
      if (picked.length === CATEGORY_COUNT) break;
    }
  }
  const values = ROUND_VALUES[round];
  const tiles: BoardTile[] = [];
  picked.forEach((cat, ci) => {
    const clues = pickClues(cat, rng);
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
