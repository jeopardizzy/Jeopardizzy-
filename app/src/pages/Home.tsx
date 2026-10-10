import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import { categoryCount, clueCount } from "../data/quizData";
import { useMotionSafe } from "../lib/useMotionSafe";
import Toggles from "../components/Toggles";

const LETTERS = "QUIZZICAL".split("");
const TILE_COLORS = [
  "bg-sage-soft", "bg-butter", "bg-sage", "bg-butter-soft", "bg-sage-soft",
  "bg-butter", "bg-sage", "bg-butter-soft", "bg-sage-soft",
];

const MODES = [
  {
    to: "/sets",
    emoji: "🎯",
    title: "Team Jeopardy",
    text: "Pick a set, split into teams, and battle through two boards and a final wager. The host reads; teams score.",
    cta: "Choose a set",
    accent: "bg-sage text-white",
  },
  {
    to: "/workbook",
    emoji: "✏️",
    title: "Workbook",
    text: "Practice every puzzle type solo, at the difficulty you choose — a quick 10-question test with instant feedback.",
    cta: "Start practising",
    accent: "bg-butter text-ink",
  },
  {
    to: "/guides",
    emoji: "📖",
    title: "Guides",
    text: "How each puzzle type works: the rules, a worked example, and strategy tips that actually help.",
    cta: "Read the guides",
    accent: "bg-sage-soft text-sage-deep",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const gamesPlayed = useTeamStore((s) => s.records.gamesPlayed);
  const reduce = useMotionSafe();

  return (
    <main className="stage-bg flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <Toggles />
      </div>

      <h1 className="sr-only">Quizzical Club</h1>
      <div aria-hidden className="mb-2 flex flex-wrap justify-center gap-1.5 sm:gap-2.5">
        {LETTERS.map((ch, i) => (
          <motion.span
            key={i}
            initial={reduce ? false : { y: -70, rotate: -10 + i * 3, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 260, damping: 17, delay: 0.05 * i }
            }
            className={`font-display flex h-12 w-10 items-center justify-center rounded-xl border border-line text-xl shadow-card sm:h-18 sm:w-14 sm:text-3xl ${TILE_COLORS[i]} ${
              TILE_COLORS[i] === "bg-sage" ? "text-white" : "text-ink"
            }`}
          >
            {ch}
          </motion.span>
        ))}
      </div>
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.5 }}
        className="font-display mb-1 text-lg uppercase tracking-[0.35em] text-sage"
      >
        Club
      </motion.p>
      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.6 }}
        className="mb-10 max-w-md text-center text-mute"
      >
        Team trivia boards, a practice workbook and guides — gentle colours, no hurry.
        <br />
        <span className="text-ink/70">
          {categoryCount} categories · {clueCount} clues in the vault
        </span>
      </motion.p>

      <div className="grid w-full max-w-4xl gap-4 sm:grid-cols-3">
        {MODES.map((m, i) => (
          <motion.button
            key={m.to}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.75 + i * 0.12 }}
            onClick={() => navigate(m.to)}
            className="group flex flex-col rounded-3xl border border-line bg-surface p-6 text-left shadow-card transition hover:-translate-y-1 hover:shadow-pop"
          >
            <span className="mb-3 text-4xl">{m.emoji}</span>
            <span className="font-display mb-2 text-xl text-ink">{m.title}</span>
            <span className="mb-5 flex-1 text-sm leading-relaxed text-mute">{m.text}</span>
            <span
              className={`self-start rounded-full px-4 py-2 text-sm font-bold transition group-hover:brightness-105 ${m.accent}`}
            >
              {m.cta} →
            </span>
          </motion.button>
        ))}
      </div>

      {gamesPlayed > 0 && (
        <p className="mt-10 text-sm text-mute">
          {gamesPlayed} team game{gamesPlayed === 1 ? "" : "s"} played on this device
        </p>
      )}
    </main>
  );
}
