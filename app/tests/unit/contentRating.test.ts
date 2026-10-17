import { describe, expect, it } from "vitest";
import { quizData } from "../../src/data/quizData";
import { LEGACY_BOARDS } from "../../src/data/legacyBoards";
import { ARENA3_BOARDS } from "../../src/data/arena3Boards";
import { ARENA4_BOARDS } from "../../src/data/arena4Boards";
import { UOE_GAMES } from "../../src/data/uoeGames";

/**
 * Both store ratings (App Store 4+, Google Play IARC "Everyone"/3+) declare
 * no alcohol, drug or tobacco references. One such clue raises the rating to
 * 13+ (Apple), Teen (ESRB) and 18+ (Taiwan), so any new clue that mentions
 * them must be reworded, or both questionnaires redone.
 */
const BANNED =
  /\b(alcohol(ic)?|beers?|wines?|wineglass|whisk(e)?y|vodka|rum|gin|brandy|champagne|cocktails?|liquors?|liqueur|booze|drunk(en)?|inebriated|tipsy|hangover|sober|distill(ed|ery)|martini|tequila|cigars?|cigarettes?|tobacco|nicotine|hookah|smoking|marijuana|cannabis|ganja|cocaine|heroin|opium|lsd|narcotics?|drugs?|drugstore)\b/i;

function allTexts(): string[] {
  const out: string[] = [];
  for (const c of quizData.categories) {
    out.push(c.name);
    for (const cl of c.clues) out.push(cl.clue, cl.answer);
  }
  for (const g of [...LEGACY_BOARDS, ...ARENA3_BOARDS, ...ARENA4_BOARDS, ...UOE_GAMES]) {
    for (const cat of g.categories) {
      out.push(cat.name);
      for (const cl of cat.clues) out.push(cl.clue, cl.answer, cl.note ?? "");
    }
  }
  return out;
}

describe("content stays all-ages", () => {
  it("no clue, answer, note or category mentions alcohol, drugs or tobacco", () => {
    const hits = allTexts().filter((t) => BANNED.test(t));
    expect(hits).toEqual([]);
  });
});
