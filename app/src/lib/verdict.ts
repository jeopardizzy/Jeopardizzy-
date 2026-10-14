/**
 * Post-test verdict phrase. Bands are the customer's, verbatim — including
 * the deliberately inverted top end (90–99% is harsher than 100%).
 * Percent is the rounded integer of correct/total × 100.
 */
export function getVerdict(percent: number): string {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  if (p === 0) return "Ewww, it couldn’t be worse";
  if (p <= 10) return "It could be worse…";
  if (p <= 40) return "good job! (for an amoeba doing the test)";
  if (p <= 49) return "good! you are just as intelligent as a rat!";
  if (p === 50) return "gettin’ better!";
  if (p <= 66) return "cooking it!";
  if (p === 67) return "gosh… when will it die out?";
  if (p <= 80) return "huh, embarrassed, are you not?";
  if (p <= 89) return "it could be better.";
  if (p <= 99) return "complete failure.";
  return "huh, now we are talking!";
}
