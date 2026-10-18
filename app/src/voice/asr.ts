/**
 * Second pass for spoken Workbook answers: when keyword spotting misses,
 * the same audio is transcribed on the device by Moonshine tiny (sherpa-onnx
 * WebAssembly in public/asr/asr-worker.js) and checked with spokenMatch.
 * Measured on 360 accented samples: keyword spotting 80% → both passes 92%,
 * with no wrong answers accepted. Nothing leaves the device.
 */

const WORKER_URL = `${import.meta.env.BASE_URL ?? "/"}asr/asr-worker.js`;
/** loading the model takes a few seconds the first time; decoding well under one */
const FIRST_TIMEOUT_MS = 30_000;
const TIMEOUT_MS = 8_000;

let worker: Worker | null = null;
let ready: Promise<void> | null = null;
/** the model has finished loading (not just started) */
let loaded = false;
let nextId = 1;
const waiting = new Map<number, (r: { text?: string; error?: string }) => void>();

function start(): Promise<void> {
  if (ready) return ready;
  ready = new Promise<void>((resolve, reject) => {
    try {
      worker = new Worker(WORKER_URL);
    } catch (e) {
      return reject(e);
    }
    worker.onmessage = (e: MessageEvent) => {
      const m = e.data as { ready?: boolean; failed?: string; id?: number; text?: string; error?: string };
      if (m.ready) {
        loaded = true;
        return resolve();
      }
      if (m.failed) return reject(new Error(m.failed));
      if (m.id !== undefined) {
        waiting.get(m.id)?.(m);
        waiting.delete(m.id);
      }
    };
    worker.onerror = () => reject(new Error("speech-to-text worker failed"));
  });
  ready.catch(() => {
    worker?.terminate();
    worker = null;
    ready = null; // allow a later retry
  });
  return ready;
}

/** Start loading the model in the background (e.g. when the microphone opens). */
export function preloadAsr(): void {
  void start().catch(() => {});
}

/** Transcribe 16 kHz mono audio. Rejects if the engine can't load or takes too long. */
export async function transcribe(samples: Float32Array): Promise<string> {
  const first = !loaded;
  await withTimeout(start(), FIRST_TIMEOUT_MS);
  const id = nextId++;
  const result = new Promise<{ text?: string; error?: string }>((resolve) => waiting.set(id, resolve));
  worker!.postMessage({ id, samples }, [samples.buffer]);
  const r = await withTimeout(result, first ? FIRST_TIMEOUT_MS : TIMEOUT_MS).finally(() => waiting.delete(id));
  if (r.error) throw new Error(r.error);
  return r.text ?? "";
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}
