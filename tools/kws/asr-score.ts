// Scores speech-to-text transcripts of the accent test set with the app's own
// spoken-answer matching (app/src/lib/spokenMatch.ts), alone and as a second
// pass after keyword spotting. Inputs: tmp/accent/index.json, transcripts.json (tools/kws/asr-eval.py),
// results.json (tools/kws/accent-eval.mjs).
//
// usage (repo root): npx --prefix app tsx tools/kws/asr-score.ts
import fs from "node:fs";
import { heardIn } from "../../app/src/lib/spokenMatch";

interface Sample { id: string; accent: string; phrase: string; answer: string; say: string }
const index: Sample[] = JSON.parse(fs.readFileSync("tmp/accent/index.json", "utf8"));
const transcripts: Record<string, { texts: Record<string, string>; decode_s: number; audio_s: number }> = JSON.parse(
  fs.readFileSync("tmp/accent/transcripts.json", "utf8"),
);
const kws: { id: string; leniency: number; outcome: string }[] = JSON.parse(fs.readFileSync("tmp/accent/results.json", "utf8"));
const kwsOutcome = new Map(kws.filter((r) => r.leniency === 1).map((r) => [r.id, r.outcome]));

const answers = [...new Set(index.map((s) => s.answer))];
const pct = (n: number, d: number) => `${Math.round((100 * n) / d)}%`.padStart(5);

for (const [model, t] of Object.entries(transcripts)) {
  const rows = index.map((s, i) => {
    const text = t.texts[s.id] ?? "";
    const right = heardIn(text, s.answer);
    // would it wrongly accept this audio as one of four other answers?
    const others = [1, 2, 3, 4].map((k) => answers[(answers.indexOf(s.answer) + k * 7) % answers.length]).filter((a) => a !== s.answer);
    const wrongAccept = others.some((a) => heardIn(text, a));
    const k = kwsOutcome.get(s.id);
    const combined = k === "hit" || (k !== "wrong" && right);
    return { s, i, text, right, wrongAccept, combined };
  });
  console.log(`\n${model}  (${(t.decode_s / index.length).toFixed(2)} s per answer on the Mac)`);
  console.log("accent      alone  +KWS first  wrong-accept");
  for (const a of [...new Set(index.map((s) => s.accent)), "ALL"]) {
    const g = a === "ALL" ? rows : rows.filter((r) => r.s.accent === a);
    console.log(
      `${a.padEnd(10)} ${pct(g.filter((r) => r.right).length, g.length)} ${pct(g.filter((r) => r.combined).length, g.length).padStart(11)} ${pct(g.filter((r) => r.wrongAccept).length, g.length).padStart(13)}`,
    );
  }
  const misses = rows.filter((r) => !r.combined).slice(0, 8).map((r) => `${r.s.phrase} [${r.s.accent}] heard "${r.text}"`);
  if (misses.length) console.log("  e.g. still missed:", misses.join(" | "));
}
const k = [...kwsOutcome.values()];
console.log(`\nkeyword spotting alone (for reference): ${pct(k.filter((o) => o === "hit").length, k.length)}`);
