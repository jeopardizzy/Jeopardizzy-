/**
 * On-device keyword spotting for spoken Workbook answers, PawWalk-style:
 * sherpa-onnx compiled to WebAssembly (tools/kws/build-wasm-kws.sh) with the
 * GigaSpeech 3.3M English keyword model. Audio goes from the microphone into
 * the spotter in memory and is never recorded, stored or sent anywhere; the
 * only output is which expected phrase was heard.
 *
 * The engine (≈ a few MB) loads only when a player turns spoken answers on.
 */

const BASE = `${import.meta.env.BASE_URL ?? "/"}kws/`;
const SAMPLE_RATE = 16000;

/* Minimal typing of the Emscripten module and upstream's wrapper. */
interface SherpaModule {
  HEAPF32: Float32Array;
  _malloc(n: number): number;
  _free(p: number): void;
  lengthBytesUTF8(s: string): number;
  stringToUTF8(s: string, p: number, n: number): void;
  _SherpaOnnxCreateKeywordStreamWithKeywords(spotter: number, keywords: number): number;
  _SherpaOnnxOnlineStreamAcceptWaveform(stream: number, sampleRate: number, samples: number, n: number): void;
  _SherpaOnnxDestroyOnlineStream(stream: number): void;
}
interface UpstreamKws {
  handle: number;
  isReady(s: { handle: number }): boolean;
  decode(s: { handle: number }): void;
  getResult(s: { handle: number }): { keyword: string };
  reset(s: { handle: number }): void;
}
declare global {
  interface Window {
    Module?: Record<string, unknown>;
    createKws?: (m: unknown, config: unknown) => UpstreamKws;
  }
}

let engine: Promise<{ mod: SherpaModule; kws: UpstreamKws }> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`could not load ${src}`));
    document.head.appendChild(s);
  });
}

function spotterConfig() {
  const m = "epoch-12-avg-2-chunk-16-left-64";
  return {
    featConfig: { sampleRate: SAMPLE_RATE, featureDim: 80 },
    modelConfig: {
      transducer: { encoder: `./encoder-${m}.onnx`, decoder: `./decoder-${m}.onnx`, joiner: `./joiner-${m}.onnx` },
      tokens: "./tokens.txt",
      provider: "cpu",
      modelType: "",
      numThreads: 1,
      debug: 0,
      modelingUnit: "bpe",
      bpeVocab: "",
    },
    maxActivePaths: 4,
    numTrailingBlanks: 1,
    keywordsScore: 1.0,
    keywordsThreshold: 0.25,
    keywords: "▁THE @the",
  };
}

/** Load the WebAssembly spotter once. Rejects if the device can't run it. */
export function loadKws(): Promise<{ mod: SherpaModule; kws: UpstreamKws }> {
  if (!engine) {
    engine = (async () => {
      await loadScript(`${BASE}sherpa-onnx-kws.js`);
      const ready = new Promise<SherpaModule>((resolve) => {
        window.Module = {
          locateFile: (path: string) => `${BASE}${path}`,
          onRuntimeInitialized: () => resolve(window.Module as unknown as SherpaModule),
        };
      });
      await loadScript(`${BASE}sherpa-onnx-wasm-kws-main.js`);
      const mod = await ready;
      if (!window.createKws) throw new Error("keyword spotter wrapper missing");
      return { mod, kws: window.createKws(mod, spotterConfig()) };
    })();
    engine.catch(() => {
      engine = null; // allow a later retry
    });
  }
  return engine;
}

export interface KeywordTarget {
  /** label reported when heard, e.g. "g0" (answer group 0) or "x2" (a wrong answer) */
  label: string;
  /** model tokens, from app/src/data/kwsTokens.json */
  tokens: string;
}

export interface Heard {
  /** labels heard, in order */
  labels: string[];
  /** listening ended because the caller's `done` said so (not by timeout or stop) */
  complete: boolean;
  /** why nothing could be heard: no microphone access, or the engine didn't load */
  error?: "mic" | "engine";
}

export interface ListenSession {
  result: Promise<Heard>;
  /** stop early (the "Done" button, leaving the screen) */
  stop(): void;
}

/** Downsample by averaging, as upstream's demo does. */
function downsample(input: Float32Array, from: number): Float32Array {
  if (from === SAMPLE_RATE) return input;
  const ratio = from / SAMPLE_RATE;
  const out = new Float32Array(Math.floor(input.length / ratio));
  for (let i = 0, j = 0; i < out.length; i++) {
    const next = Math.floor((i + 1) * ratio);
    let sum = 0, n = 0;
    for (; j < next && j < input.length; j++, n++) sum += input[j];
    out[i] = n ? sum / n : 0;
  }
  return out;
}

