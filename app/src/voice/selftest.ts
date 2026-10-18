/**
 * On-device diagnostics for spoken answers, only in builds made with
 * VITE_VOICE_SELFTEST=1 (never in releases). Runs the same engine steps as
 * "Say it" without the microphone and logs each one, so a phone connected
 * to the build Mac can be checked from its console:
 *   xcrun devicectl device process launch --console ... com.quizzicalclub.app
 */
import { loadKws, spotSamples } from "./kws";
import { transcribe } from "./asr";
import TOKENS from "../data/kwsTokens.json";

const log = (...a: unknown[]) => console.log("[voice-selftest]", ...a);

export async function runVoiceSelftest(): Promise<void> {
  const t0 = performance.now();
  const ms = () => `${Math.round(performance.now() - t0)} ms`;
  log("start", navigator.userAgent, `deviceMemory=${(navigator as { deviceMemory?: number }).deviceMemory ?? "?"}`);
  try {
    const { mod } = await loadKws();
    log("keyword engine loaded", ms(), `heap ${Math.round(mod.HEAPF32.buffer.byteLength / 1048576)} MB`);
    const tokens = (TOKENS as Record<string, string>)["MAYONNAISE"];
    const labels = await spotSamples([{ label: "g0", tokens }], new Float32Array(16000));
    log("keyword stream ok", ms(), JSON.stringify(labels));
  } catch (e) {
    log("KEYWORD FAIL", ms(), String((e as { message?: string })?.message ?? e));
  }
  try {
    const text = await transcribe(new Float32Array(16000));
    log("speech-to-text ok", ms(), JSON.stringify(text));
  } catch (e) {
    log("SPEECH-TO-TEXT FAIL", ms(), String((e as { message?: string })?.message ?? e));
  }
  log("done", ms());
}
