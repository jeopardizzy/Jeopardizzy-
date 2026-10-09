import { expect, test } from "@playwright/test";

/** Play every tile of both rounds via reveal + self-grade, then the final. */
async function playBoard(page: import("@playwright/test").Page, markCorrect: boolean) {
  for (let i = 0; i < 25; i++) {
    const remaining = page.locator("[role='gridcell']:not([disabled])");
    await expect(remaining.first()).toBeVisible();
    await remaining.first().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Reveal" }).click();
    await page.getByRole("button", { name: markCorrect ? "Got it ✓" : "Missed it ✗" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
  }
}

test.describe("complete session", () => {
  test("full game: round 1 → double → final wager → results → restart → records saved", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.getByRole("button", { name: "PLAY", exact: true }).click();

    // ---- Round 1: answer everything correctly (self-graded)
    await playBoard(page, true);

    // ---- Round 2 should appear with doubled values
    await expect(page.getByText(/Double Quizzical/)).toBeVisible();
    await expect(page.locator("[role='gridcell']")).toHaveCount(25);
    await expect(page.locator("[aria-label^='Score']")).toContainText("7500");

    // ---- Round 2: miss everything
    await playBoard(page, false);

    // ---- Final: wager input appears, lock it, reveal, self-grade correct
    await expect(page.getByText(/Final Quizzical/)).toBeVisible();
    await page.getByRole("button", { name: "Lock it in" }).click();
    await expect(page.locator("#final-answer")).toBeVisible();
    await page.getByRole("button", { name: "Reveal" }).click();
    await page.getByRole("button", { name: "Got it ✓" }).click();

    // ---- Results (fanfare delay is 1.4s)
    await expect(page.getByText(/Game complete/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/best streak/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Play again" })).toBeVisible();

    // ---- Restart: Play again starts a fresh board at score 0
    await page.getByRole("button", { name: "Play again" }).click();
    await expect(page.locator("[role='gridcell']")).toHaveCount(25);
    await expect(page.locator("[aria-label^='Score']")).toContainText("0");

    // ---- Save restoration: reload home, best score persists
    await page.goto("/");
    await expect(page.getByText(/best score/i)).toBeVisible();
    await expect(page.getByText(/games played/i)).toBeVisible();
  });
});
