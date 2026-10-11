import { expect, test } from "@playwright/test";
import { GAMES } from "../src/data/games";
import { gameRoundCount, getRoundCategories } from "../src/lib/board";

/**
 * Every game on the site, played from first tile to the podium.
 * One tile per game goes through the real UI; the rest run through the
 * store test hook (localhost only) via the same actions the UI dispatches.
 * The exact final score is computed independently from the game definition
 * and compared against what the team actually earned.
 */

/** Expected board total for one team taking everything: sum of all tile values. */
function expectedBoardTotal(gameId: string): number {
  const g = GAMES.find((x) => x.id === gameId)!;
  let total = 0;
  for (let r = 0; r < gameRoundCount(g); r++) {
    const cols = getRoundCategories(g, r).length;
    total += cols * 1500 * (r + 1); // values are (100..500) x (r+1) per column
  }
  return total;
}

test.describe("every game plays to completion", () => {
  for (const game of GAMES) {
    test(`${game.name}: all boards → podium with exact score`, async ({ page }) => {
      const rounds = gameRoundCount(game);
      const boardTotal = expectedBoardTotal(game.id);
      // final round doubles the take (default wager = full score, marked correct)
      const expectedTotal = game.final ? boardTotal * 2 : boardTotal;
      test.setTimeout(Math.max(60_000, rounds * 20_000));

      await page.goto("/#/sets");
      await page.getByRole("button", { name: `Play ${game.name}`, exact: true }).click();
      await page.getByRole("button", { name: "Start the game" }).click();

      for (let round = 1; round <= rounds; round++) {
        await expect(page.getByText(`Round ${round} of ${rounds}`)).toBeVisible();

        // one tile through the real UI per game
        if (round === 1) {
          await page.locator("[role='gridcell']:not([disabled])").first().click();
          await page.getByRole("button", { name: "Reveal answer" }).click();
          await expect(page.getByText(/The answer is/)).toBeVisible();
          await page.getByRole("button", { name: "Team Sage" }).click();
        }

        await page.evaluate(() => {
          const store = (window as unknown as { __teamStore: any }).__teamStore;
          const ids: string[] = store
            .getState()
            .board.tiles.filter((t: any) => !store.getState().playedTileIds.includes(t.id))
            .map((t: any) => t.id);
          for (const id of ids) {
            store.getState().openTile(id);
            store.getState().revealClue();
            store.getState().awardTo(0);
          }
        });
      }

      if (game.final) {
        // wager screen → lock in → reveal → mark Team Sage correct → crown
        await expect(page.getByText(/Final Quizzical/)).toBeVisible();
        await page.evaluate(() => {
          const store = (window as unknown as { __teamStore: any }).__teamStore;
          store.setState({ phase: "final-clue" });
          store.getState().revealFinal();
          store.getState().markFinal(0, true);
          store.getState().markFinal(1, false);
          store.getState().finishGame();
        });
      }

      await expect(page.getByText(/wins!|tie!/)).toBeVisible({ timeout: 10_000 });
      await expect(
        page.locator("[role='listitem']", { hasText: "Team Sage" }),
      ).toContainText(String(expectedTotal));
    });
  }
});
