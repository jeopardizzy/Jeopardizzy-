import { AnimatePresence, motion } from "motion/react";
import { useTeamStore } from "../store/teamStore";
import { useMotionSafe } from "../lib/useMotionSafe";

/**
 * Host-mode clue overlay: read the clue aloud, reveal the answer,
 * then award the points to a team (or nobody).
 */
export default function HostClueModal() {
  const phase = useTeamStore((s) => s.phase);
  const board = useTeamStore((s) => s.board);
  const currentTileId = useTeamStore((s) => s.currentTileId);
  const revealed = useTeamStore((s) => s.revealed);
  const teams = useTeamStore((s) => s.teams);
  const activeTeam = useTeamStore((s) => s.activeTeam);
  const revealClue = useTeamStore((s) => s.revealClue);
  const awardTo = useTeamStore((s) => s.awardTo);
  const noAward = useTeamStore((s) => s.noAward);
  const reduce = useMotionSafe();

  const tile = board?.tiles.find((t) => t.id === currentTileId) ?? null;
  const open = phase === "clue" && tile !== null;

  return (
    <AnimatePresence>
      {open && tile && (
        <motion.div
          key="clue-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${tile.categoryName} for ${tile.value} points`}
        >
          <motion.div
            initial={reduce ? false : { scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full max-w-2xl rounded-3xl border border-line bg-surface p-6 shadow-pop sm:p-10"
          >
            <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.25em]">
              <span className="text-sage">{tile.categoryName}</span>
              <span className="text-butter-deep">{tile.value} pts</span>
            </div>

            <p className="mb-8 text-xl font-semibold leading-relaxed text-ink sm:text-2xl">
              {tile.clue}
            </p>

            {!revealed ? (
              <div className="text-center">
                <p className="mb-4 text-sm text-mute">
                  Read it aloud.{" "}
                  <span className="font-semibold text-ink">{teams[activeTeam]?.name}</span> picked
                  this tile.
                </p>
                <button
                  onClick={revealClue}
                  autoFocus
                  className="font-display rounded-xl bg-sage px-10 py-3 text-lg text-white transition hover:bg-sage-deep active:scale-[0.98]"
                >
                  Reveal answer
                </button>
              </div>
            ) : (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
              >
                <p className="mb-6 rounded-2xl bg-butter-soft px-4 py-3 text-center text-lg text-ink">
                  The answer is <strong className="text-butter-deep">{tile.answer}</strong>
                </p>
                <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-mute">
                  Award {tile.value} points to
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => awardTo(t.id)}
                      className="flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-white shadow-card transition hover:brightness-105 active:scale-[0.97]"
                      style={{ background: t.color }}
                    >
                      {t.name}
                    </button>
                  ))}
                  <button
                    onClick={noAward}
                    className="rounded-full border border-line px-5 py-2.5 font-semibold text-mute transition hover:bg-cream hover:text-ink"
                  >
                    Nobody
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
