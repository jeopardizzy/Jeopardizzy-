/** Shared shape for standalone clue boards (UoE series, classic sets, arena mixes). */
export interface BoardClue {
  clue: string;
  answer: string;
  /** optional host note shown with the revealed answer */
  note?: string;
}

export interface BoardCategory {
  name: string;
  clues: BoardClue[];
}

export interface BoardGame {
  id: string;
  title: string;
  /** series letter for UoE games (e.g. "H"); absent for legacy/arena boards */
  letter?: string;
  categories: BoardCategory[];
}
