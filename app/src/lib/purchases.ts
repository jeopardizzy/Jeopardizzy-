import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE, type Transaction } from "@capgo/native-purchases";
import { FULL_CLUB_PRODUCT_ID } from "./access";

/**
 * Thin platform layer over the stores. The entitlement store talks only to
 * this interface, so tests swap in a fake and the web build gets a stub.
 * StoreKit 2 / Play Billing via @capgo/native-purchases — no backend, no
 * third-party payments service, nothing leaves the device but the purchase.
 */
export interface PurchasesAdapter {
  readonly kind: "native" | "web";
  /** localized price ("$4.99"), or null when the store can't say */
  price(): Promise<string | null>;
  /** does the store report a current, unrevoked Full Club purchase? */
  owned(): Promise<boolean>;
  buy(): Promise<"purchased" | "cancelled" | "pending">;
  /** ask the store to resync, then report ownership */
  restore(): Promise<boolean>;
  /** purchases that complete outside buy() (Ask to Buy, pending payments) */
  onPurchased(cb: () => void): void;
}

const INAPP = { productType: PURCHASE_TYPE.INAPP } as const;

/** Valid Full Club transaction: right product, not refunded, not pending (Android). */
export function grantsFullClub(t: Pick<Transaction, "productIdentifier" | "revocationDate" | "purchaseState">): boolean {
  if (t.productIdentifier !== FULL_CLUB_PRODUCT_ID) return false;
  if (t.revocationDate) return false;
  return t.purchaseState === undefined || t.purchaseState === "1";
}

function isCancel(err: unknown): boolean {
  const msg = String((err as { message?: string })?.message ?? err).toLowerCase();
  return msg.includes("cancel");
}

const nativeAdapter: PurchasesAdapter = {
  kind: "native",
  async price() {
    const { products } = await NativePurchases.getProducts({
      productIdentifiers: [FULL_CLUB_PRODUCT_ID],
      ...INAPP,
    });
    return products[0]?.priceString ?? null;
  },
  async owned() {
    const { purchases } = await NativePurchases.getPurchases({ ...INAPP, onlyCurrentEntitlements: true });
    return purchases.some(grantsFullClub);
  },
  async buy() {
    try {
      const t = await NativePurchases.purchaseProduct({ productIdentifier: FULL_CLUB_PRODUCT_ID, ...INAPP });
      if (t.purchaseState === "0") return "pending";
      return grantsFullClub(t) ? "purchased" : "pending";
    } catch (err) {
      if (isCancel(err)) return "cancelled";
      throw err;
    }
  },
  async restore() {
    await NativePurchases.restorePurchases();
    return nativeAdapter.owned();
  },
  onPurchased(cb) {
    void NativePurchases.addListener("transactionUpdated", (t) => {
      if (grantsFullClub(t)) cb();
    });
  },
};

/**
 * The website sells nothing: Full Club lives in the iOS and Android apps.
 * owned() is "unknown" (rejects) rather than false, so the cached flag stands;
 * e2e tests seed it to exercise the unlocked UI. The web bundle ships every
 * clue anyway, so the flag protects nothing there.
 */
const webAdapter: PurchasesAdapter = {
  kind: "web",
  price: async () => null,
  owned: async () => Promise.reject(new Error("no store on the web")),
  buy: async () => "cancelled",
  restore: async () => false,
  onPurchased: () => {},
};

export function platformAdapter(): PurchasesAdapter {
  return Capacitor.isNativePlatform() ? nativeAdapter : webAdapter;
}

export const STORE_LINKS = {
  appStore: "https://apps.apple.com/app/id6823775451",
  googlePlay: "https://play.google.com/store/apps/details?id=com.quizzicalclub.app",
} as const;
