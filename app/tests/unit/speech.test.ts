import { describe, expect, it } from "vitest";
import { HOST_LINES, spokenAnswer, spokenClue, voiceId } from "../../src/lib/speech";
import { clipFor, setVoiceManifest } from "../../src/audio/voice";

describe("voiceId", () => {
  it("is stable, kind-prefixed and whitespace-insensitive", () => {
    const a = voiceId("clue", "Birds of a feather ___");
    expect(a).toMatch(/^c-[0-9a-z]+$/);
    expect(voiceId("clue", "  Birds of a  feather ___ ")).toBe(a);
    expect(voiceId("answer", "Birds of a feather ___")).toMatch(/^a-/);
    expect(voiceId("clue", "Birds of a feather ____")).not.toBe(a);
  });
});

describe("spoken text", () => {
  it("reads blanks as 'blank'", () => {
    expect(spokenClue("Birds of a feather ___")).toBe("Birds of a feather blank");
  });

  it("reads only the definition of a letter puzzle, and an instruction for letter grids", () => {
    expect(spokenClue("H ___ ___ ___ony Notes sung together in a pleasing combination of sounds.")).toBe(
      "Notes sung together in a pleasing combination of sounds.",
    );
    expect(spokenClue("De __ __ __ __ __ y Items brought to someone.")).toBe("Items brought to someone.");
    expect(spokenClue("C___ ___ ___munk Small rodent with stripes on its back.")).toBe("Small rodent with stripes on its back.");
    expect(spokenClue("VA ___ · COL ___ E · SO ___ · HO ___ AY")).toBe("Fill in the missing letters.");
    expect(spokenClue("My new laptop is miles ______ of my old one.")).toBe("My new laptop is miles blank of my old one.");
  });

  it("reads slash answers as alternatives and caps words as words", () => {
    expect(spokenAnswer("POLE / POLL")).toBe("pole, or poll");
    expect(spokenAnswer("flock together")).toBe("flock together");
  });

  it("keeps initials spelled out", () => {
    expect(spokenAnswer("FBI")).toBe("FBI");
    expect(spokenClue("The UK capital")).toBe("The UK capital");
  });
});

describe("voice player lookup", () => {
  it("finds baked clips and skips missing ones", () => {
    const id = voiceId("clue", "Birds of a feather ___");
    setVoiceManifest({ version: 1, clips: { [id]: { d: 2.1 }, "h-answerIs": { d: 0.9 } } });
    expect(clipFor({ kind: "clue", text: "Birds of a feather ___" })).toBe(id);
    expect(clipFor({ line: "answerIs" })).toBe("h-answerIs");
    expect(clipFor({ kind: "clue", text: "never baked" })).toBeNull();
    setVoiceManifest(null);
    expect(clipFor({ line: "answerIs" })).toBeNull();
  });

  it("host lines are short and free of game-show trademarks", () => {
    for (const line of Object.values(HOST_LINES)) {
      expect(line.length).toBeLessThan(80);
      expect(line.toLowerCase()).not.toContain("jeopardy");
    }
  });
});
