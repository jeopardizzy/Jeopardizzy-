// Fails the build when generated runtime assets are missing, so a checkout
// without them (e.g. a source-only ZIP) can't produce a silent quizmaster or
// a Say it button that can never load. Runs before every `npm run build`.
//
// Missing voice clips: bake them (tools/voice/bake.mjs). Missing model files:
// build them (tools/kws/build-wasm-kws.sh, build-wasm-asr.sh) or restore
// app/public/kws and app/public/asr from the repository.
import fs from "node:fs";
import path from "node:path";

const pub = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../public");
const problems = [];

const manifest = JSON.parse(fs.readFileSync(path.join(pub, "voice/manifest.json"), "utf8"));
const ids = Object.keys(manifest.clips);
const missingClips = ids.filter((id) => !fs.existsSync(path.join(pub, "voice", `${id}.mp3`)));
if (missingClips.length) {
  problems.push(`${missingClips.length} of ${ids.length} voice clips listed in voice/manifest.json are missing (e.g. ${missingClips[0]}.mp3)`);
}

const models = [
  "kws/sherpa-onnx-wasm-kws-main.wasm",
  "kws/sherpa-onnx-wasm-kws-main.data",
  "kws/sherpa-onnx-wasm-kws-main.js",
  "asr/sherpa-onnx-wasm-main-vad-asr.wasm",
  "asr/sherpa-onnx-wasm-main-vad-asr.data",
  "asr/sherpa-onnx-wasm-main-vad-asr.js",
];
for (const f of models) {
  const full = path.join(pub, f);
  if (!fs.existsSync(full) || fs.statSync(full).size === 0) problems.push(`speech model file missing: public/${f}`);
}

if (problems.length) {
  console.error("Missing generated assets:\n  - " + problems.join("\n  - "));
  process.exit(1);
}
console.log(`assets ok: ${ids.length} voice clips, ${models.length} speech model files`);
