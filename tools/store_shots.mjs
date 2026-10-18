// Captures the seven store screenshots from the production web build.
//
// usage (from the repo root, with `npm --prefix app run preview -- --port 4918` running):
//   node tools/store_shots.mjs app docs/listing http://localhost:4918 [preset ...]
// presets: play-phone (1082x2402), iphone-6.9 (1320x2868), iphone-6.3 (1206x2622),
//          ipad-13 (2064x2752; also used for Play's tablet slots). Default: all.
//
// The app runs as on a phone with nothing bought: a stand-in for the native
// bridge answers the store calls the way the real store does (price $4.99,
// no purchases), so lock badges and the Full Club sheet look as users see them.
import { createRequire } from "node:module";
import path from "node:path";
import fs from "node:fs";

const PRESETS = {
  "play-phone": { viewport: { width: 541, height: 1201 }, deviceScaleFactor: 2, isMobile: true },
  "iphone-6.9": { viewport: { width: 440, height: 956 }, deviceScaleFactor: 3, isMobile: true },
  "iphone-6.3": { viewport: { width: 402, height: 874 }, deviceScaleFactor: 3, isMobile: true },
  "ipad-13": { viewport: { width: 1032, height: 1376 }, deviceScaleFactor: 2, isMobile: false },
};

const [appDir, outRoot, base, ...wanted] = process.argv.slice(2);
const presets = wanted.length ? wanted : Object.keys(PRESETS);
const require = createRequire(path.resolve(appDir, "package.json"));
const { chromium } = require("@playwright/test");

const storeStandIn = () => {
  window.webkit = { messageHandlers: { bridge: { postMessage: () => {} } } };
  const answers = {
    getProducts: { products: [{ identifier: "full_club", priceString: "$4.99" }] },
    getPurchases: { purchases: [] },
  };
  window.Capacitor = {
    PluginHeaders: [
      {
        name: "NativePurchases",
        methods: [
          { name: "getProducts", rtype: "promise" },
          { name: "getPurchases", rtype: "promise" },
          { name: "addListener", rtype: "callback" },
        ],
      },
    ],
    nativePromise: async (_plugin, method) => answers[method] ?? {},
    nativeCallback: () => "cb-1",
  };
};

const browser = await chromium.launch();
for (const name of presets) {
  const p = PRESETS[name];
  if (!p) throw new Error(`unknown preset ${name}`);
  const outDir = path.join(outRoot, name);
  fs.mkdirSync(outDir, { recursive: true });
  const ctx = await browser.newContext({ ...p, hasTouch: true, reducedMotion: "reduce" });
  await ctx.addInitScript(storeStandIn);
  const page = await ctx.newPage();
  const shot = async (file) => {
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(outDir, `${file}.png`) });
  };

  // 1 home
  await page.goto(base + "/#/");
  await page.getByRole("heading", { name: "Daily Board" }).waitFor();
  await shot("shot-1-home");

  // 2 sets (free tier: locks visible)
  await page.goto(base + "/#/sets");
  await page.getByRole("heading", { name: "Choose your board" }).waitFor();
  await shot("shot-2-sets");

  // 3 board: Idiom Arena I part 1 (free), default teams
  await page.getByRole("button", { name: /Play Idiom Arena I · Part 1 of 2$/ }).click();
  await page.getByRole("button", { name: "Start the game" }).click();
  await page.locator("[role='gridcell']").first().waitFor();
  await shot("shot-3-board");

  // 4 clue revealed, award buttons showing
  await page.locator("[role='gridcell']").first().click();
  await page.getByRole("button", { name: "Reveal answer" }).click();
  await page.getByText(/The answer is/).waitFor();
  await shot("shot-4-award");

  // 5 podium: award a few clues to the first team, then finish early
  const firstTeam = await page.locator("[role='listitem']").first().innerText();
  const teamName = firstTeam.split("\n").find((s) => /\D/.test(s)).trim();
  await page.getByRole("dialog").getByRole("button", { name: teamName, exact: true }).click();
  for (let i = 0; i < 4; i++) {
    await page.locator("[role='gridcell']:not([disabled])").nth((i * 5) % 20).click();
    await page.getByRole("button", { name: "Reveal answer" }).click();
    await page.getByRole("dialog").getByRole("button", { name: teamName, exact: true }).click();
  }
  await page.getByRole("button", { name: "Finish game" }).click();
  await page.getByRole("dialog", { name: "Finish the game early" }).getByRole("button", { name: "Straight to results" }).click();
  await page.getByText(/wins!|Final score/).first().waitFor({ timeout: 10000 });
  await shot("shot-5-podium");

  // 6 workbook
  await page.goto(base + "/#/workbook");
  await page.getByRole("button", { name: /Homonyms/ }).first().waitFor();
  await shot("shot-6-workbook");

  // 7 Full Club sheet
  await page.goto(base + "/#/sets");
  await page.getByRole("button", { name: /Play Championship.* — Full Club/ }).click();
  await page.getByRole("dialog", { name: "Full Club" }).getByRole("button", { name: "Unlock for $4.99" }).waitFor();
  await shot("shot-7-fullclub");

  await ctx.close();
  console.log("captured", name);
}
await browser.close();
