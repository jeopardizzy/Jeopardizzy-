import { describe, expect, it } from "vitest";
import { displayClue } from "../../src/lib/displayClue";
import { spokenClue } from "../../src/lib/speech";

describe("displayClue (letter puzzles)", () => {
  it("shows one blank per missing letter and a dash before the definition", () => {
    expect(displayClue("___ ___ ___ ___ny Thin.")).toBe("_ _ _ _ ny — Thin.");
    expect(displayClue("Paper___ ___ ___ ___ Book with a flexible cover.")).toBe("Paper _ _ _ _ — Book with a flexible cover.");
    expect(displayClue("De __ __ __ __ __ y Items brought to someone.")).toBe("De _ _ _ _ _ y — Items brought to someone.");
    expect(displayClue("Ob ___ ___ ___d Did as you were told.")).toBe("Ob _ _ _ d — Did as you were told.");
  });

  it("leaves sentences with a gap, letter grids and ordinary clues alone", () => {
    for (const c of [
      "To break the ____: to ease the awkward silence when people first meet.",
      "Birds of a feather ____ [2 words]",
      "CA___ · SWE___ · OBSE___ · CONSE___",
      "Rhyming pair: little rodents made of frozen water.",
    ]) expect(displayClue(c)).toBe(c);
  });

  it("doesn't change what the quizmaster says (voice clips stay valid)", () => {
    expect(spokenClue("___ ___ ___ ___ny Thin.")).toBe("Thin.");
  });
});
