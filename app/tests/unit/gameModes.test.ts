import { describe, expect, it } from "vitest";
import { awardPoints, missPenalty } from "../../src/lib/scoring";
import {
  LIGHTNING_CLUES,
  lightningValue,
  listPlayableGames,
  pickFinalForGame,
  pickLightningClues,
} from "../../src/lib/board";
import { quizData } from "../../src/data/quizData";

describe("wrong answers cost points", () => {
  it("charges the tile value only when the mode is on", () => {
    expect(missPenalty(true, 300, false)).toBe(300);
    expect(missPenalty(false, 300, false)).toBe(0);
  });

  it("charges a team once per clue", () => {
    expect(missPenalty(true, 300, true)).toBe(0);
  });

  it("refunds the penalty when the host awards the charged team anyway", () => {
    expect(awardPoints(300, false)).toBe(300);
    expect(awardPoints(300, true)).toBe(600);
  });
});

describe("lightning round clues", () => {
  const games = listPlayableGames();

  it("are deterministic per seed and vary between seeds", () => {
    const g = games[0];
    expect(pickLightningClues(g, 42)).toEqual(pickLightningClues(g, 42));
    expect(pickLightningClues(g, 42)).not.toEqual(pickLightningClues(g, 43));
  });

  it("fill the round from distinct categories the game and its final don't use", () => {
    for (const g of games) {
      for (const seed of [1, 7, 99]) {
        const clues = pickLightningClues(g, seed);
        expect(clues).toHaveLength(LIGHTNING_CLUES);
        const names = clues.map((c) => c.categoryName);
        expect(new Set(names).size).toBe(names.length);
        const used = new Set(g.bookRounds.flat());
        expect(names.some((n) => used.has(n))).toBe(false);
        expect(names).not.toContain(pickFinalForGame(g, seed).categoryName);
      }
    }
  });

  it("use each category's easiest (first) clue", () => {
    const [c] = pickLightningClues(games[0], 5);
    const cat = quizData.categories.find((k) => k.name === c.categoryName)!;
    expect(c).toEqual({ categoryName: cat.name, clue: cat.clues[0].clue, answer: cat.clues[0].answer });
  });

  it("are worth the cheapest tile of the last board", () => {
    const three = games.find((g) => !g.daily && !g.mix && g.bookRounds.length + g.boardRounds.length === 3)!;
    expect(lightningValue(three)).toBe(300);
    const daily = games.find((g) => g.daily);
    if (daily) expect(lightningValue(daily)).toBe(100);
  });
});
