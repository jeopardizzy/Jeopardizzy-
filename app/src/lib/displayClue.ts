import { letterPattern } from "./speech";

/**
 * How a clue is shown. Letter puzzles get one "_" per missing letter and a
 * dash before the definition, so the letters can be counted:
 * "___ ___ ___ ___ny Thin." → "_ _ _ _ ny — Thin.". Everything else as written.
 */
export function displayClue(text: string): string {
  if (text.includes("·")) return text; // letter grids keep their layout
  const lp = letterPattern(text);
  if (!lp) return text;
  const pattern = lp.pattern
    .split(/\s+/)
    .map((token) => token.replace(/_+/g, " _ ").trim())
    .join(" ")
    .replace(/\s+/g, " ");
  return `${pattern} — ${lp.definition}`;
}
