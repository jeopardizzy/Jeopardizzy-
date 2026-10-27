import { expect, test } from "./fixtures";

test.describe("build your own board", () => {
  test("pick categories, choose exact questions, play the board", async ({ page }) => {
    await page.goto("/#/sets");
    await page.getByRole("button", { name: /Build your own board/ }).click();

    const categories = page.getByRole("list", { name: "Categories" }).getByRole("button");
    const names: string[] = [];
    for (let i = 0; i < 3; i++) {
      const b = categories.nth(i * 7);
      names.push((await b.locator("span").first().innerText()).trim());
      await b.click();
    }
    const board = page.getByRole("region", { name: "Your board" });
    await expect(board).toContainText("Your board (3/5)");

    // choose the five questions of the first category: its last five
    await board.getByRole("button", { name: "Choose questions" }).first().click();
    const boxes = board.getByRole("list", { name: `Questions in ${names[0]}` }).getByRole("checkbox");
    const count = await boxes.count();
    const chosen: string[] = [];
    for (let i = count - 5; i < count; i++) {
      await boxes.nth(i).check();
      chosen.push(((await boxes.nth(i).locator("xpath=..").innerText()).split(" — ")[0] ?? "").trim());
    }
    await expect(board).toContainText("5 chosen");
    await expect(boxes.nth(0)).toBeDisabled(); // five is the limit

    await page.getByRole("button", { name: "Use this board →" }).click();
    await page.getByRole("button", { name: "Start the game" }).click();
    for (const n of names) await expect(page.getByText(n, { exact: true }).first()).toBeVisible();
    await expect(page.locator("[role='gridcell']")).toHaveCount(15);

    // the 100-point tile of the first column is the first chosen question
    await page.locator("[role='gridcell']:not([disabled])").first().click();
    await expect(page.getByRole("dialog")).toContainText(chosen[0].slice(0, 20));

    // every clue card explains its task
    await page.getByRole("dialog").getByRole("button", { name: /How to play/ }).click();
    await expect(page.getByRole("region", { name: /^How to play / })).toBeVisible();
  });

  test("numbered sets are one task", async ({ page }) => {
    await page.goto("/#/build");
    const categories = page.getByRole("list", { name: "Categories" });
    await page.getByLabel("Search categories").fill("Bonus Mix");
    await expect(categories.getByRole("button")).toHaveCount(1);
    await expect(categories).toContainText("Bonus Mix");
  });

  test("guides: every task has one, found by name", async ({ page }) => {
    await page.goto("/#/guides");
    await page.getByLabel("Find a task").fill("Sheesh");
    await expect(page.getByRole("list", { name: "Tasks for Theme Words" })).toContainText("Sheesh");
    await page.getByLabel("Find a task").fill("Bonus Mix");
    await expect(page.getByText(/Each clue starts with its type in brackets/)).toBeVisible();
  });

  test("random categories fill the board", async ({ page }) => {
    await page.goto("/#/build");
    await page.getByRole("button", { name: /Random categories/ }).click();
    await expect(page.getByRole("region", { name: "Your board" })).toContainText("Your board (5/5)");
  });

  test("the Today tab leads back to the Daily Board", async ({ page }) => {
    await page.goto("/#/workbook");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Today" }).click();
    await expect(page.getByText("Daily Board").first()).toBeVisible();
  });
});
