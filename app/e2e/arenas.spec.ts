import { expect, test } from "@playwright/test";

test.describe("Idiom arenas", () => {
  test("arena I offers 5 boards with original category names", async ({ page }) => {
    await page.goto("/#/sets");
    const arena = page.getByRole("button", { name: "Play Idiom Arena I", exact: true });
    await expect(arena).toBeVisible();
    await expect(arena).toContainText("5 boards");
    await expect(arena).toContainText("125 clues");

    await arena.click();
    await page.getByRole("button", { name: "Start the game" }).click();

    // round 1 = Game H categories, values 100–500
    await expect(page.getByText("Finish the Saying")).toBeVisible();
    await expect(page.getByText("Hidden Animals")).toBeVisible();
    await expect(page.locator("[role='gridcell']").first()).toHaveText("100");
    await expect(page.getByText("Round 1 of 5")).toBeVisible();

    // play a clue: idiom answer shows with explanation
    await page.locator("[role='gridcell']").first().click();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await page.getByRole("button", { name: "Team Sage" }).click();
    await expect(page.locator("[role='gridcell'][disabled]")).toHaveCount(1);
  });

  test("arena II lists 6 boards", async ({ page }) => {
    await page.goto("/#/sets");
    await expect(
      page.getByRole("button", { name: "Play Idiom Arena II", exact: true }),
    ).toContainText("6 boards");
  });

  test("final wager can be enabled for an arena (off by default)", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/#/sets");
    await page.getByRole("button", { name: "Play Idiom Arena I", exact: true }).click();

    // toggle is off for arenas by default; turn it on
    const toggle = page.getByRole("switch", { name: /Final wager round/ });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: "Start the game" }).click();

    // play all 5 boards via the store hook
    for (let round = 1; round <= 5; round++) {
      await expect(page.getByText(`Round ${round} of 5`)).toBeVisible();
      await page.evaluate(() => {
        const store = (window as unknown as { __teamStore: any }).__teamStore;
        const ids: string[] = store.getState().board.tiles.map((t: any) => t.id);
        for (const id of ids) {
          store.getState().openTile(id);
          store.getState().revealClue();
          store.getState().awardTo(0);
        }
      });
    }

    // with the toggle on, the final wager appears after the last board
    await expect(page.getByText(/Final Quizzical/)).toBeVisible();
    await page.evaluate(() => {
      const store = (window as unknown as { __teamStore: any }).__teamStore;
      store.setState({ phase: "final-clue" });
      store.getState().revealFinal();
      store.getState().markFinal(0, true);
      store.getState().markFinal(1, false);
      store.getState().finishGame();
    });
    await expect(page.getByText(/wins!|tie!/)).toBeVisible({ timeout: 10_000 });

    // preference persisted: next arena keeps the toggle on
    await page.goto("/#/sets");
    await page.getByRole("button", { name: "Play Idiom Arena II", exact: true }).click();
    await expect(page.getByRole("switch", { name: /Final wager round/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("winner screen shows training notes for missed categories", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/#/sets");
    await page.getByRole("button", { name: "Play Idiom Arena I", exact: true }).click();
    await page.getByRole("button", { name: "Start the game" }).click();

    // play all 5 boards: award most tiles, but "Nobody" every tile of the
    // first category each round — those categories must top the drill list
    for (let round = 1; round <= 5; round++) {
      await expect(page.getByText(`Round ${round} of 5`)).toBeVisible();
      await page.evaluate(() => {
        const store = (window as unknown as { __teamStore: any }).__teamStore;
        const tiles: { id: string; categoryName: string }[] = store.getState().board.tiles;
        const firstCat = tiles[0].categoryName;
        for (const t of tiles) {
          store.getState().openTile(t.id);
          store.getState().revealClue();
          if (t.categoryName === firstCat) store.getState().noAward();
          else store.getState().awardTo(0);
        }
      });
    }

    await expect(page.getByText(/wins!|tie!/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Training notes/)).toBeVisible();
    await expect(page.getByText(/Toughest this game/)).toBeVisible();
    await expect(page.getByText("5/5 missed").first()).toBeVisible();
    await expect(page.getByText(/All-time drill list/)).toBeVisible();
  });
});
