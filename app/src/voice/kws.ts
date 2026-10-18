/**
 * On-device keyword spotting for spoken Workbook answers, PawWalk-style:
 * sherpa-onnx compiled to WebAssembly (tools/kws/build-wasm-kws.sh) with the
 * GigaSpeech 3.3M English keyword model. Audio goes from the microphone into
 * the spotter in memory and is never recorded, stored or sent anywhere; the
 * output is which expected phrase was heard, plus the in-memory audio for
 * the speech-to-text second pass (src/voice/asr.ts) when nothing was.
 *
 * The engine loads only when a player turns spoken answers on.
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

/**
 * Recognition tuning, measured with tools/kws/accent-eval.mjs on 40 answers
 * spoken plainly and in eight strong accents. `maxActivePaths` applies when
 * the engine loads; the others to every question.
 */
export const KWS_TUNING = {
  /** decoder beam: wider keeps unusual (accented) pronunciations alive */
  maxActivePaths: 4,
  /** score bonus for the expected phrases' tokens */
  boost: 2.0,
  /** bonus on a second try */
  retryBoost: 2.5,
};

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
    maxActivePaths: KWS_TUNING.maxActivePaths,
    numTrailingBlanks: 1,
    keywordsScore: 1.0,
    keywordsThreshold: 0.25,
    // The spotter needs one keyword to start, and per-question streams keep it.
    // It must never fire: a hit resets decoding mid-answer ("THE Tigris").
    keywords: "Z Z Z Z Z Z :0.1 #0.99 @__none",
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
  /**
   * What the microphone picked up (16 kHz, at most MAX_AUDIO_SECONDS), so a
   * miss can be checked again by speech-to-text. In memory only: never
   * stored or sent, and dropped as soon as the answer is checked.
   */
  audio?: Float32Array;
}

const MAX_AUDIO_SECONDS = 10;

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
  const boost = leniency < 1 ? KWS_TUNING.retryBoost : KWS_TUNING.boost;
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
    // like a microphone: a moment of silence before speech, and a second after it so the last word finishes
    const lead = Math.round(SAMPLE_RATE * 0.5);
    const padded = new Float32Array(lead + samples.length + SAMPLE_RATE);
    padded.set(samples, lead);
    for (let i = 0; i < padded.length; i += chunk) labels.push(...s.feed(padded.subarray(i, i + chunk)));
    return labels;
  } finally {
    s.close();
  }
}

/**
 * Open the microphone and listen for the given phrases. The microphone is
 * closed when `done(labels)` returns true, after `timeoutMs` of listening,
 * or on stop() — whichever comes first, whatever state the audio is in.
 *
 * Call it straight from the tap handler: iOS only lets web audio run when
 * it is started during a user gesture, so the AudioContext is created and
 * resumed here, before any await.
 */
export function listen(
  targets: KeywordTarget[],
  done: (labels: string[]) => boolean,
  opts: { timeoutMs?: number; leniency?: number; onOpen?: () => void } = {},
): ListenSession {
  const { timeoutMs = 7000, leniency = 1, onOpen } = opts;

  let ctx: AudioContext | null = null;
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctx();
    void ctx.resume();
  } catch {
    ctx = null;
  }

  const labels: string[] = [];
  const captured: Float32Array[] = [];
  let capturedLength = 0;
  let media: MediaStream | null = null;
  let spotter: Spotter | null = null;
  let source: MediaStreamAudioSourceNode | null = null;
  let proc: ScriptProcessorNode | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let finished = false;
  let finish: (h: Heard) => void = () => {};
  const result = new Promise<Heard>((resolve) => (finish = resolve));

  /** End the session now, from anywhere: idempotent, never waits on audio. */
  const close = (complete: boolean, error?: Heard["error"]) => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    if (proc) proc.onaudioprocess = null;
    proc?.disconnect();
    source?.disconnect();
    media?.getTracks().forEach((t) => t.stop());
    void ctx?.close().catch(() => {});
    spotter?.close();
    spotter = null;
    let audio: Float32Array | undefined;
    if (capturedLength > 0) {
      audio = new Float32Array(capturedLength);
      let at = 0;
      for (const c of captured) {
        audio.set(c, at);
        at += c.length;
      }
    }
    captured.length = 0;
    finish({ labels, complete, ...(error ? { error } : {}), ...(audio ? { audio } : {}) });
  };

  void (async () => {
    if (!ctx) return close(false, "engine");
    try {
      const s = await openSpotter(targets, leniency);
      if (finished) return s.close();
      spotter = s;
    } catch {
      return close(false, "engine");
    }
    try {
      const m = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      if (finished) return m.getTracks().forEach((t) => t.stop());
      media = m;
    } catch {
      return close(false, "mic");
    }
    try {
      // the microphone can switch iOS's audio session; make sure the context runs
      await ctx.resume().catch(() => {});
      if (finished) return;
      source = ctx.createMediaStreamSource(media);
      proc = ctx.createScriptProcessor(4096, 1, 1);
      proc.onaudioprocess = (e) => {
        if (finished || !spotter) return;
        const input = e.inputBuffer.getChannelData(0);
        const samples = downsample(input, ctx!.sampleRate);
        if (capturedLength + samples.length <= SAMPLE_RATE * MAX_AUDIO_SECONDS) {
          captured.push(samples === input ? samples.slice() : samples);
          capturedLength += samples.length;
        }
        labels.push(...spotter.feed(samples));
        if (done(labels)) close(true);
      };
      source.connect(proc);
      proc.connect(ctx.destination);
    } catch {
      return close(false, "engine");
    }
    timer = setTimeout(() => close(false), timeoutMs);
    onOpen?.();
  })().catch(() => close(false, "engine")); // whatever fails, the session always ends

  return { result, stop: () => close(false) };
}
