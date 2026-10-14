import { describe, expect, it } from "vitest";
import { getVerdict } from "../../src/lib/verdict";

const BOUNDARIES: [number, string][] = [
  [0, "Ewww, it couldn’t be worse"],
  [1, "It could be worse…"],
  [10, "It could be worse…"],
  [11, "good job! (for an amoeba doing the test)"],
  [40, "good job! (for an amoeba doing the test)"],
  [41, "good! you are just as intelligent as a rat!"],
  [49, "good! you are just as intelligent as a rat!"],
  [50, "gettin’ better!"],
  [51, "cooking it!"],
  [66, "cooking it!"],
  [67, "gosh… when will it die out?"],
  [68, "huh, embarrassed, are you not?"],
  [80, "huh, embarrassed, are you not?"],
  [81, "it could be better."],
  [89, "it could be better."],
  [90, "complete failure."],
  [99, "complete failure."],
  [100, "huh, now we are talking!"],
];

describe("getVerdict", () => {
  it("hits every customer boundary exactly", () => {
    for (const [p, phrase] of BOUNDARIES) {
      expect(getVerdict(p), `${p}%`).toBe(phrase);
    }
  });

  it("every integer 0–100 lands in exactly one phrase, no gaps", () => {
    const phrases = new Set(BOUNDARIES.map(([, v]) => v));
    for (let p = 0; p <= 100; p++) {
      expect(phrases.has(getVerdict(p)), `${p}%`).toBe(true);
    }
  });

  it("rounds fractional percents before banding", () => {
    expect(getVerdict(49.5)).toBe(getVerdict(50));
    expect(getVerdict(66.6)).toBe(getVerdict(67));
  });
});
