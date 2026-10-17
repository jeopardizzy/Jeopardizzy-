import { describe, expect, it } from "vitest";
import { buildDailyBoard, gameRoundCount } from "../../src/lib/board";
import { GAMES } from "../../src/data/games";
import { dailySeed } from "../../src/lib/random";

describe("daily board", () => {
  const daily = GAMES.find((g) => g.id === "daily-jeopardy")!;

  it("the game def plays exactly one board and skips the final by default", () => {
    expect(daily.daily).toBe(true);
    expect(daily.final).toBe(false);
    expect(gameRoundCount(daily)).toBe(1);
  });

  it("builds a 5x5 board with distinct categories", () => {
    const b = buildDailyBoard(dailySeed());
    expect(b.categories).toHaveLength(5);
    expect(new Set(b.categories.map((c) => c.name)).size).toBe(5);
    expect(b.tiles).toHaveLength(25);
    expect(new Set(b.tiles.map((t) => t.value))).toEqual(new Set([100, 200, 300, 400, 500]));
    // no duplicate clues on the board
    const clues = b.tiles.map((t) => t.clue);
    expect(new Set(clues).size).toBe(clues.length);
  });

  it("same board all day, different board tomorrow", () => {
    const today = new Date(Date.UTC(2026, 9, 14, 8, 0));
    const laterToday = new Date(Date.UTC(2026, 9, 14, 23, 59));
    const tomorrow = new Date(Date.UTC(2026, 9, 15, 0, 1));
    const a = buildDailyBoard(dailySeed(today));
    const b = buildDailyBoard(dailySeed(laterToday));
    const c = buildDailyBoard(dailySeed(tomorrow));
    expect(a.categories.map((x) => x.id)).toEqual(b.categories.map((x) => x.id));
    expect(a.categories.map((x) => x.id)).not.toEqual(c.categories.map((x) => x.id));
  });
});
