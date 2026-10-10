import { z } from "zod";

/** One clue/answer pair. */
export const ClueSchema = z.object({
  clue: z.string().min(3),
  answer: z.string().min(1),
});
export type Clue = z.infer<typeof ClueSchema>;

/** A quiz category with enough clues to fill a board column. */
export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  clues: z.array(ClueSchema).min(4),
});
export type Category = z.infer<typeof CategorySchema>;

export const QuizDataSchema = z.object({
  categories: z.array(CategorySchema).min(1),
});
export type QuizData = z.infer<typeof QuizDataSchema>;

/** A single cell on the board. */
export interface BoardTile {
  id: string;
  categoryId: string;
  categoryName: string;
  value: number;
  clue: string;
  answer: string;
  /** optional host note shown with the revealed answer */
  note?: string;
}

export interface Board {
  /** 1-based round number within the current game. */
  round: number;
  /** columns on the board (4 or 5, depends on the round's categories) */
  cols: number;
  categories: { id: string; name: string }[];
  /** cols × 5 tiles, column-major, ordered by ascending value. */
  tiles: BoardTile[];
}

export interface FinalClue {
  categoryName: string;
  clue: string;
  answer: string;
}
