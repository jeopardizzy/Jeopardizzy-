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
import { pathToFileURL } from "node:url";

const require = createRequire(path.resolve("app/package.json"));
const { chromium } = require("@playwright/test");
const { createServer } = await import(pathToFileURL(require.resolve("vite")).href);

// tuning overrides for experiments, e.g. --tune '{"maxActivePaths":8,"boost":3}'
const argv = process.argv.slice(2);
const tuneAt = argv.indexOf("--tune");
const tune = tuneAt >= 0 ? JSON.parse(argv.splice(tuneAt, 2)[1]) : {};
const leniencies = argv.map(Number).filter((n) => n > 0);
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
// --second-pass: misses go to the app's speech-to-text worker (src/voice/asr.ts), as SpokenAnswer.tsx does
const secondPass = argv.includes("--second-pass");
if (secondPass) argv.splice(argv.indexOf("--second-pass"), 1);
await page.evaluate(async (tune) => {
  window.__kws = await import("/src/voice/kws.ts");
  window.__targets = await import("/src/lib/spokenTargets.ts");
  window.__asr = await import("/src/voice/asr.ts");
  window.__match = await import("/src/lib/spokenMatch.ts");
  Object.assign(window.__kws.KWS_TUNING, tune);
  await window.__kws.loadKws();
}, tune);
if (Object.keys(tune).length) console.log("tuning:", JSON.stringify(tune));
const answerOf = Object.fromEntries(index.map((s) => [s.phrase, s.answer]));

// what the app listens for: every alternative of the answer ("ATE" or "EIGHT"), like SpokenAnswer.tsx,
// plus accent respellings depending on --variants always|retry|off (default: off)
const variantsAt = argv.indexOf("--variants") >= 0 ? argv.splice(argv.indexOf("--variants"), 2)[1] : "off";
const alternatives = {};
const variants = {};
for (const s of index) {
  if (!alternatives[s.answer]) {
    const groups = await page.evaluate((a) => window.__targets.spokenTargets(a), s.answer);
    alternatives[s.answer] = groups[0].filter((p) => tokens[p]);
    const v = await page.evaluate((ps) => ps.flatMap((p) => window.__targets.accentVariants(p)), alternatives[s.answer]);
    variants[s.answer] = v.filter((p) => tokens[p]);
  }
}
console.log(`variants: ${variantsAt}`);
const phraseVariants = {};
for (const p of phrases) {
  phraseVariants[p] = (await page.evaluate((q) => window.__targets.accentVariants(q), p)).filter((v) => tokens[v]);
}
const useVariants = (leniency) => variantsAt === "always" || (variantsAt === "retry" && leniency < 1);

const rows = [];
for (const s of index) {
  const samples = readWav(path.join(DIR, `${s.id}.wav`));
  const i = phrases.indexOf(s.phrase);
  const others = [1, 2, 3, 4].map((k) => phrases[(i + k * 7) % phrases.length]).filter((p) => p !== s.phrase);
  const withAnswer = [
    ...alternatives[s.answer].map((p) => ({ label: "g0", tokens: tokens[p] })),
    ...others.map((p, k) => ({ label: `x${k}`, tokens: tokens[p] })),
  ];
  const withoutAnswer = [...others, phrases[(i + 35) % phrases.length]]
    .filter((p) => p !== s.phrase)
    .map((p, k) => ({ label: `x${k}`, tokens: tokens[p], phrase: p }));
  for (const leniency of leniencies) {
    const extra = useVariants(leniency) ? variants[s.answer].map((p) => ({ label: "g0", tokens: tokens[p] })) : [];
    const listenFor = [...withAnswer, ...extra];
    // false alarms: other answers' respellings must not fire on this audio either
    const alarmTargets = useVariants(leniency)
      ? [...withoutAnswer, ...withoutAnswer.flatMap((t) => phraseVariants[t.phrase].map((v) => ({ ...t, tokens: tokens[v] })))]
      : withoutAnswer;
    const r = await page.evaluate(
      async ({ samples, withAnswer, withoutAnswer, leniency }) => {
        const f = Float32Array.from(samples);
        const heard = await window.__kws.spotSamples(withAnswer, f, leniency);
        const alarm = await window.__kws.spotSamples(withoutAnswer, f, leniency);
        return { first: heard[0] ?? null, alarm: alarm[0] ?? null };
      },
      { samples, withAnswer: listenFor, withoutAnswer: alarmTargets, leniency },
    );
    const outcome = r.first === "g0" ? "hit" : r.first ? "wrong" : "miss";
    const alarmPhrase = r.alarm ? withoutAnswer.find((t) => t.label === r.alarm)?.phrase : null;
    let combined = outcome, transcript = null, asrMs = null;
    if (secondPass && outcome === "miss") {
      const t = await page.evaluate(
        async ({ samples, answer, otherAnswers }) => {
          const t0 = performance.now();
          const text = await window.__asr.transcribe(Float32Array.from(samples));
          const ms = Math.round(performance.now() - t0);
          const right = window.__match.heardIn(text, answer);
          const wrong = !right && otherAnswers.some((o) => window.__match.heardIn(text, o));
          return { text, ms, right, wrong };
        },
        { samples, answer: s.answer, otherAnswers: others.map((p) => answerOf[p]) },
      );
      combined = t.right ? "hit" : t.wrong ? "wrong" : "miss";
      transcript = t.text;
      asrMs = t.ms;
    }
    rows.push({ ...s, leniency, outcome, falseAlarm: !!r.alarm, alarmPhrase, combined, transcript, asrMs });
  }
}
await browser.close();
await server.close();

const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : "-");
for (const leniency of leniencies) {
  const at = rows.filter((r) => r.leniency === leniency);
  console.log(`\nleniency ${leniency}`);
  console.log(`accent      hit   wrong  miss  false-alarm${secondPass ? "   both-passes hit  wrong" : ""}`);
  const accents = [...new Set(at.map((r) => r.accent)), "ALL"];
  for (const a of accents) {
    const g = a === "ALL" ? at : at.filter((r) => r.accent === a);
    const c = (o) => g.filter((r) => r.outcome === o).length;
    const cc = (o) => g.filter((r) => r.combined === o).length;
    console.log(
      `${a.padEnd(10)} ${pct(c("hit"), g.length).padStart(5)} ${pct(c("wrong"), g.length).padStart(6)} ${pct(c("miss"), g.length).padStart(5)} ${pct(g.filter((r) => r.falseAlarm).length, g.length).padStart(10)}` +
        (secondPass ? `   ${pct(cc("hit"), g.length).padStart(12)} ${pct(cc("wrong"), g.length).padStart(6)}` : ""),
    );
  }
  if (secondPass) {
    const ms = at.filter((r) => r.asrMs !== null).map((r) => r.asrMs).sort((x, y) => x - y);
    if (ms.length) console.log(`speech-to-text in the browser: ${ms.length} runs, median ${ms[ms.length >> 1]} ms, first ${at.find((r) => r.asrMs !== null).asrMs} ms (includes loading)`);
  }
}
fs.writeFileSync(path.join(DIR, "results.json"), JSON.stringify(rows, null, 1));
console.log(`\nper-sample results: ${path.join(DIR, "results.json")}`);
