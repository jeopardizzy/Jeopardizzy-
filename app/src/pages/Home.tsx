import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useGameStore } from "../store/gameStore";
import { dailyStamp } from "../lib/random";
import { categoryCount, clueCount } from "../data/quizData";
import { useMotionSafe } from "../lib/useMotionSafe";
import Toggles from "../components/Toggles";

const LETTERS = "QUIZZICAL".split("");
const TILE_COLORS = [
  "bg-tile-2", "bg-gold", "bg-coral", "bg-mint", "bg-sky",
  "bg-tile-2", "bg-coral", "bg-gold", "bg-mint",
];

export default function Home() {
  const navigate = useNavigate();
  const startGame = useGameStore((s) => s.startGame);
  const records = useGameStore((s) => s.records);
  const reduce = useMotionSafe();
  const todayDaily = records.dailyScores[new Date().toISOString().slice(0, 10)];

  const play = (mode: "classic" | "daily") => {
    startGame(mode);
    navigate("/game");
  };

  return (
    <main className="stage-bg flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <Toggles />
      </div>

      {/* Animated title tiles */}
      <h1 className="sr-only">Quizzical</h1>
      <div aria-hidden className="mb-6 flex flex-wrap justify-center gap-1.5 sm:gap-2.5">
        {LETTERS.map((ch, i) => (
          <motion.span
            key={i}
            initial={reduce ? false : { y: -90, rotate: -12 + i * 3, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 17, delay: 0.05 * i }
            }
            className={`font-display flex h-12 w-10 items-center justify-center rounded-lg text-xl text-ink shadow-tile sm:h-20 sm:w-16 sm:text-4xl ${TILE_COLORS[i]} ${
              TILE_COLORS[i] === "bg-tile-2" ? "text-cream" : "text-ink"
            }`}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      <motion.p
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.55 }}
        className="mb-1 text-center text-sm font-semibold uppercase tracking-[0.3em] text-gold"
      >
        The trivia board game
      </motion.p>
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.7 }}
        className="mb-10 max-w-md text-center text-muted"
      >
        Five categories. Twenty-five clues. One final wager.
        <br />
        <span className="text-cream/70">
          {categoryCount} categories · {clueCount} clues in the vault
        </span>
      </motion.p>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.85 }}
        className="flex w-full max-w-sm flex-col gap-4"
      >
        <button
          onClick={() => play("classic")}
          className="font-display rounded-2xl bg-gold px-8 py-5 text-2xl text-ink shadow-pop transition hover:bg-gold-2 active:scale-[0.98]"
        >
          PLAY
        </button>
        <button
          onClick={() => play("daily")}
          className="rounded-2xl border-2 border-edge bg-board px-8 py-4 font-semibold text-cream transition hover:bg-tile active:scale-[0.98]"
        >
          Daily Challenge{" "}
          <span className="ml-1 text-sm font-normal text-muted">{dailyStamp()}</span>
          {todayDaily !== undefined && (
            <span className="ml-2 rounded-full bg-mint/20 px-2 py-0.5 text-xs text-mint">
              done: {todayDaily}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate("/how")}
          className="rounded-2xl px-8 py-3 text-sm font-semibold text-muted underline-offset-4 transition hover:text-cream hover:underline"
        >
          How to play
        </button>
      </motion.div>

      {records.gamesPlayed > 0 && (
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 1 }}
          className="mt-10 flex gap-6 text-center text-sm text-muted"
        >
          <span>
            <strong className="block text-xl text-gold">{records.bestScore}</strong>
            best score <span className="text-xs">(this device)</span>
          </span>
          <span>
            <strong className="block text-xl text-mint">{records.bestStreak}</strong>
            best streak
          </span>
          <span>
            <strong className="block text-xl text-sky">{records.gamesPlayed}</strong>
            games played
          </span>
        </motion.div>
      )}
    </main>
  );
}
