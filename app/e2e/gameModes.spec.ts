import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

const score = (page: Page, team: string) =>
  page.locator("[role='listitem']", { hasText: team });

async function setUp(page: Page, game: RegExp, modes: string[]) {
  await page.goto("/#/sets");
  await page.getByRole("button", { name: game }).click();
  for (const m of modes) {
    const sw = page.getByRole("switch", { name: m });
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
  }
  await page.getByRole("button", { name: "Start the game" }).click();
}

/** Play every remaining board tile through the store hook (localhost only), Team Butter scoring. */
async function playAllBoards(page: Page) {
  await page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const store = (window as unknown as { __teamStore: any }).__teamStore;
    while (store.getState().phase === "board") {
      const s = store.getState();
      const id = s.board.tiles.find((t: { id: string }) => !s.playedTileIds.includes(t.id)).id;
      s.openTile(id);
      store.getState().revealClue();
      store.getState().awardTo(1);
    }
  });
}

test.describe("Trivia Night game modes", () => {
  test("wrong answers cost points, and the host's award refunds a wrongly charged team", async ({ page }) => {
    await setUp(page, /^Play Idiom Arena I · Part 1 of 2$/, ["Wrong answers cost points"]);
    await page.locator("[role='gridcell']:not([disabled])").first().click();
    const value = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const s = (window as unknown as { __teamStore: any }).__teamStore.getState();
      return s.board.tiles.find((t: { id: string }) => t.id === s.currentTileId).value as number;
    });
    await expect(page.getByText("Wrong answers cost points.")).toBeVisible();

    await page.getByRole("textbox", { name: "Your answer" }).fill("definitely not it zzz");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText(`Not quite, Team Sage (−${value}).`)).toBeVisible();
    await expect(score(page, "Team Sage")).toContainText(`-${value}`);

    // the host overrules the checker: the award also refunds the penalty
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Team Sage", exact: true }).click();
    await expect(score(page, "Team Sage")).toContainText(String(value));
    await expect(score(page, "Team Sage")).not.toContainText("-");
  });

  test("without the mode a wrong answer costs nothing", async ({ page }) => {
    await setUp(page, /^Play Idiom Arena I · Part 1 of 2$/, []);
    await page.locator("[role='gridcell']:not([disabled])").first().click();
    await page.getByRole("textbox", { name: "Your answer" }).fill("definitely not it zzz");
    await page.getByRole("button", { name: "Check" }).click();
    await expect(page.getByText(/^Not quite, Team Sage\. /)).toBeVisible();
    await expect(score(page, "Team Sage")).toContainText("0");
  });

  test("lightning round after the last board, then the podium", async ({ page }) => {
    test.setTimeout(90_000);
    await setUp(page, /Play Grand Marathon · Part 1 of 5/, ["Lightning round"]);
    await playAllBoards(page);
    const before = 45000; // 3 full boards to Team Butter

    await expect(page.getByText("Lightning round", { exact: true })).toBeVisible();
    await expect(page.getByText(/Lightning · 1 of 8/)).toBeVisible();
    await expect(page.getByText("300 pts")).toBeVisible();
    await expect(page.getByRole("timer")).toBeVisible();

    // a team gets it: points, answer, next clue
    await page.getByRole("button", { name: "Team Sage" }).click();
    await expect(page.getByText("+300 for Team Sage!")).toBeVisible();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await page.getByRole("button", { name: "Next clue" }).click();

    // nobody knows: just the answer
    await expect(page.getByText(/Lightning · 2 of 8/)).toBeVisible();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    await expect(page.getByText(/^\+300/)).toHaveCount(0);
    await page.getByRole("button", { name: "Next clue" }).click();

    for (let i = 3; i <= 8; i++) {
      await expect(page.getByText(new RegExp(`Lightning · ${i} of 8`))).toBeVisible();
      await page.getByRole("button", { name: "Team Butter" }).click();
      await page.getByRole("button", { name: i < 8 ? "Next clue" : "Finish the round" }).click();
    }

    // marathon parts have no final — straight to the podium
    await expect(page.getByText(/wins!/)).toBeVisible({ timeout: 10_000 });
    await expect(score(page, "Team Butter")).toContainText(String(before + 6 * 300));
    await expect(score(page, "Team Sage")).toContainText("300");
  });

  test("the lightning clock runs out and shows the answer", async ({ page }) => {
    await page.clock.install();
    await setUp(page, /Play Grand Marathon · Part 1 of 5/, ["Lightning round"]);
    await playAllBoards(page);
    await expect(page.getByRole("timer", { name: "15 seconds left" })).toBeVisible();
    await page.clock.runFor(16_000);
    await expect(page.getByText("Time's up!")).toBeVisible();
    await expect(page.getByText(/The answer is/)).toBeVisible();
    // too late to award once time is up and nobody was tapped
    await expect(page.getByRole("button", { name: "Team Sage" })).toHaveCount(0);
  });
});
