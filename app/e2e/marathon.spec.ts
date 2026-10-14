import { expect, test } from "@playwright/test";

/**
 * The Grand Marathon, part 1, played end to end (games are split into parts
 * of at most 3 boards). First tiles go through the real UI; the rest run
 * through the store test hook (localhost only). Exact score: 3 full boards,
 * multipliers 1-3 → 5 cols x 1500 x (1+2+3) = 45,000.
 */

const EXPECTED_PART1_TOTAL = 45000;

test.describe("grand marathon, part 1", () => {
  test("3 boards play through to the podium with exact scoring", async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto("/#/sets");
    const card = page.getByRole("button", { name: /Play Grand Marathon · Часть 1 из 5/ });
    await expect(card).toContainText("3 boards");
    await expect(card).toContainText("75 clues");
    await card.click();
    await page.getByRole("button", { name: "Start the game" }).click();

    for (let round = 1; round <= 3; round++) {
      await expect(page.getByText(`Round ${round} of 3`)).toBeVisible();
      await expect(page.locator("[role='gridcell']")).toHaveCount(25);

      if (round === 1) {
        // first tiles through the real UI
        for (let i = 0; i < 3; i++) {
          await page.locator("[role='gridcell']:not([disabled])").first().click();
          await page.getByRole("button", { name: "Reveal answer" }).click();
          await page.getByRole("button", { name: "Team Sage" }).click();
        }
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

    // marathon parts have no final — straight to the podium
    await expect(page.getByText(/wins!/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Grand Marathon/)).toBeVisible();
    await expect(
      page.locator("[role='listitem']", { hasText: "Team Sage" }),
    ).toContainText(String(EXPECTED_PART1_TOTAL));
  });

  test("early finish: one tile, then «Сразу к итогам» keeps the score", async ({ page }) => {
    await page.goto("/#/sets");
    await page.getByRole("button", { name: /Play Grand Marathon · Часть 1 из 5/ }).click();
    await page.getByRole("button", { name: "Start the game" }).click();

    // play exactly one tile (100 pts) through the UI
    await page.locator("[role='gridcell']:not([disabled])").first().click();
    // «Завершить игру» is disabled while a clue window is open
    await expect(page.getByRole("button", { name: "Завершить игру" })).toBeDisabled();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await page.getByRole("button", { name: "Team Sage" }).click();

    // end the game early with confirmation
    await page.getByRole("button", { name: "Завершить игру" }).click();
    await expect(page.getByRole("dialog", { name: /Завершить игру досрочно/ })).toBeVisible();
    await page.getByRole("button", { name: "Отмена" }).click();
    // cancel returns to the board, tile count unchanged
    await expect(page.locator("[role='gridcell'][disabled]")).toHaveCount(1);

    await page.getByRole("button", { name: "Завершить игру" }).click();
    // marathon part has no final: only «Сразу к итогам» and «Отмена»
    await expect(page.getByRole("button", { name: "К финалу" })).toHaveCount(0);
    await page.getByRole("button", { name: "Сразу к итогам" }).click();

    await expect(page.getByText(/wins!/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("Завершено досрочно")).toBeVisible();
    await expect(
      page.locator("[role='listitem']", { hasText: "Team Sage" }),
    ).toContainText("100");
    // no misses were recorded — training notes congratulate instead of listing
    await expect(page.getByText(/Flawless boards/)).toBeVisible();
  });

  test("early finish to the final when the final is enabled", async ({ page }) => {
    await page.goto("/#/sets");
    await page.getByRole("button", { name: "Play First Words", exact: true }).click();
    // final is on by default for book sets
    await page.getByRole("button", { name: "Start the game" }).click();

    await page.locator("[role='gridcell']:not([disabled])").first().click();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await page.getByRole("button", { name: "Team Sage" }).click();

    await page.getByRole("button", { name: "Завершить игру" }).click();
    await page.getByRole("button", { name: "К финалу" }).click();

    await expect(page.getByText(/Final Quizzical/)).toBeVisible();
    await expect(page.getByLabel("Wager for Team Sage")).toHaveValue("100");
  });
});
