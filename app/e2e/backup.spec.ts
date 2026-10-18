import { expect, test, type Page } from "./fixtures";

/** Finish a 5-question workbook test (all wrong on purpose — a 0/5 best is
 *  still a saved record, which is all this test needs). */
async function finishShortTest(page: Page) {
  await page.goto("/#/workbook");
  await page.getByRole("group", { name: "Test length" }).getByRole("button", { name: "5", exact: true }).click();
  await page.getByRole("button", { name: /Start test/ }).click();
  for (let i = 0; i < 5; i++) {
    await page.locator("#wb-answer").fill("zzz wrong");
    await page.getByRole("button", { name: "Check" }).click();
    await page.getByRole("button", { name: /Next question|See results/ }).click();
  }
  await expect(page.getByText(/\/5/)).toBeVisible();
  await page.getByRole("button", { name: "Pick another type" }).click();
  await expect(page.getByRole("button", { name: "Copy to clipboard" })).toBeVisible();
}

test.describe("progress backup", () => {
  test("copy → wipe → paste-restore brings the records back", async ({ browser }) => {
    test.setTimeout(120_000);
    // clipboard permission granted so the Copy path works headlessly
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();

    await finishShortTest(page);
    const before = await page.evaluate(() => localStorage.getItem("quizzical-club:records:v1"));
    expect(before).toBeTruthy();

    // copy the backup to the clipboard from the picker card
    await page.goto("/#/workbook");
    await page.getByRole("button", { name: "Copy to clipboard" }).click();
    await expect(page.getByText(/Backup copied/)).toBeVisible();
    const text = await page.evaluate(() => navigator.clipboard.readText());
    expect(text).toContain("quizzical-club-backup");

    // wipe and confirm empty
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem("quizzical-club:records:v1"))).toBeNull();

    // garbage is rejected without touching storage
    await page.getByRole("button", { name: "Paste backup text" }).click();
    await page.locator("#backup-paste").fill('{"kind":"other-app"}');
    await page.getByRole("button", { name: "Restore pasted backup" }).click();
    await expect(page.getByText(/doesn't look like/)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("quizzical-club:records:v1"))).toBeNull();

    // real restore
    await page.locator("#backup-paste").fill(text);
    await page.getByRole("button", { name: "Restore pasted backup" }).click();
    await expect(page.getByText(/Progress restored/)).toBeVisible();
    await page.waitForTimeout(1200); // the app reloads itself
    const restored = await page.evaluate(() => localStorage.getItem("quizzical-club:records:v1"));
    expect(restored).toBe(before);

    await context.close();
  });
});
