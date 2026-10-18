// End-to-end check of on-device listening without a phone: Chrome takes a WAV
// file as its microphone, and the app's real src/voice/kws.ts listens to it.
//
// usage (repo root, with `npm --prefix app run dev -- --port 4931` running):
//   node tools/kws/test-listen.mjs <wav> <expected phrase> <wrong phrase> [more wrong phrases...]
// prints the labels heard: "g0" = the expected phrase, "x0".. = wrong ones.
import { createRequire } from "node:module";
import path from "node:path";

const [wav, expected, ...wrong] = process.argv.slice(2);
const require = createRequire(path.resolve("app/package.json"));
const { chromium } = require("@playwright/test");

const browser = await chromium.launch({
  args: [
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-audio-capture=${path.resolve(wav)}`,
    "--autoplay-policy=no-user-gesture-required",
  ],
});
const page = await browser.newPage();
await page.goto("http://localhost:4931/");
const heard = await page.evaluate(
  async ({ expected, wrong }) => {
    const kws = await import("/src/voice/kws.ts");
    const tokens = (await import("/src/data/kwsTokens.json")).default;
    const targets = [
      { label: "g0", tokens: tokens[expected] },
      ...wrong.map((w, i) => ({ label: `x${i}`, tokens: tokens[w] })),
    ];
    if (targets.some((t) => !t.tokens)) return { error: "no tokens for a phrase" };
    const t0 = performance.now();
    const s = kws.listen(targets, (labels) => labels.length > 0, 8000);
    const r = await s.result;
    return { ...r, ms: Math.round(performance.now() - t0) };
  },
  { expected, wrong },
);
console.log(JSON.stringify({ wav: path.basename(wav), expected, heard }));
await browser.close();
