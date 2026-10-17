import { describe, expect, it } from "vitest";
import { listPlayableGames } from "../../src/lib/board";
import {
  FREE_GAME_IDS,
  canDrill,
  canPlayGame,
  canUseLevel,
  isGameFree,
} from "../../src/lib/access";

describe("free tier", () => {
  const games = listPlayableGames();

  it("frees exactly one game per series plus the Daily Board", () => {
    const free = games.filter((g) => isGameFree(g) && !g.daily);
    expect(free.map((g) => g.series).sort()).toEqual(["Book Club", "Classic Vault", "Idiom Arenas"]);
    expect(games.filter((g) => g.daily && isGameFree(g))).toHaveLength(1);
  });

  it("every free id names a real playable game (catches renames and re-splits)", () => {
    const ids = new Set(games.map((g) => g.id));
    const real = [...FREE_GAME_IDS].filter((id) => ids.has(id));
    // classic-wordplay is listed both whole and as part 1; exactly one form exists
    expect(real.length).toBe(3);
  });

  it("locks the rest unless Full Club is owned", () => {
    const locked = games.filter((g) => !isGameFree(g));
    expect(locked.length).toBeGreaterThan(10);
    for (const g of locked) {
      expect(canPlayGame(g, false)).toBe(false);
      expect(canPlayGame(g, true)).toBe(true);
    }
  });

  it("workbook: Easy is free, other levels and drills need Full Club", () => {
    expect(canUseLevel("easy", false)).toBe(true);
    for (const l of ["all", "medium", "hard"] as const) {
      expect(canUseLevel(l, false)).toBe(false);
      expect(canUseLevel(l, true)).toBe(true);
    }
    expect(canDrill(false)).toBe(false);
    expect(canDrill(true)).toBe(true);
  });
});
