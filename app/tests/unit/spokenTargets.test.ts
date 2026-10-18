import { describe, expect, it } from "vitest";
import { accentVariants, numberWords, phrase, spokenTargets } from "../../src/lib/spokenTargets";

describe("accentVariants", () => {
  it("respells typical accent sound changes", () => {
    expect(accentVariants("SLOTH")).toEqual(expect.arrayContaining(["SLOT", "SLOS", "ESLOTH"]));
    expect(accentVariants("HOARSE")).toContain("OARSE");
    expect(accentVariants("WEST")).toContain("VEST");
    expect(accentVariants("JULIENNE")).toEqual(expect.arrayContaining(["YULIENNE", "JULIENNEH"]));
  });

  it("stays small and never repeats the phrase itself", () => {
    for (const p of ["THE UNSINKABLE MOLLY BROWN", "MARTIN VAN BUREN", "ATE", "EYE"]) {
      const v = accentVariants(p);
      expect(v.length).toBeLessThanOrEqual(5);
      expect(v).not.toContain(p);
    }
    expect(accentVariants("EYE")).toEqual([]);
  });
});
import { quizData } from "../../src/data/quizData";

describe("spokenTargets", () => {
  it("treats '/' as alternatives", () => {
    expect(spokenTargets("Ate/eight")).toEqual([["ATE", "EIGHT"]]);
    expect(spokenTargets("Tops/Spot")).toEqual([["TOPS", "SPOT"]]);
  });

  it("drops notes in parentheses, even with slashes inside", () => {
    expect(spokenTargets("Eye (eyeball, eyeglasses, eyelashes, eyewitness)")).toEqual([["EYE"]]);
    expect(spokenTargets("Resume (Re ZOOM/RES oo may)")).toEqual([["RESUME"]]);
    expect(spokenTargets("Andre Agassi (Arthur Ashe is also correct.)")).toEqual([["ANDRE AGASSI"]]);
  });

  it("needs every item of a list", () => {
    expect(spokenTargets("Alabama, Alaska, Arizona, Arkansas")).toEqual([["ALABAMA"], ["ALASKA"], ["ARIZONA"], ["ARKANSAS"]]);
    expect(spokenTargets("Austin, Texas")).toEqual([["AUSTIN"], ["TEXAS"]]);
    expect(spokenTargets("John Adams, and Chester Alan Arthur")).toEqual([["JOHN ADAMS"], ["CHESTER ALAN ARTHUR"]]);
  });

  it("reads quoted titles and capitals as plain words", () => {
    expect(spokenTargets('"Tom THUMB"')).toEqual([["TOM THUMB"]]);
    expect(spokenTargets("Adam's RIB")).toEqual([["ADAMS RIB"]]);
    expect(spokenTargets("A man’s home is his castle")).toEqual([["A MANS HOME IS HIS CASTLE"]]);
  });

  it("spells numbers the way people say them", () => {
    expect(numberWords(1776)).toBe("SEVENTEEN SEVENTY SIX");
    expect(numberWords(1905)).toBe("NINETEEN OH FIVE");
    expect(numberWords(2000)).toBe("TWO THOUSAND");
    expect(numberWords(42)).toBe("FORTY TWO");
    expect(phrase("7 Up & more")).toBe("SEVEN UP AND MORE");
  });

  it("says abbreviations in full", () => {
    expect(phrase("Mt. Everest")).toBe("MOUNT EVEREST");
    expect(phrase("St. Louis")).toBe("SAINT LOUIS");
    expect(phrase("Martin Luther King Jr.")).toBe("MARTIN LUTHER KING JUNIOR");
    expect(phrase("Mount Everest")).toBe("MOUNT EVEREST");
  });

  it("gives every Workbook answer at least one non-empty phrase", () => {
    for (const c of quizData.categories) {
      for (const q of c.clues) {
        const t = spokenTargets(q.answer);
        expect(t.length, q.answer).toBeGreaterThan(0);
        for (const g of t) for (const p of g) expect(p, q.answer).toMatch(/^[A-Z]+( [A-Z]+)*$/);
      }
    }
  });
});
