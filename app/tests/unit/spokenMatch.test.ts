import { describe, expect, it } from "vitest";
import { heardIn, soundKey } from "../../src/lib/spokenMatch";

describe("heardIn (speech-to-text transcripts)", () => {
  it("finds the answer inside a sentence", () => {
    expect(heardIn("I think it's Mount Everest.", "Mt. Everest")).toBe(true);
    expect(heardIn("It's the Danube, I guess", "Danube")).toBe(true);
  });

  it("reads digits as words", () => {
    expect(heardIn("I think it's 8.", "Ate/eight")).toBe(true);
  });

  it("joins one word heard as two", () => {
    expect(heardIn("I think it's in pair.", "Impair")).toBe(true);
  });

  it("accepts close sound-alikes", () => {
    expect(heardIn("I think it's Julian.", "Julienne")).toBe(true);
    expect(soundKey("julian")).toBe(soundKey("julienne"));
  });

  it("does not accept a different answer", () => {
    expect(heardIn("I think it's Paris.", "London")).toBe(false);
    expect(heardIn("Sloth", "Cloth")).toBe(false);
    expect(heardIn("dive", "Dove (DOHV/DUHV)")).toBe(false);
    expect(heardIn("", "Dove (DOHV/DUHV)")).toBe(false);
  });
});
