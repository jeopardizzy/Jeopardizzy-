import { create } from "zustand";
import type { PurchasesAdapter } from "../lib/purchases";
import { TRIAL_MS } from "../lib/access";

/**
 * Full Club entitlement. The stores are the source of truth; the device
 * keeps the last answer so the unlock survives offline cold starts.
 * - launch and every return to the foreground: show the cached answer, then
 *   ask the store. A definite "not owned" (e.g. after a refund) revokes; an
 *   error or timeout keeps it. The resume check picks up promo codes redeemed
 *   in the Play Store app.
 * - every store call is time-boxed so the UI can never hang on "Restoring…",
 *   including on accounts that own nothing.
 * Not part of progress backups: a backup must not be able to grant it.
 *
 * The free week sits beside the purchase, never inside it: `fullClub` is
 * "bought", `trialActive` is "inside the free week", and access is either
 * (see hasAccess). A refund check can't end a trial and an ending trial
 * can't touch a purchase. The start time is the earliest one known: the
 * device's record or, on iOS, the free "7-Day Trial" purchase, so a
 * reinstall on iOS doesn't buy another week.
 */
export const ENTITLEMENT_KEY = "quizzical-club:entitlement:v1";
export const TRIAL_KEY = "quizzical-club:trial:v1";
/** the last-day reminder shows inside this window before the end */
export const TRIAL_WARN_MS = 24 * 60 * 60 * 1000;

export const STORE_TIMEOUT_MS = 15_000;
export const BUY_TIMEOUT_MS = 180_000;

export type Busy = "idle" | "buying" | "restoring";
export type Notice =
  | "restored"
  | "nothing-to-restore"
  | "pending"
  | "error"
  | "redeem-error"
  | "trial-ending"
  | "trial-ended"
  | null;

interface TrialRecord {
  startedAt: number;
  /** the last-day reminder was shown */
  warned?: boolean;
  /** the "your free week is over" sheet was shown */
  endedShown?: boolean;
}

interface EntitlementState {
  fullClub: boolean;
  price: string | null;
  platform: "native" | "web" | null;
  canRedeem: boolean;
  busy: Busy;
  notice: Notice;
  sheetOpen: boolean;
  /** the free week can start on this platform and hasn't yet */
  trialAvailable: boolean;
  /** when the free week ends (or ended); null if it never started */
  trialEndsAt: number | null;
  trialActive: boolean;
  init: (adapter: PurchasesAdapter) => Promise<void>;
  buy: () => Promise<void>;
  restore: () => Promise<void>;
  /** opens the store's code sheet; a redeemed code unlocks through onPurchased */
  redeem: () => Promise<void>;
  startTrial: () => Promise<void>;
  openSheet: () => void;
  closeSheet: () => void;
}

function loadCached(): boolean {
  try {
    const raw = globalThis.localStorage?.getItem(ENTITLEMENT_KEY);
    return raw ? JSON.parse(raw)?.fullClub === true : false;
  } catch {
    return false;
  }
}

function saveCached(fullClub: boolean): void {
  try {
    globalThis.localStorage?.setItem(ENTITLEMENT_KEY, JSON.stringify({ fullClub, checkedAt: new Date().toISOString() }));
  } catch {
    /* storage full or blocked: the store answer still applies this session */
  }
}

function loadTrial(): TrialRecord | null {
  try {
    const raw = globalThis.localStorage?.getItem(TRIAL_KEY);
    const rec = raw ? JSON.parse(raw) : null;
    return rec && Number.isFinite(rec.startedAt) ? rec : null;
  } catch {
    return null;
  }
}

function saveTrial(rec: TrialRecord): void {
  try {
    globalThis.localStorage?.setItem(TRIAL_KEY, JSON.stringify(rec));
  } catch {
    /* storage blocked: the trial still runs this session */
  }
}

/** Full Club access right now: bought, or inside the free week. */
export const hasAccess = (s: { fullClub: boolean; trialActive: boolean }): boolean => s.fullClub || s.trialActive;

export function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e) => (clearTimeout(t), reject(e)),
    );
  });
}

let adapter: PurchasesAdapter | null = null;
let trialTimer: ReturnType<typeof setTimeout> | undefined;

