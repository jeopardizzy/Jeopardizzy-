import { describe, expect, it } from "vitest";
import { alternates, isCorrect, levenshtein, normalize } from "../../src/lib/answerMatch";

describe("normalize", () => {
  it("strips case, punctuation and leading articles", () => {
    expect(normalize("  The Kremlin! ")).toBe("kremlin");
    expect(normalize("An Apple")).toBe("apple");
    expect(normalize("Mt. Everest")).toBe("mt everest");
  });
});

describe("levenshtein", () => {
  it("computes small distances", () => {
    expect(levenshtein("kremlin", "kremlin")).toBe(0);
    expect(levenshtein("krem lin", "kremlin")).toBe(1);
    expect(levenshtein("abc", "xyz")).toBeGreaterThan(2);
  });
});

describe("alternates", () => {
  it("splits slash answers", () => {
    const alts = alternates("Tops/Spot");
    expect(alts).toContain("tops");
    expect(alts).toContain("spot");
  });

  it("handles parentheticals", () => {
    const alts = alternates("Duck (Eider)");
    expect(alts).toContain("duck");
    expect(alts).toContain("eider");
  });
});

describe("isCorrect", () => {
  it("accepts exact answers ignoring case/punctuation", () => {
    expect(isCorrect("heathrow", "Heathrow")).toBe(true);
    expect(isCorrect("The Seine", "The Seine")).toBe(true);
    expect(isCorrect("seine!", "The Seine")).toBe(true);
  });

  it("accepts small typos on longer answers", () => {
    expect(isCorrect("Gone with the Wimd", "Gone with the Wind")).toBe(true);
    expect(isCorrect("kremlyn", "The Kremlin")).toBe(true);
  });

  it("accepts either side of slash answers", () => {
    expect(isCorrect("spot", "Tops/Spot")).toBe(true);
    expect(isCorrect("tops", "Tops/Spot")).toBe(true);
  });

  it("rejects wrong answers", () => {
    expect(isCorrect("heathrow", "The Thames")).toBe(false);
    expect(isCorrect("paris", "London")).toBe(false);
    expect(isCorrect("", "London")).toBe(false);
  });

  it("rejects tiny answers that merely appear inside", () => {
    expect(isCorrect("red", "Fred")).toBe(false);
  });

  it("accepts heteronyms whose pronunciation note has its own slash", () => {
    expect(isCorrect("dove", "Dove (DOHV/DUHV)")).toBe(true);
    expect(isCorrect("bow", "Bow (BOH/BAO)")).toBe(true);
    expect(isCorrect("close", "Close (CLOSE/CLOZE)")).toBe(true);
    expect(isCorrect("resume", "Resume (Re ZOOM/RES oo may)")).toBe(true);
    expect(isCorrect("dive", "Dove (DOHV/DUHV)")).toBe(false);
  });

  it("every heteronym answer accepts its plain word", async () => {
    const { quizData } = await import("../../src/data/quizData");
    const het = quizData.categories.filter((c) => c.name.startsWith("Heteronyms")).flatMap((c) => c.clues);
    expect(het.length).toBeGreaterThan(20);
    for (const q of het) {
      const word = q.answer.replace(/\(.*$/, "").trim();
      expect(isCorrect(word, q.answer), q.answer).toBe(true);
    }
  });
});
