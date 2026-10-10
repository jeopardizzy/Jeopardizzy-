import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import { useMotionSafe } from "../lib/useMotionSafe";

/** Winner celebration with final standings. */
export default function WinnerScreen() {
  const teams = useTeamStore((s) => s.teams);
  const playAgain = useTeamStore((s) => s.playAgain);
  const set_ = useTeamStore((s) => s.set);
  const navigate = useNavigate();
  const reduce = useMotionSafe();

  const standings = [...teams].sort((a, b) => b.score - a.score);
  const top = standings[0];
  const tied = standings.filter((t) => t.score === top.score);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="mx-auto w-full max-w-xl rounded-3xl border border-line bg-surface p-8 text-center shadow-pop sm:p-10"
    >
      <motion.div
        initial={reduce ? false : { scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: reduce ? 0 : 0.2, type: "spring", stiffness: 260, damping: 14 }}
        className="mb-3 text-6xl"
        aria-hidden
      >
        🏆
      </motion.div>

      <h2 className="font-display mb-1 text-3xl text-ink">
        {tied.length > 1 ? "It's a tie!" : `${top.name} wins!`}
      </h2>
      <p className="mb-8 text-mute">
        {set_?.name} · Final score {top.score}
      </p>

      <div className="mb-8 space-y-2">
        {standings.map((t, i) => (
          <motion.div
            key={t.id}
            initial={reduce ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduce ? 0 : 0.3 + i * 0.1 }}
            className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
              i === 0 ? "border-butter-deep bg-butter-soft" : "border-line bg-cream"
            }`}
          >
            <span className="font-display w-6 text-mute">{i + 1}</span>
            <span className="h-4 w-4 rounded-full" style={{ background: t.color }} aria-hidden />
            <span className="flex-1 text-left font-semibold text-ink">{t.name}</span>
            <span className={`font-display text-xl ${t.score < 0 ? "text-coral" : "text-sage-deep"}`}>
              {t.score}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => {
            playAgain();
            navigate("/sets");
          }}
          className="font-display flex-1 rounded-xl bg-sage px-6 py-4 text-lg text-white transition hover:bg-sage-deep active:scale-[0.98]"
        >
          Play another set
        </button>
        <button
          onClick={() => {
            playAgain();
            navigate("/");
          }}
          className="flex-1 rounded-xl border border-line px-6 py-4 font-semibold text-ink transition hover:bg-cream active:scale-[0.98]"
        >
          Main menu
        </button>
      </div>
    </motion.div>
  );
}
