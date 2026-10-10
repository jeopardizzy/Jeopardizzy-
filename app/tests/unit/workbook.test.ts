import { describe, expect, it } from "vitest";
import { quizData } from "../../src/data/quizData";
import { CATEGORY_TYPES, TASK_TYPE_LABELS, type TaskType } from "../../src/data/categoryTypes";
import { workbookPool } from "../../src/store/workbookStore";
import { GUIDES } from "../../src/data/guides";

describe("category types", () => {
  it("every tagged category exists in the dataset", () => {
    const names = new Set(quizData.categories.map((c) => c.name));
    for (const n of Object.keys(CATEGORY_TYPES)) {
      expect(names.has(n), `CATEGORY_TYPES references unknown "${n}"`).toBe(true);
    }
  });

  it("every category resolves to a known type (explicit or knowledge)", () => {
    for (const c of quizData.categories) {
      const t = CATEGORY_TYPES[c.name] ?? "knowledge";
      expect(Object.keys(TASK_TYPE_LABELS)).toContain(t);
    }
  });
});

describe("workbook pool", () => {
  it("every type has enough clues for a test", () => {
    for (const t of Object.keys(TASK_TYPE_LABELS) as TaskType[]) {
      const pool = workbookPool(t, "all");
      expect(pool.length, `type ${t} has ${pool.length} clues`).toBeGreaterThanOrEqual(8);
    }
  });

  it("level filters narrow the pool without emptying it", () => {
    const all = workbookPool("all", "all").length;
    const easy = workbookPool("all", "easy").length;
    const medium = workbookPool("all", "medium").length;
    const hard = workbookPool("all", "hard").length;
    expect(easy).toBeGreaterThan(50);
    expect(medium).toBeGreaterThan(50);
    expect(hard).toBeGreaterThan(10);
    expect(all).toBeGreaterThan(easy);
    expect(all).toBeGreaterThanOrEqual(easy + medium + hard - 10); // tiers are exclusive
  });

  it("type filter selects only that type", () => {
    const pool = workbookPool("homonyms", "all");
    expect(pool.length).toBeGreaterThan(20);
    for (const q of pool) {
      expect(CATEGORY_TYPES[q.categoryName]).toBe("homonyms");
    }
  });
});

describe("guides", () => {
  it("has a guide for every practicable type", () => {
    const guided = new Set(GUIDES.map((g) => g.type));
    for (const t of ["homonyms", "compound", "word-parts", "backwords", "heteronyms", "letter-trivia", "initials", "hidden-word", "title-swap", "geography", "knowledge"]) {
      expect(guided.has(t), `no guide for type ${t}`).toBe(true);
    }
  });

  it("every guide has how, example and tips", () => {
    for (const g of GUIDES) {
      expect(g.how.length).toBeGreaterThan(20);
      expect(g.example.length).toBeGreaterThan(5);
      expect(g.tips.length).toBeGreaterThanOrEqual(3);
    }
  });
});
