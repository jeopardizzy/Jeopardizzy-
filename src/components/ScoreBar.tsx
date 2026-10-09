import { motion } from "motion/react";
import { useGameStore } from "../store/gameStore";
import { useMotionSafe } from "../lib/useMotionSafe";

/** Score / streak / round header shown above the board. */
export default function ScoreBar() {
  const score = useGameStore((s) => s.score);
  const streak = useGameStore((s) => s.streak);
  const round = useGameStore((s) => s.round);
  const mode = useGameStore((s) => s.mode);
  const quitToMenu = useGameStore((s) => s.quitToMenu);
  const reduce = useMotionSafe();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <button
        onClick={quitToMenu}
        className="rounded-lg border border-edge bg-board px-3 py-1.5 text-sm font-semibold text-muted transition hover:text-cream"
      >
        ← Menu
      </button>

      <div className="flex items-center gap-3 sm:gap-5">
        {mode === "daily" && (
          <span className="rounded-full bg-sky/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-sky">
            Daily
          </span>
        )}
        <span className="rounded-full bg-board px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
          {round === 1 ? "Round 1" : "Double Quizzical"}
        </span>
        {streak >= 2 && (
          <motion.span
            key={streak}
            initial={reduce ? false : { scale: 1.4 }}
            animate={{ scale: 1 }}
            className="rounded-full bg-coral/15 px-3 py-1 text-xs font-bold text-coral"
            role="status"
          >
            🔥 ×{streak}
          </motion.span>
        )}
        <motion.div
          key={score}
          initial={reduce ? false : { scale: 1.25 }}
          animate={{ scale: 1 }}
          className={`font-display text-2xl sm:text-3xl ${score < 0 ? "text-coral" : "text-gold"}`}
          aria-live="polite"
          aria-label={`Score ${score}`}
        >
          {score}
        </motion.div>
      </div>
    </div>
  );
}
