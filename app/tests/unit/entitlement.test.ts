import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PurchasesAdapter } from "../../src/lib/purchases";
import {
  ENTITLEMENT_KEY,
  STORE_TIMEOUT_MS,
  useEntitlement,
} from "../../src/store/entitlementStore";

const mem = new Map<string, string>();
(globalThis as { localStorage?: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
};

function fake(over: Partial<PurchasesAdapter> = {}): PurchasesAdapter & { fire: () => void; resume: () => void } {
  let listener = () => {};
  let onResume = () => {};
  return {
    kind: "native",
    price: async () => "$4.99",
    owned: async () => false,
    buy: async () => "purchased",
    restore: async () => false,
    onPurchased: (cb) => {
      listener = cb;
    },
    onResume: (cb) => {
      onResume = cb;
    },
    canRedeemCode: false,
    redeemCode: async () => {},
    fire: () => listener(),
    resume: () => onResume(),
    ...over,
  };
}

const never = <T>() => new Promise<T>(() => {});
const cached = () => JSON.parse(mem.get(ENTITLEMENT_KEY) ?? "{}").fullClub;
const reset = () =>
  useEntitlement.setState({ fullClub: false, price: null, busy: "idle", notice: null, sheetOpen: false });

describe("Full Club entitlement", () => {
  beforeEach(() => {
    mem.clear();
    reset();
  });
  afterEach(() => vi.useRealTimers());

  it("launch: store says owned → unlocked, cached, price loaded", async () => {
    await useEntitlement.getState().init(fake({ owned: async () => true }));
    expect(useEntitlement.getState().fullClub).toBe(true);
    expect(useEntitlement.getState().price).toBe("$4.99");
    expect(cached()).toBe(true);
  });

  it("launch after a refund: store says not owned → revoked", async () => {
    mem.set(ENTITLEMENT_KEY, JSON.stringify({ fullClub: true }));
    await useEntitlement.getState().init(fake({ owned: async () => false }));
    expect(useEntitlement.getState().fullClub).toBe(false);
    expect(cached()).toBe(false);
  });

  it("offline launch: store errors → cached unlock kept", async () => {
    mem.set(ENTITLEMENT_KEY, JSON.stringify({ fullClub: true }));
    await useEntitlement.getState().init(
      fake({ owned: async () => Promise.reject(new Error("offline")), price: async () => Promise.reject(new Error("offline")) }),
    );
    expect(useEntitlement.getState().fullClub).toBe(true);
  });

  it("store never answers on launch → times out, cached answer kept", async () => {
    vi.useFakeTimers();
    mem.set(ENTITLEMENT_KEY, JSON.stringify({ fullClub: true }));
    const done = useEntitlement.getState().init(fake({ owned: never, price: never }));
    await vi.advanceTimersByTimeAsync(STORE_TIMEOUT_MS * 2 + 10);
    await done;
    expect(useEntitlement.getState().fullClub).toBe(true);
  });

  it("buy: success unlocks and closes the sheet", async () => {
    await useEntitlement.getState().init(fake());
    useEntitlement.getState().openSheet();
    await useEntitlement.getState().buy();
    const s = useEntitlement.getState();
    expect(s.fullClub).toBe(true);
    expect(s.sheetOpen).toBe(false);
    expect(s.busy).toBe("idle");
  });

  it("buy: cancel leaves it locked with no error", async () => {
    await useEntitlement.getState().init(fake({ buy: async () => "cancelled" }));
    await useEntitlement.getState().buy();
    expect(useEntitlement.getState()).toMatchObject({ fullClub: false, busy: "idle", notice: null });
  });

  it("buy: pending payment says so, then the listener unlocks when it clears", async () => {
    const a = fake({ buy: async () => "pending" });
    await useEntitlement.getState().init(a);
    await useEntitlement.getState().buy();
    expect(useEntitlement.getState().notice).toBe("pending");
    a.fire();
    expect(useEntitlement.getState().fullClub).toBe(true);
  });

  it("restore on an account that owns nothing answers, never hangs", async () => {
    await useEntitlement.getState().init(fake({ restore: async () => false }));
    await useEntitlement.getState().restore();
    expect(useEntitlement.getState()).toMatchObject({ fullClub: false, busy: "idle", notice: "nothing-to-restore" });
  });

  it("restore that never returns times out to an error, not a spinner", async () => {
    vi.useFakeTimers();
    const init = useEntitlement.getState().init(fake({ restore: never }));
    await vi.advanceTimersByTimeAsync(10);
    await init;
    const p = useEntitlement.getState().restore();
    expect(useEntitlement.getState().busy).toBe("restoring");
    await vi.advanceTimersByTimeAsync(STORE_TIMEOUT_MS + 10);
    await p;
    expect(useEntitlement.getState()).toMatchObject({ busy: "idle", notice: "error" });
  });

  it("restore finds the purchase → unlocked", async () => {
    await useEntitlement.getState().init(fake({ restore: async () => true }));
    await useEntitlement.getState().restore();
    expect(useEntitlement.getState()).toMatchObject({ fullClub: true, notice: "restored" });
  });

  it("resume: a promo code redeemed in the Play Store unlocks on return", async () => {
    let owns = false;
    const a = fake({ owned: async () => owns });
    await useEntitlement.getState().init(a);
    useEntitlement.getState().openSheet();
    owns = true;
    a.resume();
    await vi.waitFor(() => expect(useEntitlement.getState().fullClub).toBe(true));
    expect(useEntitlement.getState().sheetOpen).toBe(false);
    expect(cached()).toBe(true);
  });

  it("resume: a refund seen on return revokes; an offline return keeps the unlock", async () => {
    let answer: () => Promise<boolean> = async () => true;
    const a = fake({ owned: () => answer() });
    await useEntitlement.getState().init(a);
    answer = async () => Promise.reject(new Error("offline"));
    a.resume();
    await new Promise((r) => setTimeout(r, 0));
    expect(useEntitlement.getState().fullClub).toBe(true);
    answer = async () => false;
    a.resume();
    await vi.waitFor(() => expect(useEntitlement.getState().fullClub).toBe(false));
  });

  it("redeem: shows the store's code sheet; the redeemed code unlocks via the listener", async () => {
    const redeemCode = vi.fn(async () => {});
    const a = fake({ canRedeemCode: true, redeemCode });
    await useEntitlement.getState().init(a);
    expect(useEntitlement.getState().canRedeem).toBe(true);
    await useEntitlement.getState().redeem();
    expect(redeemCode).toHaveBeenCalledOnce();
    expect(useEntitlement.getState().notice).toBeNull();
    a.fire();
    expect(useEntitlement.getState().fullClub).toBe(true);
  });

  it("redeem: a sheet that fails to open says where else to redeem", async () => {
    await useEntitlement.getState().init(fake({ redeemCode: async () => Promise.reject(new Error("iOS 15")) }));
    await useEntitlement.getState().redeem();
    expect(useEntitlement.getState().notice).toBe("redeem-error");
  });
});
