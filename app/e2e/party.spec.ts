import { expect, test } from "./fixtures";

type Page = import("@playwright/test").Page;

/** Read the host's game through the localhost-only store hook. */
const hostGame = (page: Page) =>
  page.evaluate(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const s = (window as unknown as { __teamStore: any }).__teamStore.getState();
    const tile = s.board?.tiles.find((t: { id: string }) => t.id === s.currentTileId);
    return { answer: tile?.answer as string, value: tile?.value as number, final: s.finalClue?.answer as string };
  });

const plain = (answer: string) => answer.replace(/\(.*$/, "").split("/")[0].trim();

async function phone(page: Page, link: string, team: string) {
  await page.goto(link);
  await page.getByRole("button", { name: team }).click();
  await expect(page.getByText(/is picking a tile|picks the next tile/)).toBeVisible();
}

test.describe("Trivia Night on several phones", () => {
  test.skip(({ isMobile }) => isMobile, "multi-browser flow runs once, on desktop");

  test("teams buzz and answer on their phones, steal, wager secretly and finish", async ({ page, browser }) => {
    test.setTimeout(90_000);
    // host: today's board with phones and the final round on
    await page.goto("/#/");
    await page.getByRole("button", { name: /Play today/ }).click();
    await page.getByRole("switch", { name: "Teams answer on their own phones" }).click();
    const finalSwitch = page.getByRole("switch", { name: "Final wager round" });
    if ((await finalSwitch.getAttribute("aria-checked")) !== "true") await finalSwitch.click();
    await page.getByRole("button", { name: "Start the game" }).click();

    const bar = page.getByRole("region", { name: "Phones" });
    await expect(bar.getByLabel("Join code")).toHaveText(/^[A-Z]{4}$/);
    await expect(page.getByRole("img", { name: "QR code to join this game" })).toBeVisible();
    const link = (await page.getByTestId("join-link").getAttribute("href"))!;

    const sageCtx = await browser.newContext();
    const butterCtx = await browser.newContext();
    const sage = await sageCtx.newPage();
    const butter = await butterCtx.newPage();
    await phone(sage, link, "Team Sage");
    await phone(butter, link, "Team Butter");
    await expect(bar.getByRole("list", { name: "Phones per team" })).toContainText("Team Butter 📱1");

    // a clue: phones see it, buzzers open only when the host says so
    await page.locator("[role='gridcell']:not([disabled])").first().click();
    const { answer, value } = await hostGame(page);
    await expect(sage.getByText("Listen… buzzers open soon.")).toBeVisible();
    await expect(sage.getByRole("button", { name: "BUZZ" })).toHaveCount(0);
    await page.getByRole("button", { name: "Open buzzers" }).click();
    await sage.getByRole("button", { name: "BUZZ" }).click();
    await expect(page.getByLabel("Buzz order")).toHaveText("Team Sage first");
    await butter.getByRole("button", { name: "BUZZ" }).click();
    await expect(page.getByLabel("Buzz order")).toHaveText(/^Team Sage first · Team Butter \+\d\.\d\d s$/);

    // Sage misses, Butter steals
    await expect(butter.getByText("Team Sage is answering…")).toBeVisible();
    await sage.getByLabel("Your answer").fill("definitely not it zzz");
    await sage.getByRole("button", { name: "Send" }).click();
    await expect(page.getByText(/Team Sage: “definitely not it zzz” — not quite/)).toBeVisible();
    await expect(sage.getByText(/not quite\. Wait for the next clue/)).toBeVisible();
    await butter.getByLabel("Your answer").fill(plain(answer));
    await butter.getByRole("button", { name: "Send" }).click();

    // the host sees the steal and awards it
    await expect(page.getByText("Correct, Team Butter!")).toBeVisible();
    await expect(butter.getByText(/You got it! The answer is/)).toBeVisible();
    await expect(sage.getByText(/The answer is/)).toBeVisible();
    await page.getByRole("dialog").getByRole("button", { name: "Team Butter", exact: true }).click();
    await expect(sage.getByRole("list", { name: "Scores" })).toContainText(`Team Butter ${value}`);

    // final round: wagers are secret on the phones
    await page.getByRole("button", { name: "Finish game" }).click();
    await page.getByRole("button", { name: "To the final" }).click();
    await expect(butter.getByLabel("Your wager")).toBeVisible();
    const wager = value - 30; // not a number shown anywhere else on the host screen
    await butter.getByLabel("Your wager").fill(String(wager));
    await butter.getByRole("button", { name: "Wager" }).click();
    await expect(butter.getByText("✓ Wager sent")).toBeVisible();
    await expect(page.getByText("✓ Wagered")).toHaveCount(1);
    await expect(page.getByText(String(wager))).toHaveCount(0); // the amount stays hidden
    await page.getByRole("button", { name: "Lock wagers, show the clue" }).click();

    const { final } = await hostGame(page);
    await butter.getByLabel("Your answer").fill(plain(final));
    await butter.getByRole("button", { name: "Send" }).click();
    await expect(butter.getByText("✓ Answer sent")).toBeVisible();
    await expect(page.getByText("Answers in: 1 of 2")).toBeVisible();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await expect(page.getByText(/answered “.+” — looks right/)).toBeVisible();
    await expect(page.getByText("no answer sent")).toBeVisible();

    const rows = page.locator("div.rounded-xl", { has: page.getByRole("button", { name: "✓ Right" }) });
    await rows.filter({ hasText: "Team Butter" }).getByRole("button", { name: "✓ Right" }).click();
    await rows.filter({ hasText: "Team Sage" }).getByRole("button", { name: "✗ Wrong" }).click();
    await expect(page.getByText(`(wagered ${wager})`)).toBeVisible(); // shown at the reveal
    await page.getByRole("button", { name: "Crown the winners" }).click();
    await expect(butter.getByText("You win! 🏆")).toBeVisible();
    await expect(sage.getByText("Team Butter wins!")).toBeVisible();

    await sageCtx.close();
    await butterCtx.close();
  });

  test("a wrong game code says so", async ({ page }) => {
    await page.goto("/#/join/ZZZZ/AAAAAAAAAAAAAAAAAAAAAA");
    await expect(page.getByText("That game doesn't exist any more.", { exact: false })).toBeVisible();
  });
});
