import { expect, test } from "@playwright/test";

test.describe("Quizzical Club", () => {
  test("home: sidebar with three sections + Daily Jeopardy card", async ({ page }, testInfo) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(nav.getByRole("link", { name: "Guides" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Workbook" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Jeopardy" })).toBeVisible();
    // the logo tops the sidebar on desktop; the mobile bottom bar omits it
    if (testInfo.project.name === "desktop") {
      await expect(nav.getByRole("button", { name: /Quizzical Club/ })).toBeVisible();
    } else {
      await expect(nav.getByRole("button", { name: /Quizzical Club/ })).toBeHidden();
    }
    await expect(page.getByRole("heading", { name: "Daily Jeopardy" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Play today’s board/ })).toBeVisible();
  });

  test("sidebar navigates to all three sections; hidden during a team game", async ({
    page,
  }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("link", { name: "Jeopardy" }).click();
    await expect(page).toHaveURL(/#\/sets/);
    await nav.getByRole("link", { name: "Workbook" }).click();
    await expect(page).toHaveURL(/#\/workbook/);
    await nav.getByRole("link", { name: "Guides" }).click();
    await expect(page).toHaveURL(/#\/guides/);
    // hidden in an active game
    await nav.getByRole("link", { name: "Jeopardy" }).click();
    await page.getByRole("button", { name: "Play First Words", exact: true }).click();
    await page.getByRole("button", { name: "Start the game" }).click();
    await expect(page.locator("[role='gridcell']").first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(0);
  });

  test("jeopardy: set select → team setup → board → reveal → award points", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Jeopardy" }).click();
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
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Jeopardy" }).click();
    await expect(page.getByRole("button", { name: /Championship/ })).toBeVisible();
    await context.close();
  });

  test("TZ1: clue window hugs the left edge on desktop, full width on mobile", async ({
    browser,
  }) => {
    // desktop 1280x720: window left edge is left of center, width <= 50% viewport
    const desktop = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    let page = await desktop.newPage();
    await page.goto("/#/sets");
    await page.getByRole("button", { name: "Play First Words", exact: true }).click();
    await page.getByRole("button", { name: "Start the game" }).click();
    await page.locator("[role='gridcell']").first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // measure the inner card, not the full-viewport overlay
    let box = (await dialog.locator("> div").boundingBox())!;
    expect(box.x + box.width / 2).toBeLessThan(1280 / 2);
    expect(box.width).toBeLessThanOrEqual(1280 * 0.5 + 4);
    // all action buttons fully visible
    await expect(page.getByRole("button", { name: "Reveal answer" })).toBeVisible();
    await desktop.close();

    // mobile 360x640: window stays within the viewport
    const mobile = await browser.newContext({ viewport: { width: 360, height: 640 } });
    page = await mobile.newPage();
    await page.goto("/#/sets");
    await page.getByRole("button", { name: "Play First Words", exact: true }).click();
    await page.getByRole("button", { name: "Start the game" }).click();
    await page.locator("[role='gridcell']").first().click();
    box = (await page.getByRole("dialog").locator("> div").boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(360);
    await expect(page.getByRole("button", { name: "Reveal answer" })).toBeVisible();
    await mobile.close();
  });

  test("TZ2: workbook test length 5/10/20, persisted choice", async ({ page }) => {
    await page.goto("/#/workbook");
    // length group visible with 5/10/20, default 10
    const group = page.getByRole("group", { name: "Test length" });
    await expect(group.getByRole("button", { name: "10", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    // pick 5 and run a short test to results
    await group.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: /Start test/ }).click();
    for (let i = 0; i < 5; i++) {
      await page.locator("#wb-answer").fill("zzz wrong");
      await page.getByRole("button", { name: "Check" }).click();
      await page.getByRole("button", { name: /Next question|See results/ }).click();
    }
    await expect(page.getByText("/5")).toBeVisible();
    await expect(page.getByText(/% correct/)).toBeVisible();
    // reload: choice persisted
    await page.reload();
    await expect(
      page.getByRole("group", { name: "Test length" }).getByRole("button", { name: "5", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  test("daily jeopardy: one board from the home card to the podium", async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.getByRole("button", { name: /Play today’s board/ }).click();
    await expect(page).toHaveURL(/#\/setup/);
    await page.getByRole("button", { name: "Start the game" }).click();

    // exactly one 5x5 board, values 100–500
    await expect(page.locator("[role='gridcell']")).toHaveCount(25);
    await expect(page.getByText("Round 1 of 1")).toBeVisible();

    // first tile through the UI, rest via the store hook
    await page.locator("[role='gridcell']").first().click();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await page.getByRole("button", { name: "Team Sage" }).click();
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

    // no final by default — straight to the podium with the exact total
    await expect(page.getByText(/wins!/)).toBeVisible({ timeout: 10_000 });
    await expect(
      page.locator("[role='listitem']", { hasText: "Team Sage" }),
    ).toContainText("7500");
  });

  test("TZ2: no Cyrillic anywhere in the rendered app", async ({ page }) => {
    await page.goto("/");
    const check = async () => {
      const text = await page.evaluate(() => document.body.innerText);
      expect(text, "Cyrillic on screen").not.toMatch(/[А-Яа-яЁё]/);
    };
    await check();
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Jeopardy" }).click();
    await check();
    await page.getByRole("button", { name: "Play First Words", exact: true }).click();
    await check(); // setup screen (incl. finish-game toggle)
    await page.getByRole("button", { name: "Start the game" }).click();
    await page.locator("[role='gridcell']").first().click();
    await check(); // clue window
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await check(); // award window
    // early-finish dialog
    await page.getByRole("button", { name: "Team Sage" }).click();
    await page.getByRole("button", { name: "Finish game" }).click();
    await check();
    await page.getByRole("button", { name: "Cancel" }).click();
    await page.goto("/#/workbook");
    await check();
    await page.goto("/#/guides");
    await check();
  });
});
