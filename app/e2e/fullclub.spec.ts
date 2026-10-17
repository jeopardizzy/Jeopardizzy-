import { expect, test } from "@playwright/test";

// A first-time visitor on the website: free tier only, no store.
test.describe("Full Club free tier (web)", () => {
  test("free sets play; locked sets open the Full Club sheet with app links", async ({ page }) => {
    await page.goto("/#/sets");

    // a free set goes straight to team setup
    await page.getByRole("button", { name: "Play First Words", exact: true }).click();
    await expect(page).toHaveURL(/#\/setup/);
    await page.goto("/#/sets");

    // a locked set opens the sheet instead
    await page.getByRole("button", { name: /Play Championship.* — Full Club/ }).click();
    const sheet = page.getByRole("dialog", { name: "Full Club" });
    await expect(sheet).toBeVisible();
    await expect(sheet.getByRole("link", { name: "Get it on the App Store" })).toHaveAttribute(
      "href",
      /apps\.apple\.com/,
    );
    await expect(sheet.getByRole("link", { name: "Get it on Google Play" })).toHaveAttribute(
      "href",
      /com\.quizzicalclub\.app/,
    );
    // the web sells nothing
    await expect(sheet.getByRole("button", { name: /Unlock|Restore/ })).toHaveCount(0);
    await sheet.getByRole("button", { name: "Not now" }).click();
    await expect(sheet).toBeHidden();
    await expect(page).toHaveURL(/#\/sets/);

    // exactly three free sets carry no lock
    const free = page.locator("main button[aria-label^='Play ']:not([aria-label$='Full Club'])");
    await expect(free).toHaveCount(3);
  });

  test("workbook defaults to Easy; other levels open the sheet", async ({ page }) => {
    await page.goto("/#/workbook");
    await expect(page.getByRole("button", { name: "Easy", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Hard — Full Club" }).click();
    await expect(page.getByRole("dialog", { name: "Full Club" })).toBeVisible();
    await page.getByRole("button", { name: "Not now" }).click();
    // still on Easy, and a free test still starts
    await expect(page.getByRole("button", { name: "Easy", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: /Start test/ }).click();
    await expect(page.locator("#wb-answer")).toBeVisible();
  });

  test("Daily Board stays free", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Play today’s board/ }).click();
    await expect(page.getByRole("dialog", { name: "Full Club" })).toHaveCount(0);
    await expect(page).not.toHaveURL(/#\/sets$/);
  });
});
