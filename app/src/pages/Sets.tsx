import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import { SETS } from "../data/sets";
import { useMotionSafe } from "../lib/useMotionSafe";

const LEVEL_STYLES: Record<string, string> = {
  "Warm-up": "bg-sage-soft text-sage-deep",
  Easy: "bg-butter-soft text-butter-deep",
  Medium: "bg-butter text-ink",
  Hard: "bg-coral/15 text-coral",
  Expert: "bg-skyblue/15 text-skyblue",
};

/** Jeopardy set selection — the heart of the site: you choose what to play. */
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

        <h1 className="font-display mb-1 text-3xl text-ink sm:text-4xl">Choose your set</h1>
        <p className="mb-8 text-mute">
          Two boards per set — round one at standard values, then Double. Pick the flavor that fits
          the table.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {SETS.map((s, i) => (
            <motion.button
              key={s.id}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.06 * i }}
              onClick={() => {
                selectSet(s.id);
                navigate("/setup");
              }}
              className="group rounded-3xl border border-line bg-surface p-6 text-left shadow-card transition hover:-translate-y-1 hover:border-sage hover:shadow-pop"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-3xl">{s.emoji}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${LEVEL_STYLES[s.level]}`}
                >
                  {s.level}
                </span>
              </div>
              <h2 className="font-display mb-1 text-xl text-ink group-hover:text-sage-deep">
                {s.name}
              </h2>
              <p className="mb-3 text-sm text-mute">{s.blurb}</p>
              <p className="text-xs text-mute/80">
                Round 1: {s.round1.join(" · ")}
              </p>
            </motion.button>
          ))}
        </div>
      </div>
    </main>
  );
}
