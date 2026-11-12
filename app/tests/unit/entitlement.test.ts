import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PurchasesAdapter } from "../../src/lib/purchases";
import {
  ENTITLEMENT_KEY,
  STORE_TIMEOUT_MS,
  TRIAL_KEY,
  hasAccess,
  useEntitlement,
} from "../../src/store/entitlementStore";
import { TRIAL_MS, trialDaysLeft } from "../../src/lib/access";

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
    price: async () => "$7.99",
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
    trialAvailable: async () => true,
    trialStartedAt: async () => null,
    startTrial: async () => Date.now(),
    fire: () => listener(),
    resume: () => onResume(),
    ...over,
  };
}

const never = <T>() => new Promise<T>(() => {});
const cached = () => JSON.parse(mem.get(ENTITLEMENT_KEY) ?? "{}").fullClub;
const reset = () =>
  useEntitlement.setState({
    fullClub: false,
    price: null,
    busy: "idle",
    notice: null,
    sheetOpen: false,
    trialAvailable: false,
    trialEndsAt: null,
    trialActive: false,
  });
const DAY = 24 * 60 * 60 * 1000;
const trialRec = () => JSON.parse(mem.get(TRIAL_KEY) ?? "null");

describe("Full Club entitlement", () => {
  beforeEach(() => {
    mem.clear();
    reset();
  });
  afterEach(() => vi.useRealTimers());

  it("a slow 'not owned' answer from before a purchase doesn't lock the buyer out", async () => {
    let answerOld: (v: boolean) => void = () => {};
    const a = fake({ owned: () => new Promise<boolean>((r) => (answerOld = r)) });
    const launch = useEntitlement.getState().init(a);
    a.fire(); // the purchase lands while the launch check is still waiting
    expect(useEntitlement.getState().fullClub).toBe(true);
    answerOld(false);
    await launch;
    expect(useEntitlement.getState().fullClub).toBe(true);
    expect(cached()).toBe(true);
  });

  it("launch: store says owned → unlocked, cached, price loaded", async () => {
    await useEntitlement.getState().init(fake({ owned: async () => true }));
    expect(useEntitlement.getState().fullClub).toBe(true);
    expect(useEntitlement.getState().price).toBe("$7.99");
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

describe("Free week", () => {
  beforeEach(() => {
    mem.clear();
    reset();
  });
  afterEach(() => vi.useRealTimers());

  it("offered on a fresh install; starting it opens everything without buying", async () => {
    await useEntitlement.getState().init(fake());
    expect(useEntitlement.getState().trialAvailable).toBe(true);
    useEntitlement.getState().openSheet();
    await useEntitlement.getState().startTrial();
    const s = useEntitlement.getState();
    expect(s).toMatchObject({ fullClub: false, trialActive: true, trialAvailable: false, sheetOpen: false });
    expect(hasAccess(s)).toBe(true);
    expect(trialDaysLeft(s.trialEndsAt!, Date.now())).toBe(7);
    expect(cached()).toBe(false); // the free week is never cached as a purchase
  });

  it("cancelling the store sheet starts nothing", async () => {
    await useEntitlement.getState().init(fake({ startTrial: async () => "cancelled" }));
    await useEntitlement.getState().startTrial();
    expect(useEntitlement.getState()).toMatchObject({ trialActive: false, trialAvailable: true, busy: "idle" });
    expect(trialRec()).toBeNull();
  });

  it("not offered where the store has no trial product (or on the web)", async () => {
    await useEntitlement.getState().init(fake({ trialAvailable: async () => false }));
    expect(useEntitlement.getState().trialAvailable).toBe(false);
    await useEntitlement.getState().startTrial();
    expect(useEntitlement.getState().trialActive).toBe(false);
  });

  it("ends by itself after 7 days, even with the app open", async () => {
    vi.useFakeTimers();
    const init = useEntitlement.getState().init(fake());
    await vi.advanceTimersByTimeAsync(10);
    await init;
    await useEntitlement.getState().startTrial();
    expect(hasAccess(useEntitlement.getState())).toBe(true);
    await vi.advanceTimersByTimeAsync(TRIAL_MS + 1000);
    expect(hasAccess(useEntitlement.getState())).toBe(false);
  });

  it("only once: an ended week is not offered again", async () => {
    mem.set(TRIAL_KEY, JSON.stringify({ startedAt: Date.now() - 8 * DAY, warned: true, endedShown: true }));
    await useEntitlement.getState().init(fake());
    expect(useEntitlement.getState()).toMatchObject({ trialActive: false, trialAvailable: false, sheetOpen: false });
  });

  it("iOS reinstall: the store's earlier start wins over a fresh device", async () => {
    const started = Date.now() - 3 * DAY;
    await useEntitlement.getState().init(fake({ trialStartedAt: async () => started }));
    const s = useEntitlement.getState();
    expect(s).toMatchObject({ trialActive: true, trialAvailable: false });
    expect(s.trialEndsAt).toBe(started + TRIAL_MS);
    expect(trialRec().startedAt).toBe(started);
  });

  it("last day: the sheet opens once with a reminder", async () => {
    mem.set(TRIAL_KEY, JSON.stringify({ startedAt: Date.now() - 6.5 * DAY }));
    await useEntitlement.getState().init(fake());
    expect(useEntitlement.getState()).toMatchObject({ sheetOpen: true, notice: "trial-ending", trialActive: true });
    useEntitlement.getState().closeSheet();
    await useEntitlement.getState().init(fake());
    expect(useEntitlement.getState().sheetOpen).toBe(false);
  });

  it("after the week: the sheet opens once to say it's over", async () => {
    mem.set(TRIAL_KEY, JSON.stringify({ startedAt: Date.now() - 8 * DAY, warned: true }));
    await useEntitlement.getState().init(fake());
    expect(useEntitlement.getState()).toMatchObject({ sheetOpen: true, notice: "trial-ended", trialActive: false });
    useEntitlement.getState().closeSheet();
    await useEntitlement.getState().init(fake());
    expect(useEntitlement.getState().sheetOpen).toBe(false);
  });

  it("buyers never see trial reminders, and a refund check can't end a trial", async () => {
    mem.set(TRIAL_KEY, JSON.stringify({ startedAt: Date.now() - 6.5 * DAY }));
    await useEntitlement.getState().init(fake({ owned: async () => true }));
    expect(useEntitlement.getState().sheetOpen).toBe(false);
    reset();
    mem.set(TRIAL_KEY, JSON.stringify({ startedAt: Date.now() - DAY }));
    await useEntitlement.getState().init(fake({ owned: async () => false }));
    expect(hasAccess(useEntitlement.getState())).toBe(true);
  });

  it("offline store on launch keeps the device's trial", async () => {
    mem.set(TRIAL_KEY, JSON.stringify({ startedAt: Date.now() - DAY }));
    await useEntitlement.getState().init(
      fake({ trialStartedAt: async () => Promise.reject(new Error("offline")), trialAvailable: async () => Promise.reject(new Error("offline")) }),
    );
    expect(useEntitlement.getState().trialActive).toBe(true);
  });
});
