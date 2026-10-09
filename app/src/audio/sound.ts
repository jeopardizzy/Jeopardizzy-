/**
 * Tiny WebAudio synth — no audio assets. The context is created lazily and
 * unlocked on the first user gesture; a global mute gates every effect.
 */

let ctx: AudioContext | null = null;
let muted = false;

export function setSoundMuted(m: boolean): void {
  muted = m;
}

export function unlockAudio(): void {
  if (ctx) {
    if (ctx.state === "suspended") void ctx.resume();
    return;
  }
  try {
    ctx = new AudioContext();
  } catch {
    ctx = null;
  }
}

function tone(
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  gain = 0.12,
  slideTo?: number,
): void {
  if (!ctx || muted) return;
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  /** tile opens */
  flip(): void {
    tone(420, 0, 0.09, "triangle", 0.08, 640);
  },
  /** correct answer */
  ding(): void {
    tone(880, 0, 0.16, "sine", 0.14);
    tone(1318.5, 0.09, 0.22, "sine", 0.12);
  },
  /** wrong answer */
  buzz(): void {
    tone(160, 0, 0.28, "square", 0.09, 110);
  },
  /** board / round complete */
  chime(): void {
    [523.25, 659.25, 783.99].forEach((f, i) => tone(f, i * 0.09, 0.22, "sine", 0.11));
  },
  /** results fanfare */
  fanfare(): void {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.11, 0.3, "triangle", 0.12));
    tone(1318.5, 0.48, 0.5, "sine", 0.1);
  },
  /** UI click */
  tick(): void {
    tone(660, 0, 0.05, "triangle", 0.05);
  },
};
