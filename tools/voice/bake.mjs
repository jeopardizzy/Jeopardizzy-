// Bakes the quizmaster voice: every clue, answer, category and host line is
// synthesised once with Alibaba Model Studio (Qwen-Audio TTS) and shipped in
// the app as small MP3s, so the app itself never touches the network.
//
// usage (from the repo root; needs ffmpeg on PATH):
//   node tools/voice/bake.mjs --audition        render tools/voice/audition.json to tmp/voice-audition/
//   node tools/voice/bake.mjs --dry-run         list what would be (re)baked and the character count
//   node tools/voice/bake.mjs [--limit N]       bake into app/public/voice/ (incremental)
//
// credentials come from the environment; see tools/voice/tts.mjs
//
// A clip is rebaked only when its bake key (model, voice, prompt, spoken text,
// encoding) changes, so editing one clue costs one request.
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { checkCredentials, pool as runPool, synthesize as synthesizeAt } from "./tts.mjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../..");
const OUT_DIR = path.join(ROOT, "app/public/voice");
const MANIFEST = path.join(OUT_DIR, "manifest.json");
const CONFIG = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/voice/voice.json"), "utf8"));
const ENCODE = { bitrateK: 40, sampleRate: 24000 }; // mono MP3: plays in every web view
const CONCURRENCY = 3; // Model Studio allows about 3 requests per second per model

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const opt = (f) => (args.includes(f) ? args[args.indexOf(f) + 1] : undefined);

const synthesize = (voice, say) => synthesizeAt(voice, say, ENCODE.sampleRate);

/** WAV → loudness-normalised mono MP3; returns duration in seconds. */
function encode(wav, outFile) {
  const tmp = outFile + ".wav";
  fs.writeFileSync(tmp, wav);
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y", "-i", tmp,
    "-af", "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,loudnorm=I=-16:TP=-1.5:LRA=11",
    "-ac", "1", "-ar", String(ENCODE.sampleRate), "-c:a", "libmp3lame", "-b:a", `${ENCODE.bitrateK}k`, outFile,
  ]);
  fs.rmSync(tmp);
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", outFile], { encoding: "utf8" });
  return Math.round(parseFloat(probe.stdout) * 100) / 100;
}

const bakeKey = (voice, say) =>
  createHash("sha256").update(JSON.stringify([voice, say, ENCODE])).digest("hex").slice(0, 16);

function phrases() {
  const r = spawnSync("npx", ["--prefix", "app", "tsx", "tools/voice/phrases.ts"], { cwd: ROOT, encoding: "utf8", shell: true, maxBuffer: 64 << 20 });
  if (r.status !== 0) throw new Error(r.stderr);
  return JSON.parse(r.stdout);
}

const pool = (items, fn) => runPool(items, fn, CONCURRENCY);

async function audition() {
  const a = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/voice/audition.json"), "utf8"));
  const dir = path.join(ROOT, "tmp/voice-audition");
  fs.mkdirSync(dir, { recursive: true });
  const jobs = a.candidates.flatMap((v) => a.lines.map((line, i) => ({ id: `${v.label}-${i + 1}`, v, line })));
  const failed = await pool(jobs, async ({ id, v, line }) => encode(await synthesize(v, line), path.join(dir, `${id}.mp3`)));
  const rows = a.candidates.map((v) => {
    const head = `<h2>${v.label}</h2><p><code>${v.model}</code> ${v.voice ?? ""} ${v.instruction || v.prompt ? `<br><i>${v.instruction ?? v.prompt}</i>` : ""}</p>`;
    const clips = a.lines.map((l, i) => {
      const file = `${v.label}-${i + 1}.mp3`;
      return fs.existsSync(path.join(dir, file))
        ? `<p>${l}<br><audio controls preload="none" src="${file}"></audio></p>`
        : `<p>${l}<br><i>(not available for this voice)</i></p>`;
    });
    return head + clips.join("");
  });
  fs.writeFileSync(path.join(dir, "index.html"), `<!doctype html><meta charset=utf-8><title>Quizmaster audition</title><body style="font:16px system-ui;max-width:720px;margin:2em auto">${rows.join("<hr>")}`);
  console.log(`audition → ${dir}${failed ? ` (${failed} failed)` : ""}`);
}

async function bake() {
  const voice = CONFIG.voice;
  const all = phrases();
  const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf8")) : { clips: {} };
  const todo = all.filter((p) => manifest.clips[p.id]?.k !== bakeKey(voice, p.say) || !fs.existsSync(path.join(OUT_DIR, `${p.id}.mp3`)));
  const chars = todo.reduce((n, p) => n + p.say.length, 0);
  console.log(`${all.length} lines, ${todo.length} to bake (${chars.toLocaleString()} characters) with ${voice.model} ${voice.voice ?? ""}`);
  if (flag("--dry-run")) return;
  const limit = Number(opt("--limit") ?? todo.length);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const save = () => fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0));
  let sinceSave = 0;
  const failed = await pool(todo.slice(0, limit), async (p) => {
    const d = encode(await synthesize(voice, p.say), path.join(OUT_DIR, `${p.id}.mp3`));
    manifest.clips[p.id] = { d, k: bakeKey(voice, p.say) };
    if (++sinceSave >= 25) { sinceSave = 0; save(); }
  });
  // drop clips for lines that no longer exist
  const live = new Set(all.map((p) => p.id));
  for (const id of Object.keys(manifest.clips)) {
    if (!live.has(id)) { delete manifest.clips[id]; fs.rmSync(path.join(OUT_DIR, `${id}.mp3`), { force: true }); }
  }
  manifest.version = 1;
  manifest.voice = { model: voice.model, voice: voice.voice ?? null };
  save();
  console.log(failed ? `done with ${failed} failures — run again to retry` : "done");
  if (failed) process.exitCode = 1;
}

if (!flag("--dry-run")) {
  try {
    checkCredentials();
  } catch (e) {
    console.error(e.message);
    process.exit(2);
  }
}
if (flag("--audition")) await audition();
else await bake();
