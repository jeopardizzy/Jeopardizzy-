import { voiceId, type HostLine, type VoiceKind } from "../lib/speech";

/**
 * Quizmaster voice player. Every line was baked ahead of time into
 * public/voice/<id>.mp3 (tools/voice/bake.mjs), so playback is local and
 * offline: no speech service is ever called from the app.
 *
 * One line plays at a time; a new say() interrupts the old one. Lines without
 * a baked clip (e.g. a clue added after the last bake) are skipped silently.
 */

export interface VoiceManifest {
  version: number;
  clips: Record<string, { d: number }>;
}

export type Utterance = { kind: VoiceKind; text: string } | { line: HostLine };

const BASE = `${import.meta.env.BASE_URL ?? "/"}voice/`;

let manifest: VoiceManifest | null = null;
let loading: Promise<void> | null = null;
let enabled = true;
let audio: HTMLAudioElement | null = null;
let queue: string[] = [];

/** Fetch the manifest once, early, so a tap can start speech without waiting. */
export function loadVoice(): Promise<void> {
  if (!loading) {
    loading = fetch(`${BASE}manifest.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((m: VoiceManifest | null) => {
        manifest = m && typeof m === "object" && m.clips ? m : null;
      })
      .catch(() => {
        manifest = null;
      });
  }
  return loading;
}

/** For tests: install a manifest directly. */
export function setVoiceManifest(m: VoiceManifest | null): void {
  manifest = m;
  loading = Promise.resolve();
}

export function setVoiceEnabled(on: boolean): void {
  enabled = on;
  if (!on) stopVoice();
}

export function isVoiceAvailable(): boolean {
  return manifest !== null && Object.keys(manifest.clips).length > 0;
}

/** Clip id for an utterance, or null when that line was never baked. */
export function clipFor(u: Utterance): string | null {
  const id = "line" in u ? `h-${u.line}` : voiceId(u.kind, u.text);
  return manifest?.clips[id] ? id : null;
}

/** First call must come from a user gesture on iOS; App.tsx calls this on the first tap. */
export function unlockVoice(): void {
  if (audio || typeof Audio === "undefined") return;
  audio = new Audio();
  audio.preload = "auto";
  audio.addEventListener("ended", playNext);
  audio.addEventListener("error", playNext);
}

function playNext(): void {
  const id = queue.shift();
  if (!audio || !id) return;
  audio.src = `${BASE}${id}.mp3`;
  audio.play().catch(() => {
    /* blocked or interrupted: drop the rest of this utterance */
    queue = [];
  });
}

/** Speak one or more lines in order, replacing whatever is playing. */
export function say(...parts: Utterance[]): void {
  if (!enabled || !manifest) return;
  unlockVoice();
  queue = parts.map(clipFor).filter((id): id is string => id !== null);
  if (audio && !audio.paused) audio.pause();
  playNext();
}

export function stopVoice(): void {
  queue = [];
  if (audio && !audio.paused) audio.pause();
}
