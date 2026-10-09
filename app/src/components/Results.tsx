import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { useMotionSafe } from "../lib/useMotionSafe";

function verdict(score: number): string {
  if (score >= 12000) return "Legendary. The board bows to you.";
  if (score >= 8000) return "Champion material!";
  if (score >= 4000) return "Sharp mind, well played.";
  if (score >= 0) return "On the board — run it back!";
  return "Rough board. The rematch awaits.";
}

/** Completion sequence: results, records, instant replay. */
export default function Results() {
  const navigate = useNavigate();
  const score = useGameStore((s) => s.score);
  const correctCount = useGameStore((s) => s.correctCount);
  const answeredCount = useGameStore((s) => s.answeredCount);
  const bestStreakThisGame = useGameStore((s) => s.bestStreakThisGame);
  const records = useGameStore((s) => s.records);
  const mode = useGameStore((s) => s.mode);
  const startGame = useGameStore((s) => s.startGame);
  const quitToMenu = useGameStore((s) => s.quitToMenu);
  const reduce = useMotionSafe();

  const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
  const isNewBest = score > 0 && score >= records.bestScore;

  const stats = [
    { label: "Final score", value: String(score), color: "text-gold" },
    { label: "Accuracy", value: `${accuracy}%`, color: "text-mint" },
    { label: "Correct", value: `${correctCount}/${answeredCount}`, color: "text-sky" },
    { label: "Best streak", value: `×${bestStreakThisGame}`, color: "text-coral" },
  ];

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="mx-auto w-full max-w-xl rounded-3xl border border-edge bg-board p-8 text-center shadow-pop sm:p-10"
    >
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-gold">
        {mode === "daily" ? "Daily Challenge complete" : "Game complete"}
      </p>

      {isNewBest && (
        <motion.p
          initial={reduce ? false : { scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.3, type: "spring", stiffness: 300, damping: 12 }}
          className="mb-2 inline-block rounded-full bg-mint/15 px-4 py-1 text-sm font-bold text-mint"
          role="status"
        >
          ★ New personal best (this device)
        </motion.p>
      )}

      <motion.div
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.15, type: "spring", stiffness: 260, damping: 16 }}
        className={`font-display my-4 text-7xl sm:text-8xl ${score < 0 ? "text-coral" : "text-gold"}`}
      >
        {score}
      </motion.div>
      <p className="mb-8 text-lg text-muted">{verdict(score)}</p>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.3 + i * 0.08 }}
            className="rounded-xl bg-ink-2 px-2 py-3"
          >
            <div className={`font-display text-xl ${s.color}`}>{s.value}</div>
            <div className="text-xs uppercase tracking-wide text-muted">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => startGame(mode)}
          className="flex-1 rounded-xl bg-gold px-6 py-4 font-display text-xl text-ink transition hover:bg-gold-2 active:scale-[0.98]"
        >
          Play again
        </button>
        <button
          onClick={() => {
            quitToMenu();
            navigate("/");
          }}
          className="flex-1 rounded-xl border border-edge px-6 py-4 font-semibold text-cream transition hover:bg-tile active:scale-[0.98]"
        >
          Main menu
        </button>
      </div>
    </motion.div>
  );
}
