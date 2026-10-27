import { describe, expect, it } from "vitest";
import { boardForRound, builderCategories, customGame, gameRoundCount } from "../../src/lib/board";
import { canPlayGame } from "../../src/lib/access";
import { guideFor, taskGuide, taskName } from "../../src/data/taskGuides";
import { GUIDES } from "../../src/data/guides";
import { quizData } from "../../src/data/quizData";

describe("build your own board", () => {
  const cats = builderCategories();

  it("offers every category with at least five clues, once each, alphabetically", () => {
    expect(cats.length).toBeGreaterThan(100);
    expect(new Set(cats.map((c) => c.name)).size).toBe(cats.length);
    expect(cats.every((c) => c.clues.length >= 5)).toBe(true);
    const names = cats.map((c) => c.name);
    expect([...names].sort((a, b) => a.localeCompare(b))).toEqual(names);
  });

  it("uses exactly the chosen questions, cheapest first in the order chosen", () => {
    const [a, b, c] = cats;
    const game = customGame([{ name: a.name, clues: [4, 0, 1, 2, 3].sort((x, y) => x - y) }, { name: b.name }, { name: c.name }]);
    expect(gameRoundCount(game)).toBe(1);
    const board = boardForRound(game, 0, 42);
    expect(board.cols).toBe(3);
    const colA = board.tiles.filter((t) => t.categoryName === a.name);
    expect(colA.map((t) => t.clue)).toEqual([0, 1, 2, 3, 4].map((i) => a.clues[i].clue));
    expect(colA.map((t) => t.value)).toEqual([100, 200, 300, 400, 500]);
    expect(board.tiles.filter((t) => t.categoryName === b.name)).toHaveLength(5);
  });

  it("needs Full Club", () => {
    const game = customGame([{ name: cats[0].name }, { name: cats[1].name }, { name: cats[2].name }]);
    expect(canPlayGame(game, false)).toBe(false);
    expect(canPlayGame(game, true)).toBe(true);
  });

  it("merges numbered sets of the same task into one", () => {
    const names = cats.map((c) => c.name);
    expect(names).toContain("Bonus Mix");
    expect(names.some((n) => /Bonus Mix \d/.test(n))).toBe(false);
    expect(names.some((n) => /\s(?:II|III|IV|V|VI)$/.test(n))).toBe(false);
    expect(taskName("Homonyms A II")).toBe("Homonyms");
    expect(taskName("Brrrr! (BR-)")).toBe("Brrrr!");
    expect(taskName("It’s a Kick III")).toBe("It's a Kick");
    expect(taskName("Letter X Trivia")).toBe("Letter X Trivia");
    const mix = cats.find((c) => c.name === "Bonus Mix")!;
    expect(mix.clues.length).toBeGreaterThanOrEqual(75);
    // the same clue in two sets ("[give both words]") is kept once
    const homonyms = cats.find((c) => c.name === "Homonyms")!;
    expect(homonyms.clues.filter((c) => c.clue.startsWith("Consumed; or, seven plus one"))).toHaveLength(1);
  });

  it("a random merged task still runs easiest to hardest", () => {
    const game = customGame([{ name: "Bonus Mix" }, { name: "Compound Words" }, { name: "Homonyms" }]);
    for (const seed of [1, 2, 3]) {
      const board = boardForRound(game, 0, seed);
      for (const name of ["Bonus Mix", "Compound Words", "Homonyms"]) {
        const col = board.tiles.filter((t) => t.categoryName === name);
        const cat = cats.find((c) => c.name === name)!;
        expect(col.map((t) => cat.clues.find((c) => c.clue === t.clue)!.level)).toEqual([0, 1, 2, 3, 4]);
      }
    }
  });

  it("still opens a board saved with an old set name", () => {
    const board = boardForRound(customGame([{ name: "Bonus Mix 3", clues: [0, 1, 2, 3, 4] }, { name: "Homonyms II" }, { name: "Sheesh I" }]), 0, 7);
    expect(board.categories.map((c) => c.name)).toEqual(["Bonus Mix", "Homonyms", "Sheesh"]);
    expect(board.tiles).toHaveLength(15);
  });
});

describe("guides for every task", () => {
  it("every task in the app has a guide", () => {
    const ids = new Set(GUIDES.map((g) => g.id));
    expect(ids.size).toBe(GUIDES.length);
    for (const name of [...builderCategories().map((c) => c.name), ...quizData.categories.map((c) => c.name)]) {
      expect(ids.has(taskGuide(taskName(name)).id), name).toBe(true);
    }
  });

  it("picks the guide for the task, and a mixed clue's own type", () => {
    expect(guideFor("Sheesh II", "Pilfering small items").name).toBe("Theme Words");
    expect(guideFor("Letter V Trivia", "Which South American country").name).toBe("Letter Trivia");
    expect(guideFor("Bonus Mix 2", "(Hidden Animals) Gi _ _ _ — A being of superhuman size.").name).toBe("Hidden Anatomy");
    expect(guideFor("Bonus Mix 14", "(Homonyms B) To select something").name).toBe("Homonyms");
    expect(guideFor("Bonus Mix", "Something without a type").name).toBe("Bonus Mix");
    expect(guideFor("Rivers", "What river runs through Paris?").name).toBe("Trivia");
  });
});
