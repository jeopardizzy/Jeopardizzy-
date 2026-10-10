import { expect, test } from "@playwright/test";

test.describe("Quizzical Club", () => {
  test("home shows the three modes", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: /Team Jeopardy/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /✏️ Workbook/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /📖 Guides/ })).toBeVisible();
  });

  test("jeopardy: set select → team setup → board → reveal → award points", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByText("Choose a set").click();
    await expect(page).toHaveURL(/#\/sets/);

    // pick the first set
    await page.getByRole("button", { name: /First Words/ }).click();
    await expect(page).toHaveURL(/#\/setup/);

    // rename team 1, add a third team
    await page.locator("#team-0").fill("Dolphins");
    await page.getByRole("button", { name: "+ Add a team" }).click();
    await page.getByRole("button", { name: "Start the game" }).click();
    await expect(page).toHaveURL(/#\/game/);

    // board with 25 tiles and 3 teams on the scoreboard
    await expect(page.locator("[role='gridcell']")).toHaveCount(25);
    const dolphinsChip = page.locator("[role='listitem']", { hasText: "Dolphins" });
    await expect(dolphinsChip).toBeVisible();

    // open a tile, reveal, award to Dolphins
    const scoreBefore = await dolphinsChip.textContent();
    await page.locator("[role='gridcell']").first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await page.getByRole("button", { name: "Dolphins", exact: true }).click();

    // tile got disabled and Dolphins have points now
    await expect(page.locator("[role='gridcell'][disabled]")).toHaveCount(1);
    const scoreAfter = await dolphinsChip.textContent();
    expect(scoreAfter).not.toEqual(scoreBefore);
  });

  test("workbook: pick type → 10-question test → results → best saved", async ({ page }) => {
    await page.goto("/#/workbook");
    await page.getByRole("button", { name: /Homonyms/ }).first().click();
    await page.getByRole("button", { name: /Start test/ }).click();

    // answer all 10 (wrong on purpose — flow check, not score)
    for (let i = 0; i < 10; i++) {
      await page.locator("#wb-answer").fill("zzz wrong");
      await page.getByRole("button", { name: "Check" }).click();
      await expect(page.getByText(/Not quite/)).toBeVisible();
      await page.getByRole("button", { name: /Next question|See results/ }).click();
    }
    await expect(page.getByText(/Review/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Retake" })).toBeVisible();
  });

  test("guides: open a card, practice link goes to workbook", async ({ page }) => {
    await page.goto("/#/guides");
    await page.getByRole("button", { name: /Homonyms/ }).first().click();
    await expect(page.getByText(/Strategy tips/).first()).toBeVisible();
    await page.getByRole("button", { name: "Practice this type →" }).first().click();
    await expect(page).toHaveURL(/#\/workbook/);
  });

  test("refresh on /game without a game redirects to sets", async ({ page }) => {
    await page.goto("/#/game");
    await expect(page).toHaveURL(/#\/sets/);
  });

  test("reduced motion users can navigate", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByText("Choose a set").click();
    await expect(page.getByRole("button", { name: /Championship/ })).toBeVisible();
    await context.close();
  });
});
