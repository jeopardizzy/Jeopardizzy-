import { describe, expect, it } from "vitest";
import { grantsFullClub } from "../../src/lib/purchases";

describe("grantsFullClub", () => {
  const base = { productIdentifier: "full_club" };

  it("accepts an iOS transaction (no purchaseState) and an Android purchased one", () => {
    expect(grantsFullClub(base)).toBe(true);
    expect(grantsFullClub({ ...base, purchaseState: "1" })).toBe(true);
  });

  it("rejects refunds, pending payments and other products", () => {
    expect(grantsFullClub({ ...base, revocationDate: "2026-10-20T00:00:00Z" })).toBe(false);
    expect(grantsFullClub({ ...base, purchaseState: "0" })).toBe(false);
    expect(grantsFullClub({ productIdentifier: "something_else" })).toBe(false);
  });
});
