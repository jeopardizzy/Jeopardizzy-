/**
 * Spoken Workbook answers: what the on-device keyword spotter listens for.
 *
 * An answer becomes a list of groups; every group must be heard, and any one
 * phrase in a group satisfies it:
 *   "Ate/eight"                     → [["ATE", "EIGHT"]]
 *   "Eye (eyeball, eyeglasses)"     → [["EYE"]]            notes are not said
 *   "Alabama, Alaska, Arizona"      → [["ALABAMA"], ["ALASKA"], ["ARIZONA"]]
 *   "\"Tom THUMB\""                 → [["TOM THUMB"]]
 * Phrases are upper-case words, the form the keyword model's tokens use
 * (tools/kws/keywords.py turns each phrase into model tokens at build time).
 */

const ONES = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE", "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN", "SEVENTEEN", "EIGHTEEN", "NINETEEN"];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

function below100(n: number): string {
  if (n < 20) return ONES[n];
  return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : "");
}

/** 0–9999 in words, years read as people say them ("1776" → "SEVENTEEN SEVENTY SIX"). */
export function numberWords(n: number): string {
  if (n < 100) return below100(n);
  if (n >= 1100 && n < 2000 && n % 100 !== 0) return `${below100(Math.floor(n / 100))} ${n % 100 < 10 ? `OH ${ONES[n % 100]}` : below100(n % 100)}`;
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} HUNDRED${n % 100 ? ` ${below100(n % 100)}` : ""}`;
  if (n < 10000) {
    const rest = n % 1000;
    return `${below100(Math.floor(n / 1000))} THOUSAND${rest ? ` ${numberWords(rest)}` : ""}`;
  }
  return String(n);
}

/** Abbreviations as people say them ("Mt. Everest" → "MOUNT EVEREST"). */
const SPOKEN_ABBREVIATIONS: [RegExp, string][] = [
  [/\bMt\.?(?=\s)/gi, "Mount"],
  [/\bSt\.(?=\s)/gi, "Saint"],
  [/\bDr\.(?=\s)/gi, "Doctor"],
  [/\bMr\.(?=\s)/gi, "Mister"],
  [/\bMrs\.(?=\s)/gi, "Missus"],
  [/\bJr\.?(?=\s|$)/gi, "Junior"],
  [/\bvs\.?(?=\s)/gi, "versus"],
];

/** Upper-case words only: digits spelled, "&" as AND, punctuation dropped. */
export function phrase(s: string): string {
  for (const [re, word] of SPOKEN_ABBREVIATIONS) s = s.replace(re, word);
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/\d+/g, (d) => ` ${numberWords(Number(d))} `)
    .replace(/['’‘]/g, "")
    .replace(/[^A-Za-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function spokenTargets(answer: string): string[][] {
  const plain = answer.replace(/\([^)]*\)?/g, " ").replace(/["“”]/g, " ");
  const items = plain
    .split(",")
    .map((s) => s.trim().replace(/^(and|or)\s+/i, ""))
    .filter(Boolean);
  const groups = items
    .map((item) => [...new Set(item.split("/").map(phrase).filter((p) => p.length > 0))])
    .filter((g) => g.length > 0);
  return groups.length > 0 ? groups : [[phrase(answer)]].filter((g) => g[0].length > 0);
}

/**
 * Common accent sound changes, as respellings the keyword model can match.
 * Each rule rewrites one word; a phrase gets at most MAX_VARIANTS of them.
 */
const ACCENT_RULES: [RegExp, string][] = [
  [/TH/, "T"], // "sloth" → "slot" (Russian, French, Spanish, German, Chinese…)
  [/TH/, "S"], // "cloth" → "clos"
  [/TH/, "D"], // "the" → "de"
  [/^S(?=[CKLMNPQTW])/, "ES"], // "sloth" → "esloth" (Spanish, Arabic)
  [/^H(?=[AEIOU])/, ""], // "hoarse" → "oarse" (French, Spanish)
  [/^W/, "V"], // "west" → "vest" (German, Russian)
  [/^V/, "B"], // "valley" → "balley" (Spanish)
  [/^J/, "Y"], // "julienne" → "yulienne" (German, Arabic)
  [/(NN|LL|TT|SS)E$/, "$1EH"], // French-style endings said in full: "julienne" → "juliennee"
];
const MAX_VARIANTS = 5;

/** Accent respellings of a phrase, e.g. "SLOTH" → ["SLOT", "SLOS", "SLOD", "ESLOTH"]. */
export function accentVariants(p: string): string[] {
  const words = p.split(" ");
  const out = new Set<string>();
  for (const [re, to] of ACCENT_RULES) {
    for (let i = 0; i < words.length && out.size < MAX_VARIANTS; i++) {
      if (words[i].length < 3 || !re.test(words[i])) continue;
      const v = [...words];
      v[i] = v[i].replace(re, to);
      if (v[i].length >= 2) out.add(v.join(" "));
    }
  }
  out.delete(p);
  return [...out].slice(0, MAX_VARIANTS);
}

/** Every distinct phrase the Workbook may listen for, with accent variants (for the token build). */
export function allPhrases(answers: string[]): string[] {
  const base = answers.flatMap((a) => spokenTargets(a).flat());
  return [...new Set([...base, ...base.flatMap(accentVariants)])].sort();
}
