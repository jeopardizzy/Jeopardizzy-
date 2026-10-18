import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

/** The open tile's answer and the teams, through the localhost-only store hook. */
async function state(page: Page): Promise<{ answer: string; picker: string; teams: string[] }> {
  return page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (window as unknown as { __teamStore: any }).__teamStore.getState();
    const tile = s.board.tiles.find((t: { id: string }) => t.id === s.currentTileId);
    return {
      answer: tile.answer as string,
      picker: s.teams[s.activeTeam].name as string,
      teams: s.teams.map((t: { name: string }) => t.name) as string[],
    };
  });
}

const plain = (answer: string) => answer.replace(/\(.*$/, "").split("/")[0].trim();

async function openClue(page: Page) {
  await page.goto("/#/sets");
  await page.getByRole("button", { name: /^Play Idiom Arena I · Part 1 of 2$/ }).click();
  await page.getByRole("button", { name: "Start the game" }).click();
  await page.locator("[role='gridcell']:not([disabled])").first().click();
}

async function guess(page: Page, text: string) {
  await page.getByRole("textbox", { name: "Your answer" }).fill(text);
  await page.getByRole("button", { name: "Check" }).click();
}

const answering = (page: Page) => page.getByRole("group", { name: "Who is answering" });

test.describe("answering on the Trivia Night clue card", () => {
  test("a miss passes the turn; a steal is credited to the team that answered", async ({ page }) => {
    await openClue(page);
    const { answer, picker, teams } = await state(page);
    const other = teams.find((t) => t !== picker)!;

    // the picking team answers first
    await expect(answering(page).getByRole("button", { name: picker, pressed: true })).toBeVisible();
    await guess(page, "definitely not the answer zzz");
    await expect(page.getByText(`Not quite, ${picker}. ${other}, your turn`)).toBeVisible();
    await expect(answering(page).getByRole("button", { name: other, pressed: true })).toBeVisible();
    await expect(answering(page).getByRole("button", { name: picker })).toBeDisabled();

    // the other team steals it
    await guess(page, plain(answer));
    await expect(page.getByText(`Correct, ${other}!`)).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: other, exact: true }).click();
    await expect(page.getByRole("button", { name: "Reveal answer" })).toHaveCount(0);
  });

  test("when every team misses, only the reveal is left", async ({ page }) => {
    await openClue(page);
    const { teams } = await state(page);
    for (let i = 0; i < teams.length; i++) await guess(page, `wrong guess ${i} zzz`);
    await expect(page.getByText(/Every team has had a go/)).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your answer" })).toHaveCount(0);
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await expect(page.getByText(/^Correct,/)).toHaveCount(0);
  });

  test("the host can choose who is answering", async ({ page }) => {
    await openClue(page);
    const { answer, picker, teams } = await state(page);
    const other = teams.find((t) => t !== picker)!;
    await answering(page).getByRole("button", { name: other }).click();
    await guess(page, plain(answer));
    await expect(page.getByText(`Correct, ${other}!`)).toBeVisible();
  });

  test("the host can still reveal without anyone answering", async ({ page }) => {
    await openClue(page);
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await expect(page.getByText(/^Correct,/)).toHaveCount(0);
  });
});
