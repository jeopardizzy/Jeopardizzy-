import { expect, test } from "./fixtures";

/** The open tile's answer, read through the localhost-only store hook. */
async function currentAnswer(page: import("@playwright/test").Page): Promise<{ answer: string; team: string }> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (window as unknown as { __teamStore: any }).__teamStore.getState();
    const tile = s.board.tiles.find((t: { id: string }) => t.id === s.currentTileId);
    return { answer: tile.answer as string, team: s.teams[s.activeTeam].name as string };
  });
}

test.describe("answering on the Trivia Night clue card", () => {
  test("a wrong typed answer keeps the clue open; the right one reveals it for the picking team", async ({ page }) => {
    await page.goto("/#/sets");
    await page.getByRole("button", { name: /^Play Idiom Arena I · Part 1 of 2$/ }).click();
    await page.getByRole("button", { name: "Start the game" }).click();
    await page.locator("[role='gridcell']:not([disabled])").first().click();

    const box = page.getByRole("textbox", { name: "Your answer" });
    await expect(box).toBeVisible();
    const { answer, team } = await currentAnswer(page);

    await box.fill("definitely not the answer zzz");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText(/Not quite/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Reveal answer" })).toBeVisible();

    await box.fill(answer.replace(/\(.*$/, "").split("/")[0].trim());
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText(`Correct, ${team}!`)).toBeVisible();
    await expect(page.getByText(/The answer is/)).toBeVisible();

    // the host still awards: the picking team's button is ready
    await page.getByRole("dialog").getByRole("button", { name: team, exact: true }).click();
    await expect(page.getByRole("button", { name: "Reveal answer" })).toHaveCount(0);
  });

  test("the host can still reveal without anyone answering", async ({ page }) => {
    await page.goto("/#/sets");
    await page.getByRole("button", { name: /^Play Idiom Arena I · Part 1 of 2$/ }).click();
    await page.getByRole("button", { name: "Start the game" }).click();
    await page.locator("[role='gridcell']:not([disabled])").first().click();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await expect(page.getByText(/^Correct,/)).toHaveCount(0);
  });
});
