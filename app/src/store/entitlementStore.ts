import { create } from "zustand";
import type { PurchasesAdapter } from "../lib/purchases";

/**
 * Full Club entitlement. The stores are the source of truth; the device
 * keeps the last answer so the unlock survives offline cold starts.
 * - launch: show the cached answer at once, then ask the store. A definite
 *   "not owned" (e.g. after a refund) revokes; an error or timeout keeps it.
 * - every store call is time-boxed so the UI can never hang on "Restoring…",
 *   including on accounts that own nothing.
 * Not part of progress backups: a backup must not be able to grant it.
 */
export const ENTITLEMENT_KEY = "quizzical-club:entitlement:v1";

export const STORE_TIMEOUT_MS = 15_000;
export const BUY_TIMEOUT_MS = 180_000;

export type Busy = "idle" | "buying" | "restoring";
export type Notice = "restored" | "nothing-to-restore" | "pending" | "error" | null;

interface EntitlementState {
  fullClub: boolean;
  price: string | null;
  platform: "native" | "web" | null;
  busy: Busy;
  notice: Notice;
  sheetOpen: boolean;
  init: (adapter: PurchasesAdapter) => Promise<void>;
  buy: () => Promise<void>;
  restore: () => Promise<void>;
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

export const useEntitlement = create<EntitlementState>((set, get) => {
  const grant = () => {
    saveCached(true);
    set({ fullClub: true, sheetOpen: false, busy: "idle" });
  };

  return {
    fullClub: loadCached(),
    price: null,
    platform: null,
    busy: "idle",
    notice: null,
    sheetOpen: false,

    init: async (a) => {
      adapter = a;
      set({ platform: a.kind, fullClub: loadCached() });
      a.onPurchased(grant);
      try {
        const owned = await withTimeout(a.owned(), STORE_TIMEOUT_MS);
        saveCached(owned);
        set({ fullClub: owned });
      } catch {
        /* offline or store unavailable: keep the cached answer */
      }
      try {
        set({ price: await withTimeout(a.price(), STORE_TIMEOUT_MS) });
      } catch {
        /* no price: the sheet shows a generic label */
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

    openSheet: () => set({ sheetOpen: true, notice: null }),
    closeSheet: () => set({ sheetOpen: false }),
  };
});
