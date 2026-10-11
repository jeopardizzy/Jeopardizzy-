import { describe, expect, it } from "vitest";
import {
  aggregateCategoryStats,
  mergeCategoryStats,
  weakestCategories,
  type TileOutcome,
} from "../../src/lib/stats";

const sample: TileOutcome[] = [
  { categoryName: "Homonyms", value: 100, awarded: true },
  { categoryName: "Homonyms", value: 200, awarded: false },
  { categoryName: "Homonyms", value: 300, awarded: false },
  { categoryName: "Rivers", value: 100, awarded: true },
  { categoryName: "Rivers", value: 200, awarded: true },
  { categoryName: "Sheesh I", value: 100, awarded: false },
];

describe("stats", () => {
  it("aggregates outcomes per category", () => {
    const agg = aggregateCategoryStats(sample);
    expect(agg["Homonyms"]).toEqual({ played: 3, missed: 2 });
    expect(agg["Rivers"]).toEqual({ played: 2, missed: 0 });
    expect(agg["Sheesh I"]).toEqual({ played: 1, missed: 1 });
  });

  it("weakestCategories sorts by misses and skips clean categories", () => {
    const agg = aggregateCategoryStats(sample);
    const weak = weakestCategories(agg);
    expect(weak.map((w) => w.name)).toEqual(["Homonyms", "Sheesh I"]);
    expect(weak[0]).toEqual({ name: "Homonyms", played: 3, missed: 2 });
  });

  it("weakestCategories respects the limit", () => {
    const many: Record<string, { played: number; missed: number }> = {};
    for (let i = 0; i < 10; i++) many[`Cat ${i}`] = { played: 5, missed: i % 4 };
    many["Cat 0"].missed = 9;
    const weak = weakestCategories(many, 3);
    expect(weak).toHaveLength(3);
    expect(weak[0].name).toBe("Cat 0");
  });

  it("merges game stats into all-time records", () => {
    const g1 = aggregateCategoryStats(sample);
    const merged = mergeCategoryStats({}, g1);
    const merged2 = mergeCategoryStats(merged, { Rivers: { played: 2, missed: 1 } });
    expect(merged2["Rivers"]).toEqual({ played: 4, missed: 1 });
    expect(merged2["Homonyms"]).toEqual({ played: 3, missed: 2 });
  });

  it("handles empty outcomes gracefully", () => {
    expect(aggregateCategoryStats([])).toEqual({});
    expect(weakestCategories({}, 5)).toEqual([]);
  });
});
