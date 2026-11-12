import { Capacitor } from "@capacitor/core";
import { AnimatePresence, motion } from "motion/react";
import { useEntitlement } from "../store/entitlementStore";
import { STORE_LINKS } from "../lib/purchases";
import { useMotionSafe } from "../lib/useMotionSafe";
import { TRIAL_DAYS, trialDaysLeft } from "../lib/access";

const INCLUDED = [
  "All 18 team games — every Idiom Arena, Book Club and Classic Vault set",
  "Workbook at every level: Medium, Hard and All levels",
  "“Practice these” drills from your training notes",
];

const NOTICES = {
  restored: "Welcome back — Full Club is unlocked.",
  "nothing-to-restore": "No Full Club purchase found for this account.",
  pending: "Your purchase is waiting for approval. It unlocks as soon as it clears.",
  error: "The store didn’t answer. Check your connection and try again.",
  "redeem-error": "The code sheet didn’t open. You can also redeem in the App Store app: tap your photo, then “Redeem Gift Card or Code”.",
  "trial-ending": "Your free week ends tomorrow. Unlock Full Club to keep every board.",
  "trial-ended": "Your free week is over. Thanks for playing! Unlock Full Club to keep every board.",
} as const;

/** Full Club offer: buy or restore in the apps, a pointer to the apps on the web. */
export default function UnlockSheet() {
  const open = useEntitlement((s) => s.sheetOpen);
  const close = useEntitlement((s) => s.closeSheet);
  const platform = useEntitlement((s) => s.platform);
  const price = useEntitlement((s) => s.price);
  const busy = useEntitlement((s) => s.busy);
  const notice = useEntitlement((s) => s.notice);
  const buy = useEntitlement((s) => s.buy);
  const restore = useEntitlement((s) => s.restore);
  const canRedeem = useEntitlement((s) => s.canRedeem);
  const redeem = useEntitlement((s) => s.redeem);
  const native = platform === "native";
  const android = native && Capacitor.getPlatform() === "android";
  const trialAvailable = useEntitlement((s) => s.trialAvailable);
  const trialActive = useEntitlement((s) => s.trialActive);
  const trialEndsAt = useEntitlement((s) => s.trialEndsAt);
  const startTrial = useEntitlement((s) => s.startTrial);
  const offerTrial = native && trialAvailable;
  const daysLeft = trialActive && trialEndsAt !== null ? trialDaysLeft(trialEndsAt, Date.now()) : null;
  const unlockLabel = price ? `Unlock for ${price}` : "Unlock Full Club";
  const reduce = useMotionSafe();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="unlock-sheet"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Full Club"
          onClick={(e) => e.target === e.currentTarget && busy === "idle" && close()}
        >
          <motion.div
            initial={reduce ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
            className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-pop"
          >
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sage">🏆 Full Club</p>
            <h2 className="font-display mb-3 mt-1 text-2xl text-ink">Unlock every board</h2>
            <ul className="mb-4 space-y-2 text-sm leading-relaxed text-ink">
              {INCLUDED.map((line) => (
                <li key={line} className="flex gap-2">
                  <span aria-hidden className="text-sage">✓</span>
                  {line}
                </li>
              ))}
            </ul>
            <p className="mb-6 text-sm text-mute">
              One-time purchase. No subscription, no ads. The Daily Board, the guides and three
              games stay free forever.
            </p>

            {daysLeft !== null && (
              <p className="mb-4 rounded-xl bg-sage-soft px-4 py-3 text-sm font-semibold text-ink">
                ⏳ Free trial: {daysLeft} day{daysLeft === 1 ? "" : "s"} left. Everything above is open until then.
              </p>
            )}

            {notice && (
              <p role="status" className="mb-4 rounded-xl bg-butter-soft px-4 py-3 text-sm font-semibold text-ink">
                {NOTICES[notice]}
              </p>
            )}

            {native ? (
              <div className="flex flex-col gap-3">
                {offerTrial && (
                  <>
                    <button
                      onClick={startTrial}
                      disabled={busy !== "idle"}
                      className="font-display rounded-xl bg-sage px-6 py-3.5 text-lg text-white transition enabled:hover:bg-sage-deep enabled:active:scale-[0.98] disabled:opacity-60"
                    >
                      {busy === "buying" ? "Opening the store…" : `Try everything free for ${TRIAL_DAYS} days`}
                    </button>
                    <p className="-mt-1 text-center text-xs leading-relaxed text-mute">
                      Free for {TRIAL_DAYS} days, then the games and levels above lock again. Nothing is
                      charged automatically: to keep them, unlock Full Club{price ? ` for ${price}` : ""} once.
                    </p>
                  </>
                )}
                <button
                  onClick={buy}
                  disabled={busy !== "idle"}
                  className={
                    offerTrial
                      ? "rounded-xl border-2 border-sage px-6 py-3 font-semibold text-sage-deep transition enabled:hover:bg-cream disabled:opacity-60"
                      : "font-display rounded-xl bg-sage px-6 py-3.5 text-lg text-white transition enabled:hover:bg-sage-deep enabled:active:scale-[0.98] disabled:opacity-60"
                  }
                >
                  {busy === "buying" && !offerTrial ? "Opening the store…" : unlockLabel}
                </button>
                <button
                  onClick={restore}
                  disabled={busy !== "idle"}
                  className="rounded-xl border border-line px-6 py-3 font-semibold text-ink transition enabled:hover:bg-cream disabled:opacity-60"
                >
                  {busy === "restoring" ? "Restoring…" : "Restore purchase"}
                </button>
                {canRedeem && (
                  <button
                    onClick={redeem}
                    disabled={busy !== "idle"}
                    className="rounded-xl px-6 py-2 text-sm font-semibold text-sage transition enabled:hover:text-sage-deep disabled:opacity-60"
                  >
                    Redeem a code
                  </button>
                )}
                {android && (
                  <p className="text-center text-xs text-mute">
                    Have a promo code? Tap Unlock and choose “Redeem code” as the payment method.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold text-ink">Full Club is part of the Quizzical Club app:</p>
                <a
                  href={STORE_LINKS.appStore}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-sage px-6 py-3 text-center font-semibold text-white transition hover:bg-sage-deep"
                >
                  Get it on the App Store
                </a>
                <a
                  href={STORE_LINKS.googlePlay}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-line px-6 py-3 text-center font-semibold text-ink transition hover:bg-cream"
                >
                  Get it on Google Play
                </a>
              </div>
            )}

            <button
              onClick={close}
              disabled={busy !== "idle"}
              className="mt-3 w-full rounded-xl px-6 py-2 text-sm font-semibold text-mute transition hover:text-ink disabled:opacity-40"
            >
              Not now
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
