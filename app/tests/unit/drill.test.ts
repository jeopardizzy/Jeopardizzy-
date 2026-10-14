import { describe, expect, it } from "vitest";
import { drillPool } from "../../src/store/workbookStore";
import { quizData } from "../../src/data/quizData";

describe("drillPool", () => {
  it("resolves book dataset categories", () => {
    const pool = drillPool(["Homonyms"]);
    expect(pool.length).toBeGreaterThan(10);
    for (const q of pool) expect(q.categoryName).toBe("Homonyms");
  });

  it("resolves arena/board categories that are NOT in the book dataset", () => {
    const bookNames = new Set(quizData.categories.map((c) => c.name));
    expect(bookNames.has("Brrrr! (BR-)")).toBe(false);
    const pool = drillPool(["Brrrr! (BR-)"]);
    expect(pool.length).toBeGreaterThanOrEqual(5);
  });

  it("merges sources and dedupes identical clues", () => {
    const pool = drillPool(["Homonyms"]);
    const keys = pool.map((q) => q.clue);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("handles multiple categories and unknown names", () => {
    const pool = drillPool(["Homonyms", "Rivers", "No Such Category XYZ"]);
    const cats = new Set(pool.map((q) => q.categoryName));
    expect(cats.has("Homonyms")).toBe(true);
    expect(cats.has("Rivers")).toBe(true);
    expect(cats.size).toBe(2);
    expect(drillPool(["No Such Category XYZ"])).toEqual([]);
  });
});
