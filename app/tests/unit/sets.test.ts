import { describe, expect, it } from "vitest";
import { quizData } from "../../src/data/quizData";
import { SETS } from "../../src/data/sets";
import { boardFromSet, pickFinalForSet } from "../../src/lib/board";

describe("quiz dataset", () => {
  it("has enough material", () => {
    expect(quizData.categories.length).toBeGreaterThanOrEqual(50);
  });

  it("never mentions source books or authors", () => {
    const blob = JSON.stringify(quizData).toLowerCase();
    for (const bad of ["nancy linde", "workman", "magic book"]) {
      expect(blob.includes(bad)).toBe(false);
    }
  });

  it("has no extraction artifacts", () => {
    const blob = JSON.stringify(quizData);
    // eslint-disable-next-line no-control-regex
    expect(/[\x00-\x08\x0b-\x1f]/.test(blob)).toBe(false);
    expect(/\b([A-Z])\1[a-z]{3,}/.test(blob)).toBe(false);
  });
});

describe("sets", () => {
  const names = new Set(quizData.categories.map((c) => c.name));

  it("every set category exists and has 5+ clues", () => {
    for (const s of SETS) {
      for (const n of [...s.round1, ...s.round2]) {
        expect(names.has(n), `missing category "${n}" in set ${s.id}`).toBe(true);
        const cat = quizData.categories.find((c) => c.name === n)!;
        expect(cat.clues.length, `"${n}" has ${cat.clues.length} clues`).toBeGreaterThanOrEqual(5);
      }
    }
  });

  it("rounds within a set never repeat a category", () => {
    for (const s of SETS) {
      const all = [...s.round1, ...s.round2];
      expect(new Set(all).size, `duplicate in set ${s.id}`).toBe(all.length);
    }
  });

  it("boards build correctly from each set and round", () => {
    for (const s of SETS) {
      for (const round of [1, 2] as const) {
        const b = boardFromSet(quizData, s, round, 42);
        expect(b.categories).toHaveLength(5);
        expect(b.tiles).toHaveLength(25);
        const values = new Set(b.tiles.map((t) => t.value));
        expect(values).toEqual(
          round === 1 ? new Set([100, 200, 300, 400, 500]) : new Set([200, 400, 600, 800, 1000]),
        );
      }
    }
  });

  it("final clue comes from outside the set", () => {
    for (const s of SETS) {
      const f = pickFinalForSet(quizData, s, 42);
      expect([...s.round1, ...s.round2]).not.toContain(f.categoryName);
      expect(f.clue.length).toBeGreaterThan(2);
    }
  });
});
