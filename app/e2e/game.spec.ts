import { expect, test } from "@playwright/test";

test.describe("Quizzical gameplay", () => {
  test("home → play → answer wrong → reveal + self-grade → score changes", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("button", { name: "PLAY", exact: true })).toBeVisible();

    await page.getByRole("button", { name: "PLAY", exact: true }).click();
    await expect(page).toHaveURL(/#\/game/);

    // board renders: 5 category headers + 25 tiles
    const tiles = page.locator("[role='gridcell']");
    await expect(tiles).toHaveCount(25);

    // open a tile and submit a deliberately wrong typed answer
    await tiles.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.locator("#answer-input").fill("definitely not the answer zzz");
    await page.getByRole("button", { name: "Answer", exact: true }).click();
    await expect(page.getByText(/Not quite/)).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // score went negative
    await expect(page.locator("[aria-label^='Score']")).toContainText("-");

    // open another tile, reveal, self-grade correct
    const remaining = page.locator("[role='gridcell']:not([disabled])");
    await remaining.first().click();
    await page.getByRole("button", { name: "Reveal" }).click();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await page.getByRole("button", { name: "Got it ✓" }).click();
    await page.getByRole("button", { name: "Continue" }).click();

    // played tiles are disabled
    await expect(page.locator("[role='gridcell'][disabled]")).toHaveCount(2);
  });

  test("direct hash link to #/how works and survives refresh", async ({ page }) => {
    await page.goto("/#/how");
    await expect(page.getByRole("heading", { name: "How to play" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("heading", { name: "How to play" })).toBeVisible();
  });

  test("refresh on /game without a running game redirects home", async ({ page }) => {
    await page.goto("/#/game");
    await expect(page.getByRole("button", { name: "PLAY", exact: true })).toBeVisible();
  });

  test("reduced motion users can play", async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/");
    await page.getByRole("button", { name: "PLAY", exact: true }).click();
    const tiles = page.locator("[role='gridcell']");
    await expect(tiles).toHaveCount(25);
    await tiles.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await context.close();
  });

  test("keyboard: Enter submits the answer, Escape closes after feedback", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "PLAY", exact: true }).click();
    await page.locator("[role='gridcell']").first().click();
    await page.locator("#answer-input").fill("zzz wrong");
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Not quite/)).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
