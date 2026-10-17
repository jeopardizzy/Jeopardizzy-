import { Capacitor } from "@capacitor/core";
import { InAppReview } from "@capacitor-community/in-app-review";

/**
 * Ask for a store rating at happy moments only: on the podium after the 2nd,
 * 5th and 12th finished team game. The stores decide whether the sheet really
 * appears (Apple shows it at most 3 times a year), so asking more is pointless.
 */
export const REVIEW_AFTER_GAMES: readonly number[] = [2, 5, 12];

export function shouldAskForReview(gamesPlayed: number): boolean {
  return REVIEW_AFTER_GAMES.includes(gamesPlayed);
}

/** Fire-and-forget; never blocks or throws into the UI. Native apps only. */
export function askForReview(): void {
  if (!Capacitor.isNativePlatform()) return;
  InAppReview.requestReview().catch(() => {});
}
