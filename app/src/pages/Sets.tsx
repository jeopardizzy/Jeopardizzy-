import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import { GAMES } from "../data/games";
import { gameRoundCount } from "../lib/board";
import { useMotionSafe } from "../lib/useMotionSafe";

const LEVEL_STYLES: Record<string, string> = {
  "Warm-up": "bg-sage-soft text-sage-deep",
  Easy: "bg-butter-soft text-butter-deep",
  Medium: "bg-butter text-ink",
  Hard: "bg-coral/15 text-coral",
  Expert: "bg-skyblue/15 text-skyblue",
};

/** Jeopardy selection — the heart of the site: you choose what to play. */
export default function Sets() {
  const navigate = useNavigate();
  const selectSet = useTeamStore((s) => s.selectSet);
  const reduce = useMotionSafe();

  return (
    <main className="stage-bg min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <button
          onClick={() => navigate("/")}
          className="mb-6 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-mute shadow-card transition hover:text-ink"
        >
          ← Home
        </button>

        <h1 className="font-display mb-1 text-3xl text-ink sm:text-4xl">Choose your jeopardy</h1>
        <p className="mb-8 text-mute">
          Every game is a list of boards — five categories, five clues each, values climbing with
          every round. Pick the flavor that fits the table.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {GAMES.map((g, i) => {
            const rounds = gameRoundCount(g);
            return (
              <motion.button
                key={g.id}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.06 * i }}
                onClick={() => {
                  selectSet(g.id);
                  navigate("/setup");
                }}
                className="group rounded-3xl border border-line bg-surface p-6 text-left shadow-card transition hover:-translate-y-1 hover:border-sage hover:shadow-pop"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-3xl">{g.emoji}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${LEVEL_STYLES[g.level]}`}
                  >
                    {g.level}
                  </span>
                </div>
                <h2 className="font-display mb-1 text-xl text-ink group-hover:text-sage-deep">
                  {g.name}
                </h2>
                <p className="mb-3 text-sm text-mute">{g.blurb}</p>
                <p className="text-xs font-semibold text-sage">
                  {rounds} board{rounds === 1 ? "" : "s"}
                  {g.final ? " + final wager" : ""} · {rounds * 25} clues
                </p>
                {g.bookRounds.length > 0 && (
                  <p className="mt-1 text-xs text-mute/80">
                    Round 1: {g.bookRounds[0].join(" · ")}
                  </p>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </main>
  );
}

