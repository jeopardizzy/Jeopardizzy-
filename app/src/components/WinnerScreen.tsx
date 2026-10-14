import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import { useWorkbookStore } from "../store/workbookStore";
import { aggregateCategoryStats, weakestCategories } from "../lib/stats";
import { useMotionSafe } from "../lib/useMotionSafe";

/** Winner celebration with final standings. */
export default function WinnerScreen() {
  const teams = useTeamStore((s) => s.teams);
  const earlyFinished = useTeamStore((s) => s.earlyFinished);
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
      <p className={`text-mute ${earlyFinished ? "mb-2" : "mb-8"}`}>
        {set_?.name} · Final score {top.score}
      </p>
      {earlyFinished && (
        <p className="mb-6 -mt-1 inline-block rounded-full bg-coral/15 px-4 py-1 text-xs font-bold uppercase tracking-wider text-coral">
          Finished early
        </p>
      )}

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

      <TrainingNotes />

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

/** Training notes: which categories nobody cracked — this game and all time. */
function TrainingNotes() {
  const outcomes = useTeamStore((s) => s.outcomes);
  const categoryStats = useTeamStore((s) => s.records.categoryStats);
  const reduce = useMotionSafe();
  const navigate = useNavigate();

  const gameWeak = weakestCategories(aggregateCategoryStats(outcomes), 5);
  const allTimeWeak = weakestCategories(categoryStats ?? {}, 3);

  if (outcomes.length === 0) return null;

  const practiceThese = () => {
    useWorkbookStore.getState().startDrill(gameWeak.map((w) => w.name));
    navigate("/workbook");
  };

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : 0.5 }}
      className="mb-8 rounded-2xl border border-line bg-cream px-5 py-4 text-left"
    >
      <h3 className="font-display mb-1 text-sm uppercase tracking-wider text-sage-deep">
        📉 Training notes
      </h3>
      {gameWeak.length === 0 ? (
        <p className="text-sm text-mute">
          Flawless boards — every clue found a team. Nothing to drill this time!
        </p>
      ) : (
        <>
          <p className="mb-2 text-xs text-mute">
            Toughest this game (nobody answered):
          </p>
          <ul className="mb-3 space-y-1.5">
            {gameWeak.map((w) => (
              <li key={w.name} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate font-semibold text-ink">{w.name}</span>
                <span className="rounded-full bg-coral/15 px-2 py-0.5 text-xs font-bold text-coral">
                  {w.missed}/{w.played} missed
                </span>
              </li>
            ))}
          </ul>
          <button
            onClick={practiceThese}
            className="mb-3 w-full rounded-xl bg-sage px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-sage-deep active:scale-[0.98]"
          >
            Practice these →
          </button>
        </>
      )}
      {allTimeWeak.length > 0 && (
        <p className="border-t border-line pt-2 text-xs leading-relaxed text-mute">
          <span className="font-bold text-ink">All-time drill list:</span>{" "}
          {allTimeWeak.map((w) => `${w.name} (${w.missed}/${w.played})`).join(" · ")}
        </p>
      )}
    </motion.div>
  );
}
