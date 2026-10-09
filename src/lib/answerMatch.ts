/** Fuzzy answer checking for typed responses. */

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(the|a|an)\s+/, "");
}

/** Levenshtein distance with an early-exit cap. */
export function levenshtein(a: string, b: string, cap = 3): number {
  if (Math.abs(a.length - b.length) > cap) return cap + 1;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let cur = i;
    let diag = prev[0];
    prev[0] = i;
    let rowMin = cur;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j];
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur = Math.min(prev[j] + 1, cur + 1, diag + cost);
      diag = up;
      prev[j] = cur;
      if (cur < rowMin) rowMin = cur;
    }
    if (rowMin > cap) return cap + 1;
  }
  return prev[b.length];
}

/**
 * Acceptable normalized forms of an answer:
 *  - the full string,
 *  - anything before/after a "/" (either form counts),
 *  - text with parentheticals removed,
 *  - the parenthetical content itself.
 */
export function alternates(answer: string): string[] {
  const out = new Set<string>();
  const chunks = answer.split("/").map((s) => s.trim());
  for (const chunk of chunks) {
    const noParen = chunk
      .replace(/\([^)]*\)/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const parens = [...chunk.matchAll(/\(([^)]*)\)/g)].map((m) => m[1]).join(" ");
    for (const v of [chunk, noParen, parens]) {
      const n = normalize(v);
      if (n) out.add(n);
    }
  }
  return [...out];
}

function toleranceFor(len: number): number {
  if (len < 5) return 0;
  if (len < 9) return 1;
  return 2;
}

/** True when the typed guess is good enough for the given answer. */
export function isCorrect(guess: string, answer: string): boolean {
  const g = normalize(guess);
  if (!g) return false;
  for (const alt of alternates(answer)) {
    if (g === alt) return true;
    if (levenshtein(g, alt, toleranceFor(alt.length)) <= toleranceFor(alt.length)) return true;
    // generous containment: a long-enough single-word guess inside a multi-word answer
    if (alt.includes(" ") && g.length >= 5 && alt.split(" ").includes(g)) return true;
  }
  return false;
}
