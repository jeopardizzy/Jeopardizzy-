// Captures six App Store screenshots at iPad 13" size (1032x1376 pt @2x = 2064x2752 px)
// from the production web build served by `vite preview`.
// usage (from the repo root, with `npm --prefix app run preview -- --port 4918` running):
//   node tools/ipad_shots.mjs app docs/listing/ipad-13 http://localhost:4918
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const [appDir, outDir, base] = process.argv.slice(2);
const require = createRequire(path.join(appDir, "package.json"));
const { chromium } = require("@playwright/test");
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1032, height: 1376 },
  deviceScaleFactor: 2,
  hasTouch: true,
  reducedMotion: "reduce",
});
const page = await ctx.newPage();
const shot = async (name) => {
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(outDir, `${name}-ipad13.png`) });
  console.log("shot", name);
};

// 1 home
await page.goto(base + "/#/");
await page.getByRole("heading", { name: "Daily Jeopardy" }).waitFor();
await shot("shot-1-home");

// 2 sets
await page.goto(base + "/#/sets");
await page.waitForLoadState("networkidle");
await shot("shot-2-sets");

// 3 board: first Idiom Arena set, default teams
await page.getByRole("button", { name: /Idiom Arena I\b/ }).first().click();
await page.getByRole("button", { name: "Start the game" }).click();
await page.locator("[role='gridcell']").first().waitFor();
await shot("shot-3-board");

// 4 clue revealed, award buttons showing
await page.locator("[role='gridcell']").first().click();
await page.getByRole("dialog").waitFor();
await page.getByRole("button", { name: "Reveal answer" }).click();
await page.getByText(/The answer is/).waitFor();
await shot("shot-4-award");

// award this and a few more clues to the first team, then finish early
const firstTeam = await page.locator("[role='listitem']").first().innerText();
const teamName = firstTeam.split("\n").find((s) => /\D/.test(s)).trim();
await page.getByRole("dialog").getByRole("button", { name: teamName, exact: true }).click();
for (let i = 0; i < 4; i++) {
  await page.locator("[role='gridcell']:not([disabled])").nth(i * 5 % 20).click();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await page.getByRole("dialog").getByRole("button", { name: teamName, exact: true }).click();
}
await page.getByRole("button", { name: "Finish game" }).click();
const early = page.getByRole("dialog", { name: "Finish the game early" });
await early.waitFor();
await early.getByRole("button", { name: "Straight to results" }).first().click();
await page.getByText(/wins!|Final score/).first().waitFor({ timeout: 10000 });
await shot("shot-5-podium");

// 6 workbook
await page.goto(base + "/#/workbook");
await page.getByRole("button", { name: /Homonyms/ }).first().waitFor();
await shot("shot-6-workbook");

await browser.close();
