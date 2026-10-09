import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useGameStore } from "../store/gameStore";
import BoardGrid from "../components/BoardGrid";
import ClueModal from "../components/ClueModal";
import FinalRound from "../components/FinalRound";
import Results from "../components/Results";
import ScoreBar from "../components/ScoreBar";
import Toggles from "../components/Toggles";
import { useMotionSafe } from "../lib/useMotionSafe";

export default function Game() {
  const phase = useGameStore((s) => s.phase);
  const round = useGameStore((s) => s.round);
  const navigate = useNavigate();
  const reduce = useMotionSafe();

  // Landing on /game without a running game (e.g. refresh) → back home.
  useEffect(() => {
    if (phase === "idle") navigate("/", { replace: true });
  }, [phase, navigate]);

  if (phase === "idle") return null;

  return (
    <main className="stage-bg min-h-dvh px-3 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2 flex justify-end">
          <Toggles />
        </div>
        <ScoreBar />

        <AnimatePresence mode="wait">
          {(phase === "board" || phase === "clue") && (
            <motion.div
              key={`board-${round}`}
              initial={reduce ? false : { opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
            >
              <BoardGrid />
              <p className="mt-4 text-center text-sm text-muted">
                {round === 1
                  ? "Pick a tile. Type your answer, or reveal and grade yourself."
                  : "Double Quizzical — every clue is worth double."}
              </p>
            </motion.div>
          )}

          {(phase === "final-wager" || phase === "final-clue") && (
            <motion.div
              key="final"
              initial={reduce ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0 }}
              className="pt-8"
            >
              <FinalRound />
            </motion.div>
          )}

          {phase === "results" && (
            <motion.div key="results" className="pt-8">
              <Results />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ClueModal />
    </main>
  );
}
