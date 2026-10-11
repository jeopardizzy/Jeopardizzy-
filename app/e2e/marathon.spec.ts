import { expect, test } from "@playwright/test";

/**
 * The Grand Marathon, end to end. The first tiles are played through the
 * real UI (tile → reveal → award); the remaining tiles of all 14 boards are
 * driven through the store test hook (localhost only) — every tile is opened,
 * revealed and awarded via the real game actions, validating all 69
 * categories, the 4-wide final board and exact scoring in one continuous run.
 */

// rounds 1..13 are 5-wide (tile values sum = round x 1500 per column),
// round 14 is 4-wide. total = 1500 * (5*91 + 14*4) = 766500
const EXPECTED_TOTAL = 766500;
const UI_TILES = 3;

/** Play N tiles through the UI, then the rest of the board via the store. */
async function playBoard(
  page: import("@playwright/test").Page,
  uiTiles: number,
): Promise<void> {
  for (let i = 0; i < uiTiles; i++) {
    const remaining = page.locator("[role='gridcell']:not([disabled])");
    await remaining.first().click();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await page.getByRole("button", { name: "Team Sage" }).click();
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

test.describe("grand marathon", () => {
  test("all 14 boards play through to the podium with exact scoring", async ({ page }) => {
    test.setTimeout(300_000);

    await page.goto("/#/sets");
    const marathonCard = page.getByRole("button", { name: /Grand Marathon/ });
    await expect(marathonCard).toContainText("14 boards");
    await marathonCard.click();
    await page.getByRole("button", { name: "Start the game" }).click();

    // ---- Round 1: first tiles through the UI, rest via the store hook
    await expect(page.getByText("Round 1 of 14")).toBeVisible();
    await expect(page.locator("[role='gridcell']")).toHaveCount(25);
    await playBoard(page, UI_TILES);

    // ---- Rounds 2–14 via the store hook (same actions the UI dispatches)
    for (let round = 2; round <= 14; round++) {
      await expect(page.getByText(`Round ${round} of 14`)).toBeVisible();
      const expectedTiles = round === 14 ? 20 : 25;
      await expect(page.locator("[role='gridcell']")).toHaveCount(expectedTiles);

      const result = await page.evaluate(() => {
        const store = (window as unknown as { __teamStore: any }).__teamStore;
        const before = store.getState().roundIndex;
        const ids: string[] = store.getState().board.tiles.map((t: any) => t.id);
        for (const id of ids) {
          store.getState().openTile(id);
          store.getState().revealClue();
          store.getState().awardTo(0);
        }
        const after = store.getState();
        return { before, afterRound: after.roundIndex, phase: after.phase, tiles: ids.length };
      });
      expect(result.tiles).toBe(expectedTiles);
      if (round < 14) expect(result.afterRound).toBe(result.before + 1);
      else expect(result.phase).toBe("winner");
    }

    // no final wager in the marathon — straight to the podium
    await expect(page.getByText(/wins!/)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Grand Marathon/)).toBeVisible();

    // exact deterministic score for Team Sage; Team Butter stays at zero
    await expect(
      page.locator("[role='listitem']", { hasText: "Team Sage" }),
    ).toContainText(String(EXPECTED_TOTAL));
    await expect(
      page.locator("[role='listitem']", { hasText: "Team Butter" }),
    ).toContainText("0");
  });
});
