import { expect, test } from "./fixtures";
import { buildDailyBoard } from "../src/lib/board";
import { dailySeed } from "../src/lib/random";

type Page = import("@playwright/test").Page;

/** The prototype plays today's Daily Board, cheapest first. */
const firstClue = buildDailyBoard(dailySeed())
  .tiles.slice()
  .sort((a, b) => a.value - b.value)[0];

async function phone(page: Page, link: string, team: string) {
  await page.goto(link);
  await page.getByRole("button", { name: team }).click();
  await expect(page.getByText("You're in!")).toBeVisible();
}

test.describe("playing on several phones (prototype)", () => {
  test.skip(({ isMobile }) => isMobile, "multi-context flow runs once, on desktop");

  test("teams join by link, buzz in order, steal after a miss, and score", async ({ page, browser }) => {
    test.setTimeout(60_000);
    await page.goto("/#/sets");
    await page.getByRole("link", { name: /Play on several phones/ }).click();
    await page.getByRole("button", { name: "Open a room" }).click();
    await expect(page.getByLabel("Join code")).toHaveText(/^[A-Z]{4}$/);
    const link = (await page.getByTestId("join-link").getAttribute("href"))!;
    expect(link).toMatch(/#\/join\/[A-Z]{4}\/[\w-]{22}$/);

    await expect(page.getByRole("img", { name: "QR code to join this room" })).toBeVisible();

    const sageCtx = await browser.newContext();
    const butterCtx = await browser.newContext();
    const sage = await sageCtx.newPage();
    const butter = await butterCtx.newPage();
    await phone(sage, link, "Team Sage");
    await phone(butter, link, "Team Butter");
    await expect(page.getByRole("listitem").filter({ hasText: "Team Sage" })).toContainText("📱1");

    await page.getByRole("button", { name: "Start" }).click();
    await expect(page.getByRole("img", { name: "QR code to join this room" })).toHaveCount(0);
    await expect(sage.getByText(firstClue.clue)).toBeVisible();
    await expect(sage.getByRole("button", { name: "BUZZ" })).toHaveCount(0); // still reading

    await page.getByRole("button", { name: "Open buzzers" }).click();
    await sage.getByRole("button", { name: "BUZZ" }).click();
    await expect(page.getByLabel("Buzz order")).toHaveText("Team Sage first");
    await butter.getByRole("button", { name: "BUZZ" }).click();
    await expect(page.getByLabel("Buzz order")).toHaveText(/^Team Sage first · Team Butter \+\d\.\d\d s$/);

    // Sage misses; the turn passes to Butter, who steals it
    await expect(butter.getByText("Team Sage is answering…")).toBeVisible();
    await sage.getByLabel("Your answer").fill("definitely not it zzz");
    await sage.getByRole("button", { name: "Send" }).click();
    await expect(sage.getByText("Not quite — wait for the next clue.")).toBeVisible();
    const plain = firstClue.answer.replace(/\(.*$/, "").split("/")[0].trim();
    await butter.getByLabel("Your answer").fill(plain);
    await butter.getByRole("button", { name: "Send" }).click();

    await expect(page.getByText(/^The answer is/)).toBeVisible();
    await expect(page.getByRole("listitem").filter({ hasText: "Team Butter" })).toContainText(String(firstClue.value));
    await expect(butter.getByText(/You got it!/)).toBeVisible();
    await expect(sage.getByText(/The answer is/)).toBeVisible();

    // the next clue clears the round on every phone
    await page.getByRole("button", { name: "Next clue" }).click();
    await expect(sage.getByText("Listen… buzzers open soon.")).toBeVisible();
    await expect(butter.getByText(/The answer is/)).toHaveCount(0);

    await sageCtx.close();
    await butterCtx.close();
  });

  test("a wrong room code says so", async ({ page }) => {
    await page.goto("/#/join/ZZZZ/AAAAAAAAAAAAAAAAAAAAAA");
    await expect(page.getByText("That room doesn't exist.", { exact: false })).toBeVisible();
  });
});
