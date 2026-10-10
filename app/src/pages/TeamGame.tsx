import { AnimatePresence, motion } from "motion/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import BoardGrid from "../components/BoardGrid";
import HostClueModal from "../components/HostClueModal";
import FinalWager from "../components/FinalWager";
import WinnerScreen from "../components/WinnerScreen";
import Scoreboard from "../components/Scoreboard";
import Toggles from "../components/Toggles";
import { useMotionSafe } from "../lib/useMotionSafe";

export default function TeamGame() {
  const phase = useTeamStore((s) => s.phase);
  const roundIndex = useTeamStore((s) => s.roundIndex);
  const teams = useTeamStore((s) => s.teams);
  const navigate = useNavigate();
  const reduce = useMotionSafe();

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
          <button
            onClick={() => {
              useTeamStore.getState().playAgain();
              navigate("/sets");
            }}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-mute shadow-card transition hover:text-ink"
          >
            ← End game
          </button>
          <Toggles />
        </div>

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
    </main>
  );
}
