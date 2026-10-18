import { describe, expect, it } from "vitest";
import { grantsFullClub, needsAcknowledge } from "../../src/lib/purchases";

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

describe("needsAcknowledge (Play promo codes redeemed outside the app)", () => {
  const open = { productIdentifier: "full_club", purchaseState: "1", isAcknowledged: false, purchaseToken: "tok" };

  it("acknowledges an open, purchased Full Club", () => {
    expect(needsAcknowledge(open)).toBe(true);
  });

  it("skips acknowledged, pending, refunded, token-less (iOS) and other products", () => {
    expect(needsAcknowledge({ ...open, isAcknowledged: true })).toBe(false);
    expect(needsAcknowledge({ ...open, purchaseState: "0" })).toBe(false);
    expect(needsAcknowledge({ ...open, revocationDate: "2026-10-20T00:00:00Z" })).toBe(false);
    expect(needsAcknowledge({ productIdentifier: "full_club" })).toBe(false);
    expect(needsAcknowledge({ ...open, productIdentifier: "something_else" })).toBe(false);
  });
});
