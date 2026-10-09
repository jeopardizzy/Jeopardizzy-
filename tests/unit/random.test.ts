import { describe, expect, it } from "vitest";
import { dailySeed, hashString, mulberry32, shuffle } from "../../src/lib/random";

describe("random", () => {
  it("mulberry32 is deterministic for the same seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it("mulberry32 produces values in [0, 1)", () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("different seeds diverge", () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    const seqA = Array.from({ length: 8 }, () => a());
    const seqB = Array.from({ length: 8 }, () => b());
    expect(seqA).not.toEqual(seqB);
  });

  it("hashString is stable", () => {
    expect(hashString("quizzical")).toBe(hashString("quizzical"));
    expect(hashString("a")).not.toBe(hashString("b"));
  });

  it("shuffle permutes without losing elements", () => {
    const rng = mulberry32(99);
    const input = Array.from({ length: 50 }, (_, i) => i);
    const out = shuffle([...input], rng);
    expect(out.slice().sort((x, y) => x - y)).toEqual(input);
  });

  it("dailySeed is date-based and deterministic", () => {
    const d = new Date(Date.UTC(2026, 0, 15, 23, 30));
    expect(dailySeed(d)).toBe(dailySeed(d));
    expect(dailySeed(d)).not.toBe(dailySeed(new Date(Date.UTC(2026, 0, 16))));
  });
});
