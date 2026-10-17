import { expect, test } from "./fixtures";

test.describe("Idiom arenas", () => {
  test("arena I part 1 offers 3 boards with original category names", async ({ page }) => {
    await page.goto("/#/sets");
    const arena = page.getByRole("button", { name: /Play Idiom Arena I · Part 1 of 2/ });
    await expect(arena).toBeVisible();
    await expect(arena).toContainText("3 boards");
    await expect(arena).toContainText("75 clues");

    await arena.click();
    await page.getByRole("button", { name: "Start the game" }).click();

    // round 1 = Game H categories, values 100–500
    await expect(page.getByText("Finish the Saying")).toBeVisible();
    await expect(page.getByText("Hidden Animals")).toBeVisible();
    await expect(page.locator("[role='gridcell']").first()).toHaveText("100");
    await expect(page.getByText("Round 1 of 3")).toBeVisible();

    // play a clue: idiom answer shows with explanation
    await page.locator("[role='gridcell']").first().click();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await page.getByRole("button", { name: "Team Sage" }).click();
    await expect(page.locator("[role='gridcell'][disabled]")).toHaveCount(1);
  });

  test("arena II part 1 lists 3 boards", async ({ page }) => {
    await page.goto("/#/sets");
    await expect(
      page.getByRole("button", { name: /Play Idiom Arena II · Part 1 of 2/ }),
    ).toContainText("3 boards");
  });

  test("final wager can be enabled for an arena (off by default)", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/#/sets");
    await page.getByRole("button", { name: /Play Idiom Arena I · Part 1 of 2/ }).click();

    // toggle is off for arenas by default; turn it on
    const toggle = page.getByRole("switch", { name: /Final wager round/ });
    await expect(toggle).toHaveAttribute("aria-checked", "false");
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-checked", "true");

    await page.getByRole("button", { name: "Start the game" }).click();

    // play all 5 boards via the store hook
    for (let round = 1; round <= 3; round++) {
      await expect(page.getByText(`Round ${round} of 3`)).toBeVisible();
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
    await page.getByRole("button", { name: /Play Idiom Arena II · Part 1 of 2/ }).click();
    await expect(page.getByRole("switch", { name: /Final wager round/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  test("winner screen shows training notes for missed categories", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/#/sets");
    await page.getByRole("button", { name: /Play Idiom Arena I · Part 1 of 2/ }).click();
    await page.getByRole("button", { name: "Start the game" }).click();

    // play all 5 boards: award most tiles, but "Nobody" every tile of the
    // first category each round — those categories must top the drill list
    for (let round = 1; round <= 3; round++) {
      await expect(page.getByText(`Round ${round} of 3`)).toBeVisible();
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

  test("practice these: drill list opens a workbook test on missed categories", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/#/sets");
    await page.getByRole("button", { name: /Play Idiom Arena I · Part 1 of 2/ }).click();
    await page.getByRole("button", { name: "Start the game" }).click();

    // miss every tile of the first category of round 1, award the rest
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
      store.getState().endGameEarly("results");
    });

    await expect(page.getByText(/Training notes/)).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Practice these →" }).click();

    // workbook opens in drill mode
    await expect(page).toHaveURL(/#\/workbook/);
    await expect(page.getByText(/Drill mode/)).toBeVisible();
    // type grid is disabled in drill mode
    await expect(page.getByRole("button", { name: /Start drill test/ })).toBeVisible();
    await page.getByRole("button", { name: /Start drill test/ }).click();

    // answer one question and check the flow works
    await expect(page.locator("#wb-answer")).toBeVisible();
    await page.locator("#wb-answer").fill("zzz wrong");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText(/Not quite|Correct!/)).toBeVisible();
  });
});
