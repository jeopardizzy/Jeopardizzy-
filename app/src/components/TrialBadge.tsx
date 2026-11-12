import { useEntitlement } from "../store/entitlementStore";
import { trialDaysLeft } from "../lib/access";

/** "⏳ Free trial · 5 days left" while the free week runs; opens the Full Club sheet. */
export default function TrialBadge({ className = "" }: { className?: string }) {
  const active = useEntitlement((s) => s.trialActive && !s.fullClub);
  const endsAt = useEntitlement((s) => s.trialEndsAt);
  const openSheet = useEntitlement((s) => s.openSheet);
  if (!active || endsAt === null) return null;
  const days = trialDaysLeft(endsAt, Date.now());
  return (
    <button
      onClick={openSheet}
      className={`rounded-full bg-butter-soft px-3 py-1 text-xs font-bold text-ink transition hover:bg-butter ${className}`}
    >
      ⏳ Free trial · {days} day{days === 1 ? "" : "s"} left
    </button>
  );
}
