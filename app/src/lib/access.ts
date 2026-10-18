import type { GameDef } from "../data/games";
import type { Level } from "../store/workbookStore";

/**
 * What the free tier includes; everything else needs the Full Club unlock.
 * Free: the Daily Board, one game per series, all guides, and Easy workbook
 * tests for every puzzle type. Pure rules — no store or platform access here.
 */

/** Store product id, identical on the App Store and Google Play. */
export const FULL_CLUB_PRODUCT_ID = "full_club";

/** Free games (or the free first part of a split game), by playable id. */
export const FREE_GAME_IDS: ReadonlySet<string> = new Set([
  "first-words",
  "idiom-arena-1-part-1",
  "classic-wordplay",
  "classic-wordplay-part-1",
]);

export function isGameFree(game: Pick<GameDef, "id" | "daily">): boolean {
  return Boolean(game.daily) || FREE_GAME_IDS.has(game.id);
}

export function canPlayGame(game: Pick<GameDef, "id" | "daily">, fullClub: boolean): boolean {
  return fullClub || isGameFree(game);
}

export const FREE_WORKBOOK_LEVEL: Level = "easy";

export function isLevelFree(level: Level): boolean {
  return level === FREE_WORKBOOK_LEVEL;
}

export function canUseLevel(level: Level, fullClub: boolean): boolean {
  return fullClub || isLevelFree(level);
}

/** "Practice these" drills pull clues from every board, so they are Full Club. */
export function canDrill(fullClub: boolean): boolean {
  return fullClub;
}
