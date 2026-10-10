import { motion } from "motion/react";
import { useTeamStore } from "../store/teamStore";
import { useMotionSafe } from "../lib/useMotionSafe";

/** Team scoreboard with the active picker highlighted. */
export default function Scoreboard() {
  const teams = useTeamStore((s) => s.teams);
  const activeTeam = useTeamStore((s) => s.activeTeam);
  const round = useTeamStore((s) => s.round);
  const phase = useTeamStore((s) => s.phase);
  const reduce = useMotionSafe();

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2" role="list" aria-label="Team scores">
        {teams.map((t) => (
          <motion.div
            key={t.id}
            role="listitem"
            animate={
              phase === "board" && t.id === activeTeam && !reduce
                ? { scale: [1, 1.04, 1] }
                : { scale: 1 }
            }
            transition={{ repeat: phase === "board" && t.id === activeTeam ? Infinity : 0, duration: 1.6 }}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 shadow-card transition ${
              phase === "board" && t.id === activeTeam
                ? "border-sage bg-sage-soft"
                : "border-line bg-surface"
            }`}
          >
            <span
              className="h-3 w-3 rounded-full"
              style={{ background: t.color }}
              aria-hidden
            />
            <span className="text-sm font-semibold text-ink">{t.name}</span>
            <motion.span
              key={t.score}
              initial={reduce ? false : { scale: 1.3 }}
              animate={{ scale: 1 }}
              className={`font-display text-lg ${t.score < 0 ? "text-coral" : "text-sage-deep"}`}
            >
              {t.score}
            </motion.span>
          </motion.div>
        ))}
      </div>
      <span className="rounded-full bg-butter-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-butter-deep">
        {round === 1 ? "Round 1" : "Double Quizzical"}
      </span>
    </div>
  );
}
