import { motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TEAM_COLORS, useTeamStore } from "../store/teamStore";
import { useMotionSafe } from "../lib/useMotionSafe";

const MAX_TEAMS = 4;

/** Team setup: how many teams, what are they called. */
export default function TeamSetup() {
  const navigate = useNavigate();
  const set_ = useTeamStore((s) => s.set);
  const savedNames = useTeamStore((s) => s.settings.teamNames);
  const startGame = useTeamStore((s) => s.startGame);
  const reduce = useMotionSafe();

  const [names, setNames] = useState<string[]>(() =>
    savedNames.length >= 2 ? savedNames.slice(0, MAX_TEAMS) : ["Team Sage", "Team Butter"],
  );

  if (!set_) {
    navigate("/sets", { replace: true });
    return null;
  }

  const update = (i: number, v: string) =>
    setNames((prev) => prev.map((n, j) => (j === i ? v : n)));

  return (
    <main className="stage-bg flex min-h-dvh items-center justify-center px-4 py-10">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-3xl border border-line bg-surface p-8 shadow-pop"
      >
        <button
          onClick={() => navigate("/sets")}
          className="mb-4 text-sm font-semibold text-mute transition hover:text-ink"
        >
          ← Back to sets
        </button>

        <p className="text-xs font-bold uppercase tracking-[0.25em] text-sage">{set_.name}</p>
        <h1 className="font-display mb-1 mt-1 text-2xl text-ink">Who's playing?</h1>
        <p className="mb-6 text-sm text-mute">
          One device, one host. Read clues aloud and award points as teams answer.
        </p>

        <div className="mb-6 space-y-3">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-3">
              <span
                className="h-8 w-8 shrink-0 rounded-full border border-line"
                style={{ background: TEAM_COLORS[i % TEAM_COLORS.length] }}
                aria-hidden
              />
              <label htmlFor={`team-${i}`} className="sr-only">
                Team {i + 1} name
              </label>
              <input
                id={`team-${i}`}
                value={name}
                onChange={(e) => update(i, e.target.value)}
                maxLength={24}
                className="flex-1 rounded-xl border border-line bg-cream px-4 py-2.5 font-semibold text-ink placeholder:text-mute/60"
                placeholder={`Team ${i + 1}`}
              />
              {names.length > 2 && (
                <button
                  onClick={() => setNames((prev) => prev.filter((_, j) => j !== i))}
                  aria-label={`Remove team ${i + 1}`}
                  className="rounded-lg px-2 py-1 text-mute transition hover:text-coral"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        {names.length < MAX_TEAMS && (
          <button
            onClick={() => setNames((prev) => [...prev, `Team ${prev.length + 1}`])}
            className="mb-6 w-full rounded-xl border-2 border-dashed border-line px-4 py-2.5 text-sm font-semibold text-mute transition hover:border-sage hover:text-sage-deep"
          >
            + Add a team
          </button>
        )}

        <button
          onClick={() => {
            startGame(names);
            navigate("/game");
          }}
          className="font-display w-full rounded-2xl bg-sage px-6 py-4 text-xl text-white transition hover:bg-sage-deep active:scale-[0.98]"
        >
          Start the game
        </button>
      </motion.div>
    </main>
  );
}
