import { describe, expect, it } from "vitest";
import { shouldAskForReview } from "../../src/lib/reviewPrompt";

describe("review prompt", () => {
  it("asks only after the 2nd, 5th and 12th finished game", () => {
    const asked = Array.from({ length: 30 }, (_, i) => i).filter(shouldAskForReview);
    expect(asked).toEqual([2, 5, 12]);
  });
});
