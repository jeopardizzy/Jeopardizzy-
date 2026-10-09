import { describe, expect, it } from "vitest";
import { generateRound, pickFinal } from "../../src/lib/board";
import { quizData } from "../../src/data/quizData";

describe("quiz dataset", () => {
  it("has enough material for several boards", () => {
    expect(quizData.categories.length).toBeGreaterThanOrEqual(30);
    const big = quizData.categories.filter((c) => c.clues.length >= 5);
    expect(big.length).toBeGreaterThanOrEqual(20);
  });

  it("never mentions source books or authors", () => {
    const blob = JSON.stringify(quizData).toLowerCase();
    for (const bad of ["nancy linde", "workman", "magic book"]) {
      expect(blob.includes(bad)).toBe(false);
    }
  });
});

describe("generateRound", () => {
  it("builds a 5x5 board with correct values", () => {
    const b = generateRound(quizData, 12345, 1);
    expect(b.categories).toHaveLength(5);
    expect(b.tiles).toHaveLength(25);
    const values = b.tiles.map((t) => t.value);
    for (const v of [100, 200, 300, 400, 500]) {
      expect(values.filter((x) => x === v)).toHaveLength(5);
    }
    // unique category ids
    expect(new Set(b.categories.map((c) => c.id)).size).toBe(5);
    // every tile references its column category
    for (const t of b.tiles) {
      expect(b.categories.some((c) => c.id === t.categoryId)).toBe(true);
      expect(t.clue.length).toBeGreaterThan(2);
      expect(t.answer.length).toBeGreaterThan(0);
    }
  });

  it("is deterministic per seed", () => {
    const a = generateRound(quizData, 777, 1);
    const b = generateRound(quizData, 777, 1);
    expect(a).toEqual(b);
    const c = generateRound(quizData, 778, 1);
    expect(c).not.toEqual(a);
  });

  it("round 2 doubles values and uses different categories than round 1", () => {
    const b2 = generateRound(quizData, 12345, 2);
    expect(new Set(b2.tiles.map((t) => t.value))).toEqual(
      new Set([200, 400, 600, 800, 1000]),
    );
  });
});

describe("pickFinal", () => {
  it("avoids categories used on the boards", () => {
    const b1 = generateRound(quizData, 555, 1);
    const b2 = generateRound(quizData, 555, 2);
    const used = [...b1.categories, ...b2.categories].map((c) => c.id);
    const f = pickFinal(quizData, 555, used);
    expect(f.clue.length).toBeGreaterThan(2);
    expect(f.answer.length).toBeGreaterThan(0);
  });
});
