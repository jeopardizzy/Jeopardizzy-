// Builds the accent test set for spoken answers: 40 Workbook answers, each
// spoken plainly and with eight strong English accents, as 16 kHz WAVs.
// Uses the same Model Studio TTS as the voice bake (credentials from the
// environment, see tools/voice/tts.mjs). About 360 short requests.
//
// usage (repo root): node tools/kws/accent-samples.mjs
// output: tmp/accent/*.wav + tmp/accent/index.json, scored by tools/kws/accent-eval.mjs
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { checkCredentials, pool, synthesize } from "../voice/tts.mjs";

const ACCENTS = {
  plain: null,
  russian: "Speak English with a strong Russian accent.",
  spanish: "Speak English with a strong Spanish accent.",
  indian: "Speak English with a strong Indian accent.",
  chinese: "Speak English with a strong Mandarin Chinese accent.",
  french: "Speak English with a strong French accent.",
  arabic: "Speak English with a strong Arabic accent.",
  nigerian: "Speak English with a strong Nigerian accent.",
  german: "Speak English with a strong German accent.",
};
const VOICES = ["longanhuan_v3.1", "longanlingxin_v3.1", "longanfengyue_v3.1", "Andy_v3.1"];
const MODEL = "qwen-audio-3.1-tts-flash";

checkCredentials();
const OUT = path.resolve("tmp/accent");
fs.mkdirSync(OUT, { recursive: true });
const r = spawnSync("npx", ["--prefix", "app", "tsx", "tools/kws/accent-phrases.ts"], { encoding: "utf8", shell: true });
if (r.status !== 0) throw new Error(r.stderr);
const phrases = JSON.parse(r.stdout);

const jobs = [];
phrases.forEach(({ phrase, answer }, i) => {
  Object.entries(ACCENTS).forEach(([accent, instruction], a) => {
    const word = phrase.toLowerCase();
    jobs.push({
      id: `${accent}__${String(i).padStart(2, "0")}`,
      accent,
      phrase,
      answer,
      say: (i + a) % 2 ? `I think it's ${word}.` : `${word}.`,
      voice: { model: MODEL, voice: VOICES[(i + a) % VOICES.length], ...(instruction ? { instruction } : {}) },
    });
  });
});

const index = [];
const failed = await pool(jobs, async (j) => {
  const file = path.join(OUT, `${j.id}.wav`);
  if (!fs.existsSync(file)) {
    const tmp = file + ".src.wav";
    fs.writeFileSync(tmp, await synthesize(j.voice, j.say, 24000));
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", tmp, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", file]);
    fs.rmSync(tmp);
  }
  index.push({ id: j.id, accent: j.accent, phrase: j.phrase, answer: j.answer, say: j.say, voice: j.voice.voice });
});
index.sort((a, b) => a.id.localeCompare(b.id));
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(index, null, 1));
console.log(`${index.length} samples in ${OUT}${failed ? ` (${failed} failed — run again to retry)` : ""}`);