export const useEntitlement = create<EntitlementState>((set, get) => {
  // Every ownership check and purchase grant gets a number; a check's answer
  // only applies if nothing newer happened while the store was thinking, so a
  // slow "not owned" from before a purchase can't lock a paying player out.
  let latest = 0;

  const grant = () => {
    latest++;
    saveCached(true);
    set({ fullClub: true, sheetOpen: false, busy: "idle" });
  };

  const check = async (a: PurchasesAdapter) => {
    const mine = ++latest;
    try {
      const owned = await withTimeout(a.owned(), STORE_TIMEOUT_MS);
      if (mine !== latest) return; // superseded by a purchase or a newer check
      if (owned && !get().fullClub) return grant();
      saveCached(owned);
      set({ fullClub: owned });
    } catch {
      /* offline or store unavailable: keep the cached answer */
    }
  };

  /** recompute trialActive from the record, and wake up again when it ends */
  const applyTrial = () => {
    const rec = loadTrial();
    const endsAt = rec ? rec.startedAt + TRIAL_MS : null;
    const active = endsAt !== null && Date.now() < endsAt;
    clearTimeout(trialTimer);
    if (active) trialTimer = setTimeout(applyTrial, Math.min(endsAt - Date.now() + 50, 2 ** 31 - 1));
    set({ trialEndsAt: endsAt, trialActive: active, trialAvailable: get().trialAvailable && !rec });
  };

  /** the earliest known start wins: a reinstall can't restart the week */
  const recordTrialStart = (at: number) => {
    const rec = loadTrial();
    if (rec && rec.startedAt <= at) return;
    saveTrial({ ...rec, startedAt: at });
  };

  /** once each: a reminder on the last day, and a note when the week is over */
  const remind = () => {
    const s = get();
    const rec = loadTrial();
    if (s.fullClub || !rec || s.sheetOpen || s.trialEndsAt === null) return;
    const left = s.trialEndsAt - Date.now();
    if (left > 0 && left <= TRIAL_WARN_MS && !rec.warned) {
      saveTrial({ ...rec, warned: true });
      set({ sheetOpen: true, notice: "trial-ending" });
    } else if (left <= 0 && !rec.endedShown) {
      saveTrial({ ...rec, warned: true, endedShown: true });
      set({ sheetOpen: true, notice: "trial-ended" });
    }
  };

  const syncTrial = async (a: PurchasesAdapter) => {
    try {
      const at = await withTimeout(a.trialStartedAt(), STORE_TIMEOUT_MS);
      if (at !== null) recordTrialStart(at);
    } catch {
      /* offline: the device's record stands */
    }
    applyTrial();
  };

  return {
    fullClub: loadCached(),
    price: null,
    platform: null,
    canRedeem: false,
    busy: "idle",
    notice: null,
    sheetOpen: false,
    trialAvailable: false,
    trialEndsAt: null,
    trialActive: false,

    init: async (a) => {
      adapter = a;
      set({ platform: a.kind, canRedeem: a.canRedeemCode, fullClub: loadCached(), trialAvailable: false });
      applyTrial();
      a.onPurchased(grant);
      a.onResume(() => {
        void Promise.all([check(a), syncTrial(a)]).then(remind);
      });
      await Promise.all([check(a), syncTrial(a)]);
      remind();
      try {
        set({ price: await withTimeout(a.price(), STORE_TIMEOUT_MS) });
      } catch {
        /* no price: the sheet shows a generic label */
      }
      try {
        const available = await withTimeout(a.trialAvailable(), STORE_TIMEOUT_MS);
        set({ trialAvailable: available && !loadTrial() });
      } catch {
        /* store unreachable: no trial offer until it answers */
      }
    },

    buy: async () => {
      if (!adapter || get().busy !== "idle") return;
      set({ busy: "buying", notice: null });
      try {
        const r = await withTimeout(adapter.buy(), BUY_TIMEOUT_MS);
        if (r === "purchased") return grant();
        set({ busy: "idle", notice: r === "pending" ? "pending" : null });
      } catch {
        set({ busy: "idle", notice: "error" });
      }
    },

    restore: async () => {
      if (!adapter || get().busy !== "idle") return;
      set({ busy: "restoring", notice: null });
      try {
        const owned = await withTimeout(adapter.restore(), STORE_TIMEOUT_MS);
        if (owned) {
          grant();
          set({ notice: "restored" });
        } else {
          set({ busy: "idle", notice: "nothing-to-restore" });
        }
      } catch {
        set({ busy: "idle", notice: "error" });
      }
    },

    redeem: async () => {
      if (!adapter || get().busy !== "idle") return;
      set({ notice: null });
      try {
        await withTimeout(adapter.redeemCode(), STORE_TIMEOUT_MS);
      } catch {
        set({ notice: "redeem-error" });
      }
    },

    startTrial: async () => {
      if (!adapter || get().busy !== "idle" || !get().trialAvailable) return;
      set({ busy: "buying", notice: null });
      try {
        const at = await withTimeout(adapter.startTrial(), BUY_TIMEOUT_MS);
        if (at === "cancelled") return set({ busy: "idle" });
        recordTrialStart(at);
        set({ busy: "idle", sheetOpen: false });
        applyTrial();
      } catch {
        set({ busy: "idle", notice: "error" });
      }
    },

    openSheet: () => set({ sheetOpen: true, notice: null }),
    closeSheet: () => set({ sheetOpen: false }),
  };
});
