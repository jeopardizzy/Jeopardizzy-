import { describe, expect, it } from "vitest";
import { boardForRound, builderCategories, customGame, gameRoundCount } from "../../src/lib/board";
import { canPlayGame } from "../../src/lib/access";

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
});
