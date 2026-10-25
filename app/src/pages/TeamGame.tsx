import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import BoardGrid from "../components/BoardGrid";
import HostClueModal from "../components/HostClueModal";
import FinalWager from "../components/FinalWager";
import WinnerScreen from "../components/WinnerScreen";
import LightningRound from "../components/LightningRound";
import PartyBar from "../components/PartyBar";
import Scoreboard from "../components/Scoreboard";
import Toggles from "../components/Toggles";
import { useMotionSafe } from "../lib/useMotionSafe";

export default function TeamGame() {
  const phase = useTeamStore((s) => s.phase);
  const roundIndex = useTeamStore((s) => s.roundIndex);
  const teams = useTeamStore((s) => s.teams);
  const navigate = useNavigate();
  const reduce = useMotionSafe();
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Landing on /game without a running game (e.g. refresh) → back to sets.
  useEffect(() => {
    if (phase === "sets" || phase === "setup" || teams.length === 0) {
      navigate("/sets", { replace: true });
    }
  }, [phase, teams.length, navigate]);

  if (teams.length === 0) return null;

  return (
    <main className="stage-bg min-h-dvh px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => {
                useTeamStore.getState().playAgain();
                navigate("/sets");
              }}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-mute shadow-card transition hover:text-ink"
            >
              ← End game
            </button>
            {(phase === "board" || phase === "clue") && (
              <button
                onClick={() => setConfirmOpen(true)}
                disabled={phase !== "board"}
                className="rounded-lg border border-butter-deep bg-butter px-3 py-1.5 text-sm font-bold text-ink shadow-card transition enabled:hover:brightness-105 disabled:opacity-40"
              >
                Finish game
              </button>
            )}
          </div>
          <Toggles />
        </div>

        <PartyBar />
        <Scoreboard />

        <AnimatePresence mode="wait">
          {(phase === "board" || phase === "clue") && (
            <motion.div
              key={`board-${roundIndex}`}
              initial={reduce ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
            >
              <BoardGrid />
              <p className="mt-4 text-center text-sm text-mute">
                The highlighted team picks a tile. Read the clue aloud, reveal, award the points.
              </p>
            </motion.div>
          )}

          {phase === "lightning" && (
            <motion.div
              key="lightning"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0 }}
              className="pt-6"
            >
              <LightningRound />
            </motion.div>
          )}

          {(phase === "final-wager" || phase === "final-clue") && (
            <motion.div
              key="final"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0 }}
              className="pt-6"
            >
              <FinalWager />
            </motion.div>
          )}

          {phase === "winner" && (
            <motion.div key="winner" className="pt-6">
              <WinnerScreen />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <HostClueModal />
      <EarlyFinishDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} />
    </main>
  );
}

/** Confirmation for leaving the game before the last board. */
function EarlyFinishDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const finalEnabled = useTeamStore((s) => s.finalEnabled);
  const endGameEarly = useTeamStore((s) => s.endGameEarly);
  const reduce = useMotionSafe();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Finish the game early"
        >
          <motion.div
            initial={reduce ? false : { scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
            className="w-full max-w-md rounded-3xl border border-line bg-surface p-8 shadow-pop"
          >
            <h2 className="font-display mb-2 text-xl text-ink">Finish the game early?</h2>
            <p className="mb-6 text-sm leading-relaxed text-mute">
              Team scores are kept. Unplayed tiles won’t count as misses in the training notes.
            </p>
            <div className="flex flex-col gap-3">
              {finalEnabled && (
                <button
                  onClick={() => {
                    onClose();
                    endGameEarly("final");
                  }}
                  className="rounded-xl bg-butter px-6 py-3 font-display text-lg text-ink transition hover:brightness-105 active:scale-[0.98]"
                >
                  To the final
                </button>
              )}
              <button
                onClick={() => {
                  onClose();
                  endGameEarly("results");
                }}
                className="rounded-xl bg-sage px-6 py-3 font-display text-lg text-white transition hover:bg-sage-deep active:scale-[0.98]"
              >
                Straight to results
              </button>
              <button
                onClick={onClose}
                autoFocus
                className="rounded-xl border border-line px-6 py-3 font-semibold text-mute transition hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
