import { describe, expect, it } from "vitest";
import { quizData } from "../../src/data/quizData";
import { GAMES } from "../../src/data/games";
import { UOE_GAMES } from "../../src/data/uoeGames";
import {
  boardForRound,
  gameRoundCount,
  getRoundCategories,
  pickFinalForGame,
} from "../../src/lib/board";

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

describe("UoE idiom games", () => {
  it("all 11 games are complete 5x5 boards", () => {
    expect(UOE_GAMES).toHaveLength(11);
    for (const g of UOE_GAMES) {
      expect(g.categories, g.id).toHaveLength(5);
      for (const c of g.categories) {
        expect(c.clues, `${g.id}/${c.name}`).toHaveLength(5);
        for (const cl of c.clues) {
          expect(cl.clue.length).toBeGreaterThan(2);
          expect(cl.answer.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps the original funny category names", () => {
    const names = UOE_GAMES.flatMap((g) => g.categories.map((c) => c.name));
    for (const expected of ["Brrrr! (BR-)", "Golly Gee (G & G)", "Sheesh (SH… / …SH)"]) {
      expect(names).toContain(expected);
    }
  });
});

describe("games", () => {
  const bookNames = new Set(quizData.categories.map((c) => c.name));
  const uoeIds = new Set(UOE_GAMES.map((g) => g.id));

  it("every book round references existing categories with 5+ clues", () => {
    for (const g of GAMES) {
      for (const round of g.bookRounds) {
        expect(round).toHaveLength(5);
        for (const n of round) {
          expect(bookNames.has(n), `missing category "${n}" in game ${g.id}`).toBe(true);
          const cat = quizData.categories.find((c) => c.name === n)!;
          expect(cat.clues.length, `"${n}" has ${cat.clues.length} clues`).toBeGreaterThanOrEqual(5);
        }
      }
    }
  });

  it("every uoe round references an existing game, and games do not mix sources in one round", () => {
    for (const g of GAMES) {
      for (const id of g.uoeRounds) {
        expect(uoeIds.has(id), `missing uoe game "${id}" in ${g.id}`).toBe(true);
      }
      expect(gameRoundCount(g)).toBe(g.bookRounds.length + g.uoeRounds.length);
      expect(gameRoundCount(g)).toBeGreaterThanOrEqual(2);
    }
  });

  it("rounds within a game never repeat a category", () => {
    for (const g of GAMES) {
      const seen: string[] = [];
      for (let r = 0; r < gameRoundCount(g); r++) {
        seen.push(...getRoundCategories(g, r).map((c) => c.id));
      }
      expect(new Set(seen).size, `duplicate category in game ${g.id}`).toBe(seen.length);
    }
  });

  it("boards build for every round with escalating values", () => {
    for (const g of GAMES) {
      for (let r = 0; r < gameRoundCount(g); r++) {
        const b = boardForRound(g, r, 42);
        expect(b.categories).toHaveLength(5);
        expect(b.tiles).toHaveLength(25);
        const mult = r + 1;
        expect(new Set(b.tiles.map((t) => t.value))).toEqual(
          new Set([100, 200, 300, 400, 500].map((v) => v * mult)),
        );
        expect(b.round).toBe(r + 1);
      }
    }
  });

  it("final clue comes from outside the game's book rounds", () => {
    for (const g of GAMES.filter((x) => x.final)) {
      const f = pickFinalForGame(g, 42);
      expect(g.bookRounds.flat()).not.toContain(f.categoryName);
      expect(f.clue.length).toBeGreaterThan(2);
    }
  });
});
