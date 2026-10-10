import { expect, test } from "@playwright/test";

test.describe("Idiom arenas", () => {
  test("arena I offers 5 boards with original category names", async ({ page }) => {
    await page.goto("/#/sets");
    const arena = page.getByRole("button", { name: /Idiom Arena I / });
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
    await expect(page.getByRole("button", { name: /Idiom Arena II / })).toContainText("6 boards");
  });
});
