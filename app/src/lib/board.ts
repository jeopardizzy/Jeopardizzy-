import type { Board, BoardTile, Clue, FinalClue } from "./schema";
import { mulberry32 } from "./random";
import { quizData } from "../data/quizData";
import { UOE_GAMES } from "../data/uoeGames";
import type { GameDef } from "../data/games";

const BASE_VALUES = [100, 200, 300, 400, 500];

export interface RoundCategory {
  id: string;
  name: string;
  clues: Clue[];
}

/** Total number of boards in a game. */
export function gameRoundCount(game: GameDef): number {
  return game.bookRounds.length + game.uoeRounds.length;
}

/** Resolve a round's categories (book dataset or UoE idiom board). */
export function getRoundCategories(game: GameDef, roundIndex: number): RoundCategory[] {
  if (roundIndex < game.bookRounds.length) {
    return game.bookRounds[roundIndex].map((name) => {
      const cat = quizData.categories.find((c) => c.name === name);
      if (!cat) throw new Error(`Game ${game.id} references unknown category: ${name}`);
      return { id: cat.id, name: cat.name, clues: [...cat.clues] };
    });
  }
  const uoeId = game.uoeRounds[roundIndex - game.bookRounds.length];
  const uoe = UOE_GAMES.find((g) => g.id === uoeId);
  if (!uoe) throw new Error(`Game ${game.id} references unknown UoE round: ${uoeId}`);
  return uoe.categories.map((c, i) => ({
    id: `${uoeId}-${i}`,
    name: c.name,
    clues: c.clues,
  }));
}

/**
 * Pick 5 clues from a category, preserving the source order (curated
 * easy → hard). Stride-samples when a category has extras.
 */
function pickClues(clues: Clue[], rng: () => number): Clue[] {
  if (clues.length <= 5) return [...clues];
  const span = clues.length - 5 + 1;
  const start = Math.floor(rng() * span);
  const step = (clues.length - start) / 5;
  const picked: Clue[] = [];
  for (let i = 0; i < 5; i++) {
    picked.push(clues[Math.min(clues.length - 1, Math.floor(start + i * step))]);
  }
  return picked;
}

/** Build the board for one round. Values escalate: round N uses N × (100..500). */
export function boardForRound(game: GameDef, roundIndex: number, seed: number): Board {
  const rng = mulberry32(seed ^ Math.imul(roundIndex + 1, 0x9e3779b9));
  const cats = getRoundCategories(game, roundIndex);
  const mult = roundIndex + 1;
  const values = BASE_VALUES.map((v) => v * mult);
  const tiles: BoardTile[] = [];
  cats.forEach((cat, ci) => {
    const clues = pickClues(cat.clues, rng);
    if (clues.length < 5) {
      throw new Error(`Category "${cat.name}" has only ${clues.length} clues`);
    }
    clues.forEach((c, ri) => {
      tiles.push({
        id: `${game.id}-r${roundIndex}-c${ci}-v${values[ri]}`,
        categoryId: cat.id,
        categoryName: cat.name,
        value: values[ri],
        clue: c.clue,
        answer: c.answer,
      });
    });
  });
  return {
    round: roundIndex + 1,
    categories: cats.map((c) => ({ id: c.id, name: c.name })),
    tiles,
  };
}

/** Final-round clue from a dataset category not used in this game's book rounds. */
export function pickFinalForGame(game: GameDef, seed: number): FinalClue {
  const rng = mulberry32(seed ^ 0xc2b2ae35);
  const used = new Set(game.bookRounds.flat());
  const pool = quizData.categories.filter((c) => !used.has(c.name));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const cat = shuffled[0] ?? quizData.categories[0];
  const clue = cat.clues[Math.floor(rng() * cat.clues.length)];
  return { categoryName: cat.name, clue: clue.clue, answer: clue.answer };
}
