// Scores spoken-answer recognition on the accent test set (tmp/accent, made by
// tools/kws/accent-samples.mjs) with the app's real engine, in headless Chrome.
//
// usage (repo root): node tools/kws/accent-eval.mjs [leniency ...]   (default: 1 0.6)
//
// For every sample, at every leniency:
//   hit         the right answer is the first thing heard
//   wrong       another answer is heard first (a would-be wrong grade)
//   miss        nothing heard ("didn't catch that")
//   false alarm the same audio, listening only for OTHER answers, triggers one
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

const require = createRequire(path.resolve("app/package.json"));
const { chromium } = require("@playwright/test");
const { createServer } = await import(require.resolve("vite"));

const leniencies = process.argv.slice(2).map(Number).filter((n) => n > 0);
if (leniencies.length === 0) leniencies.push(1, 0.6);

const DIR = path.resolve("tmp/accent");
const index = JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf8"));
const tokens = JSON.parse(fs.readFileSync("app/src/data/kwsTokens.json", "utf8"));
const phrases = [...new Set(index.map((s) => s.phrase))];

/** 16-bit PCM WAV → plain array of floats in [-1, 1]. */
function readWav(file) {
  const b = fs.readFileSync(file);
  let off = 12;
  while (off < b.length) {
    const id = b.toString("ascii", off, off + 4);
    const size = b.readUInt32LE(off + 4);
    if (id === "data") {
      const out = new Array(size / 2);
      for (let i = 0; i < out.length; i++) out[i] = b.readInt16LE(off + 8 + i * 2) / 32768;
      return out;
    }
    off += 8 + size + (size % 2);
  }
  throw new Error(`no data chunk in ${file}`);
}

const server = await createServer({ root: path.resolve("app"), server: { port: 4932, strictPort: true }, logLevel: "error" });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:4932/");
await page.evaluate(async () => {
  window.__kws = await import("/src/voice/kws.ts");
  await window.__kws.loadKws();
});

const rows = [];
for (const s of index) {
  const samples = readWav(path.join(DIR, `${s.id}.wav`));
  const i = phrases.indexOf(s.phrase);
  const others = [1, 2, 3, 4].map((k) => phrases[(i + k * 7) % phrases.length]).filter((p) => p !== s.phrase);
  const withAnswer = [{ label: "g0", tokens: tokens[s.phrase] }, ...others.map((p, k) => ({ label: `x${k}`, tokens: tokens[p] }))];
  const withoutAnswer = [...others, phrases[(i + 35) % phrases.length]]
    .filter((p) => p !== s.phrase)
    .map((p, k) => ({ label: `x${k}`, tokens: tokens[p] }));
  for (const leniency of leniencies) {
    const r = await page.evaluate(
      async ({ samples, withAnswer, withoutAnswer, leniency }) => {
        const f = Float32Array.from(samples);
        const heard = await window.__kws.spotSamples(withAnswer, f, leniency);
        const alarm = await window.__kws.spotSamples(withoutAnswer, f, leniency);
        return { first: heard[0] ?? null, alarm: alarm.length > 0 };
      },
      { samples, withAnswer, withoutAnswer, leniency },
    );
    const outcome = r.first === "g0" ? "hit" : r.first ? "wrong" : "miss";
    rows.push({ ...s, leniency, outcome, falseAlarm: r.alarm });
  }
}
await browser.close();
await server.close();

const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : "-");
for (const leniency of leniencies) {
  const at = rows.filter((r) => r.leniency === leniency);
  console.log(`\nleniency ${leniency}`);
  console.log("accent      hit   wrong  miss  false-alarm");
  const accents = [...new Set(at.map((r) => r.accent)), "ALL"];
  for (const a of accents) {
    const g = a === "ALL" ? at : at.filter((r) => r.accent === a);
    const c = (o) => g.filter((r) => r.outcome === o).length;
    console.log(
      `${a.padEnd(10)} ${pct(c("hit"), g.length).padStart(5)} ${pct(c("wrong"), g.length).padStart(6)} ${pct(c("miss"), g.length).padStart(5)} ${pct(g.filter((r) => r.falseAlarm).length, g.length).padStart(10)}`,
    );
  }
}
fs.writeFileSync(path.join(DIR, "results.json"), JSON.stringify(rows, null, 1));
console.log(`\nper-sample results: ${path.join(DIR, "results.json")}`);
