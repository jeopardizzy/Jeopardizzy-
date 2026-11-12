import type { GameDef } from "../data/games";
import type { Level } from "../store/workbookStore";

/**
 * What the free tier includes; everything else needs the Full Club unlock.
 * Free: the Daily Board, one game per series, all guides, and Easy workbook
 * tests for every puzzle type. Pure rules — no store or platform access here.
 */

/** Store product id, identical on the App Store and Google Play. */
export const FULL_CLUB_PRODUCT_ID = "full_club";

/**
 * The free week. On the App Store it is a free non-consumable named
 * "7-Day Trial" (guideline 3.1.1), so the start date lives with the Apple ID;
 * Google Play has no free one-time products, so Android keeps it on the device.
 */
export const TRIAL_PRODUCT_ID = "trial_7_day";
export const TRIAL_DAYS = 7;
export const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

/** Whole days left, rounded up: 6 days 2 hours is "7 days left". */
export function trialDaysLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / (24 * 60 * 60 * 1000)));
}

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
