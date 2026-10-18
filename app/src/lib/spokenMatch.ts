import { alternates, levenshtein, normalize } from "./answerMatch";
import { numberWords, phrase } from "./spokenTargets";

/**
 * Matching a speech-to-text transcript against an answer, for spoken
 * Workbook answers. Uses the typed answers' alternatives ("Ate/eight") and
 * adds what speech recognition gets wrong in harmless ways: digits for numbers
 * ("8" → "eight"), one word split in two ("in pair" → "impair") and close
 * sound-alikes ("Julian" → "julienne"). Measured on 360 accented samples
 * (tools/kws/asr-score.ts) without accepting a single wrong answer.
 */

/** A rough sound key (Metaphone-like): what an English word sounds like. */
export function soundKey(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/^kn|^gn|^pn|^wr/, (m) => m[1])
    .replace(/ph/g, "f")
    .replace(/th/g, "0")
    .replace(/sh|ch/g, "x")
    .replace(/ck|q/g, "k")
    .replace(/c(?=[iey])/g, "s")
    .replace(/c/g, "k")
    .replace(/dg/g, "j")
    .replace(/(?<=.)[aeiouyhw]/g, "")
    .replace(/^[aeiouyhw]+/, "a")
    .replace(/(.)\1+/g, "$1");
}

/** Transcript words as answers spell them: digits in words. */
export function spokenNormalize(t: string): string {
  return normalize(t.replace(/\d+/g, (d) => ` ${numberWords(Number(d)).toLowerCase()} `));
}

/**
 * One run of transcript words against an answer. Stricter than typed
 * answers: in speech a one-letter difference is usually another word
 * ("sloth"/"cloth"), so spelling slack is kept for long answers only.
 */
export function spokenMatch(words: string, answer: string): boolean {
  const joined = words.replace(/ /g, "");
  if (!joined) return false;
  for (const raw of alternates(answer)) {
    const alt = phrase(raw).toLowerCase(); // as said: "mt everest" → "mount everest"
    const a = alt.replace(/ /g, "");
    if (!a) continue;
    if (words === alt || joined === a) return true; // exact, or one word heard as two
    const split = words.includes(" ") && !alt.includes(" ");
    if ((a.length >= 8 || (split && a.length >= 5)) && levenshtein(joined, a, 1) <= 1) return true; // "in pair" ~ "impair"
    const ka = soundKey(alt);
    if (a.length >= 5 && ka.length >= 3 && ka === soundKey(words)) return true; // "julian" ~ "julienne"
  }
  return false;
}

/** Does any run of words in the transcript ("I think it's slot") give the answer? */
export function heardIn(transcript: string, answer: string): boolean {
  const words = spokenNormalize(transcript).split(" ").filter(Boolean);
  if (words.length === 0) return false;
  if (spokenMatch(words.join(" "), answer)) return true;
  for (let n = 1; n <= Math.min(8, words.length); n++) {
    for (let i = 0; i + n <= words.length; i++) {
      if (spokenMatch(words.slice(i, i + n).join(" "), answer)) return true;
    }
  }
  return false;
}