/**
 * Trigger threshold by length: short words need a confident match (they are
 * easy to hit by accident), long ones a gentler one (each extra piece makes a
 * full match harder, and an accidental one rarer). `leniency` below 1 lowers
 * every bar, for accented speech and second tries.
 */
export function thresholdFor(tokens: string, leniency = 1): number {
  const pieces = tokens.trim().split(/\s+/).length;
  const base = Math.max(0.08, Math.min(0.3, 0.36 - 0.04 * pieces));
  return Math.round(Math.max(0.05, base * leniency) * 100) / 100;
}

/** The keywords string the spotter takes: one "<tokens> :boost #threshold @label" per line. */
export function keywordsSpec(targets: KeywordTarget[], leniency = 1): string {
  const boost = leniency < 1 ? 2.5 : 2.0;
  return targets.map((t) => `${t.tokens} :${boost} #${thresholdFor(t.tokens, leniency)} @${t.label}`).join("\n");
}

/** One keyword stream: feed 16 kHz audio, collect the labels it spots. */
interface Spotter {
  feed(samples: Float32Array): string[];
  close(): void;
}

async function openSpotter(targets: KeywordTarget[], leniency: number): Promise<Spotter> {
  const { mod: m, kws } = await loadKws();
  const spec = keywordsSpec(targets, leniency);
  const n = m.lengthBytesUTF8(spec) + 1;
  const p = m._malloc(n);
  m.stringToUTF8(spec, p, n);
  const handle = m._SherpaOnnxCreateKeywordStreamWithKeywords(kws.handle, p);
  m._free(p);
  if (!handle) throw new Error("keywords rejected");
  const stream = { handle };
  let buf = 0, bufLen = 0;
  return {
    feed(samples) {
      if (samples.length > bufLen) {
        if (buf) m._free(buf);
        buf = m._malloc(samples.length * 4);
        bufLen = samples.length;
      }
      m.HEAPF32.set(samples, buf / 4);
      m._SherpaOnnxOnlineStreamAcceptWaveform(handle, SAMPLE_RATE, buf, samples.length);
      const heard: string[] = [];
      while (kws.isReady(stream)) {
        kws.decode(stream);
        const r = kws.getResult(stream);
        if (r.keyword) {
          heard.push(r.keyword);
          kws.reset(stream);
        }
      }
      return heard;
    },
    close() {
      m._SherpaOnnxDestroyOnlineStream(handle);
      if (buf) m._free(buf);
    },
  };
}

/**
 * Spot phrases in recorded 16 kHz audio, exactly as listen() would hear it
 * from the microphone. Used by the accuracy tests (tools/kws/accent-eval.mjs).
 */
export async function spotSamples(targets: KeywordTarget[], samples: Float32Array, leniency = 1): Promise<string[]> {
  const s = await openSpotter(targets, leniency);
  try {
    const labels: string[] = [];
    const chunk = 4096;
    const padded = new Float32Array(samples.length + SAMPLE_RATE); // a second of silence lets the last word finish
    padded.set(samples);
    for (let i = 0; i < padded.length; i += chunk) labels.push(...s.feed(padded.subarray(i, i + chunk)));
    return labels;
  } finally {
    s.close();
  }
}

/**
 * Open the microphone and listen for the given phrases. The microphone is
 * closed when `done(labels)` returns true, after `timeoutMs`, or on stop().
 */
export function listen(
  targets: KeywordTarget[],
  done: (labels: string[]) => boolean,
  opts: { timeoutMs?: number; leniency?: number } = {},
): ListenSession {
  const { timeoutMs = 7000, leniency = 1 } = opts;
  let stopped = false;
  let finish: (h: Heard) => void = () => {};
  const result = new Promise<Heard>((resolve) => (finish = resolve));
  const session: ListenSession = { result, stop: () => void (stopped = true) };

  void (async () => {
    const labels: string[] = [];
    let media: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let spotter: Spotter | null = null;
    const close = (complete: boolean, error?: Heard["error"]) => {
      media?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      spotter?.close();
      finish({ labels, complete, ...(error ? { error } : {}) });
    };
    try {
      spotter = await openSpotter(targets, leniency);
    } catch {
      return close(false, "engine");
    }
    try {
      media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
    } catch {
      return close(false, "mic");
    }
    if (stopped) return close(false);
    ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(media);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const deadline = performance.now() + timeoutMs;
    let ended = false;
    proc.onaudioprocess = (e) => {
      if (ended || !spotter) return;
      labels.push(...spotter.feed(downsample(e.inputBuffer.getChannelData(0), ctx!.sampleRate)));
      const isDone = done(labels);
      if (isDone || stopped || performance.now() > deadline) {
        ended = true;
        proc.disconnect();
        source.disconnect();
        close(isDone);
      }
    };
    source.connect(proc);
    proc.connect(ctx.destination);
  })();

  return session;
}
