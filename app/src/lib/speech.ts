/**
 * Quizmaster voice: the shared rules for turning on-screen text into spoken
 * lines and naming their audio clips. The app and the bake tool
 * (tools/voice/bake.mjs) both use this file, so a clip baked for a clue is
 * found again at runtime from the same text.
 */

export type VoiceKind = "clue" | "answer" | "category" | "line";

const PREFIX: Record<VoiceKind, string> = { clue: "c", answer: "a", category: "k", line: "h" };

/** cyrb53: a fast, well-spread 53-bit string hash (public domain). */
function cyrb53(s: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed;
  let h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

/** Clip id for a line of on-screen text, e.g. "c-1x9k2p0qz7". Whitespace-insensitive. */
export function voiceId(kind: VoiceKind, text: string): string {
  return `${PREFIX[kind]}-${cyrb53(text.trim().replace(/\s+/g, " ")).toString(36)}`;
}

/**
 * All-caps words are spoken as words when they look like words ("POLE" → "pole")
 * and spelled when they look like initials ("FBI", "UK").
 */
function speakCaps(s: string): string {
  return s.replace(/\b[A-Z]{2,}\b/g, (w) => (w.length >= 4 && /[AEIOUY]/.test(w) ? w.toLowerCase() : w));
}

/** A run of letter fragments and gaps, e.g. "H ___ ___ ___ony" or "De __ __ __ y". */
const LETTER_PATTERN = /^\S*(?:\s*_+\S*)+(?:\s+[a-z]\b)?\s+/;

/**
 * A gap the players fill is never read out: the host trails off instead
 * ("Birds of a feather ___" → "Birds of a feather…").
 */
function pauseAtGaps(s: string): string {
  return s
    .replace(/\s*_{2,}(?:\s+_{2,})*\s*/g, "… ")
    .replace(/…\s+([.,;:!?)])/g, "…$1")
    .replace(/…\./g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * What the quizmaster says for a clue. Gaps in a sentence become a pause.
 * Letter puzzles are on screen, so only their definition is read
 * ("H ___ ___ ___ony Notes sung together" → "Notes sung together"), and
 * letter grids ("VA ___ · COL ___ E") get a short instruction instead.
 */
export function spokenClue(text: string): string {
  if (/_/.test(text) && /·/.test(text)) return "Fill in the missing letters.";
  const m = LETTER_PATTERN.exec(text);
  if (m && /[A-Za-z]_|_[A-Za-z]|^[A-Za-z]{1,3}\s+_/.test(m[0])) text = text.slice(m[0].length);
  return pauseAtGaps(speakCaps(text));
}

/** What the quizmaster says for an answer: "POLE / POLL" → "pole, or poll". */
export function spokenAnswer(text: string): string {
  return pauseAtGaps(speakCaps(text).replace(/\s*\/\s*/g, ", or "));
}

/** Fixed host lines, baked once. Keys are stable; the text can be reworded (it rebakes). */
export const HOST_LINES = {
  answerIs: "The answer is…",
  correct: "Correct!",
  noOne: "No one got that one.",
  finalRound: "It's time for the final round. Make your wagers!",
  finalClue: "Here is the final clue.",
  winner: "And we have a winner!",
  tie: "It's a tie!",
  lightningRound: "Lightning round! Shout out the answer — the fastest team scores.",
  timeUp: "Time's up!",
  dailyBoard: "Welcome to today's Daily Board.",
  newGame: "Welcome to Trivia Night! Pick a tile to begin.",
  workbookCorrect: "That's right!",
  workbookWrong: "Not quite.",
  workbookListening: "Say your answer.",
} as const;

export type HostLine = keyof typeof HOST_LINES;
