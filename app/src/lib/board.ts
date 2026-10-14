import type { Board, BoardTile, Clue, FinalClue } from "./schema";
import { mulberry32, shuffle } from "./random";
import { quizData } from "../data/quizData";
import { UOE_GAMES } from "../data/uoeGames";
import { LEGACY_BOARDS } from "../data/legacyBoards";
import { ARENA3_BOARDS } from "../data/arena3Boards";
import { ARENA4_BOARDS } from "../data/arena4Boards";
import type { BoardGame } from "../data/boardGames";
import { GAMES, type GameDef } from "../data/games";

const BASE_VALUES = [100, 200, 300, 400, 500];

const ALL_BOARDS = new Map<string, BoardGame>(
  [...UOE_GAMES, ...LEGACY_BOARDS, ...ARENA3_BOARDS, ...ARENA4_BOARDS].map((g) => [g.id, g]),
);

/** Boards that Arena Mix can draw from: all four idiom arenas (21 boards). */
const ARENA_MIX_POOL = [...UOE_GAMES, ...ARENA3_BOARDS, ...ARENA4_BOARDS].map((g) => g.id);

/** All clues for a category name across every standalone board (UoE/legacy/arenas). */
export function boardCluesForCategory(
  name: string,
): { clue: string; answer: string; note?: string }[] {
  const out: { clue: string; answer: string; note?: string }[] = [];
  for (const g of ALL_BOARDS.values()) {
    for (const c of g.categories) {
      if (c.name === name) out.push(...c.clues);
    }
  }
  return out;
}

export const MIX_ROUNDS = 3;

/** Boards per game part — longer games are split into chunks of this size. */
export const MAX_PART_ROUNDS = 3;

/**
 * A mix game has no fixed rounds: sample them from the arena pools at game
 * start. Deterministic per seed so a session stays consistent.
 */
export function materializeGame(game: GameDef, seed: number): GameDef {
  if (!game.mix) return game;
  const rng = mulberry32(seed ^ 0x51ab3);
  const sampled = shuffle([...ARENA_MIX_POOL], rng).slice(0, MIX_ROUNDS);
  return { ...game, boardRounds: sampled };
}

/**
 * Split a game into parts of at most MAX_PART_ROUNDS boards.
 * Games short enough return unchanged (single-element array).
 * Parts keep the parent's series/level/final; values restart at ×1 per part.
 */
export function splitGameIntoParts(game: GameDef): GameDef[] {
  const total = gameRoundCount(game);
  if (total <= MAX_PART_ROUNDS) return [game];
  const partCount = Math.ceil(total / MAX_PART_ROUNDS);
  const parts: GameDef[] = [];
  for (let i = 0; i < partCount; i++) {
    parts.push({
      ...game,
      id: `${game.id}-part-${i + 1}`,
      name: `${game.name} · Part ${i + 1} of ${partCount}`,
      partOf: game.id,
      partIndex: i,
      partCount,
      bookRounds: game.bookRounds.slice(i * MAX_PART_ROUNDS, (i + 1) * MAX_PART_ROUNDS),
      boardRounds: game.boardRounds.slice(i * MAX_PART_ROUNDS, (i + 1) * MAX_PART_ROUNDS),
    });
  }
  return parts;
}

/** All games as presented to players: long games appear as several parts. */
export function listPlayableGames(): GameDef[] {
  return GAMES.flatMap(splitGameIntoParts);
}

export interface RoundCategory {
  id: string;
  name: string;
  clues: { clue: string; answer: string; note?: string }[];
}

/** Total number of boards in a game (mix games always play 3, daily plays 1). */
export function gameRoundCount(game: GameDef): number {
  if (game.daily) return 1;
  return game.mix ? game.boardRounds.length || MIX_ROUNDS : game.bookRounds.length + game.boardRounds.length;
}

/**
 * Daily Jeopardy: one board of 5 categories sampled across every pool
 * (books, UoE, classics), seeded by the UTC calendar day — the same board
 * all day on this device.
 */
export function buildDailyBoard(seed: number): Board {
  const rng = mulberry32(seed);
  const pool: RoundCategory[] = [];
  for (const c of quizData.categories) {
    if (c.clues.length >= 5) pool.push({ id: c.id, name: c.name, clues: [...c.clues] });
  }
  for (const g of ALL_BOARDS.values()) {
    g.categories.forEach((c, i) => pool.push({ id: `${g.id}-${i}`, name: c.name, clues: c.clues }));
  }
  shuffle(pool, rng);
  // distinct category names only — no two same-named columns on the daily board
  const picked: RoundCategory[] = [];
  const usedNames = new Set<string>();
  for (const c of pool) {
    if (usedNames.has(c.name)) continue;
    usedNames.add(c.name);
    picked.push(c);
    if (picked.length === 5) break;
  }
  const tiles: BoardTile[] = [];
  picked.forEach((cat, ci) => {
    pickClues(cat.clues, rng).forEach((c, ri) => {
      tiles.push({
        id: `daily-${ci}-${ri}`,
        categoryId: cat.id,
        categoryName: cat.name,
        value: BASE_VALUES[ri],
        clue: c.clue,
        answer: c.answer,
        ...(c.note ? { note: c.note } : {}),
      });
    });
  });
  return {
    round: 1,
    cols: 5,
    categories: picked.map((c) => ({ id: c.id, name: c.name })),
    tiles,
  };
}

/** Resolve a round's categories (book dataset or a standalone board). */
export function getRoundCategories(game: GameDef, roundIndex: number): RoundCategory[] {
  if (roundIndex < game.bookRounds.length) {
    return game.bookRounds[roundIndex].map((name) => {
      const cat = quizData.categories.find((c) => c.name === name);
      if (!cat) throw new Error(`Game ${game.id} references unknown category: ${name}`);
      return { id: cat.id, name: cat.name, clues: [...cat.clues] };
    });
  }
  const boardId = game.boardRounds[roundIndex - game.bookRounds.length];
  const bg = ALL_BOARDS.get(boardId);
  if (!bg) throw new Error(`Game ${game.id} references unknown board: ${boardId}`);
  return bg.categories.map((c, i) => ({
    id: `${boardId}-${i}`,
    name: c.name,
    clues: c.clues,
  }));
}

/**
 * Pick 5 clues from a category, preserving the source order (curated
 * easy → hard). Stride-samples when a category has extras.
 */
function pickClues<T>(clues: T[], rng: () => number): T[] {
  if (clues.length <= 5) return [...clues];
  const span = clues.length - 5 + 1;
  const start = Math.floor(rng() * span);
  const step = (clues.length - start) / 5;
  const picked: T[] = [];
  for (let i = 0; i < 5; i++) {
    picked.push(clues[Math.min(clues.length - 1, Math.floor(start + i * step))]);
  }
  return picked;
}

/** Build the board for one round. Values escalate: round N uses N × (100..500). */
export function boardForRound(game: GameDef, roundIndex: number, seed: number): Board {
  const rng = mulberry32(seed ^ Math.imul(roundIndex + 1, 0x9e3779b9));
  const cats = getRoundCategories(game, roundIndex);
  const cols = cats.length;
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
        ...(c.note ? { note: c.note } : {}),
      });
    });
  });
  return {
    round: roundIndex + 1,
    cols,
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
  const clue: Clue = cat.clues[Math.floor(rng() * cat.clues.length)];
  return { categoryName: cat.name, clue: clue.clue, answer: clue.answer };
}
