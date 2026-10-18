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
 * full match harder, and an accidental one rarer).
 */
export function thresholdFor(tokens: string): number {
  const pieces = tokens.trim().split(/\s+/).length;
  return Math.round(Math.max(0.08, Math.min(0.3, 0.36 - 0.04 * pieces)) * 100) / 100;
}

/** The keywords string the spotter takes: one "<tokens> :boost #threshold @label" per line. */
export function keywordsSpec(targets: KeywordTarget[]): string {
  return targets.map((t) => `${t.tokens} :2.0 #${thresholdFor(t.tokens)} @${t.label}`).join("\n");
}

/**
 * Open the microphone and listen for the given phrases. The microphone is
 * closed when `done(labels)` returns true, after `timeoutMs`, or on stop().
 */
export function listen(targets: KeywordTarget[], done: (labels: string[]) => boolean, timeoutMs = 7000): ListenSession {
  let stopped = false;
  let finish: (h: Heard) => void = () => {};
  const result = new Promise<Heard>((resolve) => (finish = resolve));
  const session: ListenSession = { result, stop: () => void (stopped = true) };

  void (async () => {
    const labels: string[] = [];
    let media: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let streamHandle = 0;
    let buf = 0, bufLen = 0;
    let mod: SherpaModule | null = null;
    const close = (complete: boolean) => {
      media?.getTracks().forEach((t) => t.stop());
      void ctx?.close();
      if (mod) {
        if (streamHandle) mod._SherpaOnnxDestroyOnlineStream(streamHandle);
        if (buf) mod._free(buf);
      }
      finish({ labels, complete });
    };
    try {
      const { mod: m, kws } = await loadKws();
      mod = m;
      const spec = keywordsSpec(targets);
      const n = m.lengthBytesUTF8(spec) + 1;
      const p = m._malloc(n);
      m.stringToUTF8(spec, p, n);
      streamHandle = m._SherpaOnnxCreateKeywordStreamWithKeywords(kws.handle, p);
      m._free(p);
      if (!streamHandle) throw new Error("keywords rejected");
      const stream = { handle: streamHandle };

      media = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
      });
      if (stopped) return close(false);
      ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(media);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      const deadline = performance.now() + timeoutMs;
      let ended = false;
      proc.onaudioprocess = (e) => {
        if (ended) return;
        const samples = downsample(e.inputBuffer.getChannelData(0), ctx!.sampleRate);
        if (samples.length > bufLen) {
          if (buf) m._free(buf);
          buf = m._malloc(samples.length * 4);
          bufLen = samples.length;
        }
        m.HEAPF32.set(samples, buf / 4);
        m._SherpaOnnxOnlineStreamAcceptWaveform(streamHandle, SAMPLE_RATE, buf, samples.length);
        while (kws.isReady(stream)) {
          kws.decode(stream);
          const r = kws.getResult(stream);
          if (r.keyword) {
            labels.push(r.keyword);
            kws.reset(stream);
          }
        }
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
    } catch {
      close(false);
    }
  })();

  return session;
}
