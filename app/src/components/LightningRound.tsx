import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useTeamStore } from "../store/teamStore";
import { useMotionSafe } from "../lib/useMotionSafe";
import { LIGHTNING_SECONDS } from "../lib/board";
import { displayClue } from "../lib/displayClue";

/**
 * Lightning round: quick clues against the clock. Teams shout the answer;
 * the host taps whoever got it first. Time's up shows the answer.
 */
export default function LightningRound() {
  const lightning = useTeamStore((s) => s.lightning);
  if (!lightning) return null;
  // a fresh card (and clock) per clue
  return <LightningClueCard key={lightning.index} />;
}

function LightningClueCard() {
  const lightning = useTeamStore((s) => s.lightning)!;
  const teams = useTeamStore((s) => s.teams);
  const award = useTeamStore((s) => s.lightningAward);
  const reveal = useTeamStore((s) => s.lightningReveal);
  const next = useTeamStore((s) => s.lightningNext);
  const reduce = useMotionSafe();
  const [left, setLeft] = useState(LIGHTNING_SECONDS);

  const { clues, index, value, revealed, winnerId } = lightning;
  const clue = clues[index];
  const winner = teams.find((t) => t.id === winnerId) ?? null;

  useEffect(() => {
    if (revealed) return;
    if (left <= 0) {
      reveal(true);
      return;
    }
    const t = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(t);
  }, [left, revealed, reveal]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8 shadow-pop lg:max-w-[46vw]"
    >
      <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.25em]">
        <span className="text-coral">
          ⚡ Lightning · {index + 1} of {clues.length}
        </span>
        <span className="text-butter-deep">{value} pts</span>
      </div>
      <p className="mb-1 text-center text-xs font-bold uppercase tracking-[0.2em] text-sage">{clue.categoryName}</p>
      <p className="mb-6 text-center text-xl font-semibold leading-relaxed text-ink sm:text-2xl">{displayClue(clue.clue)}</p>

      {!revealed ? (
        <>
          <div className="mb-5 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" aria-hidden>
              <div
                className={`h-full rounded-full ${left <= 5 ? "bg-coral" : "bg-sage"} ${reduce ? "" : "transition-all duration-1000 ease-linear"}`}
                style={{ width: `${(left / LIGHTNING_SECONDS) * 100}%` }}
              />
            </div>
            <span role="timer" aria-label={`${left} seconds left`} className="font-display w-8 text-right text-lg text-ink">
              {left}
            </span>
          </div>
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-mute">Who got it?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {teams.map((t) => (
              <button
                key={t.id}
                onClick={() => award(t.id)}
                className="rounded-full px-5 py-2.5 font-bold text-white shadow-card transition hover:brightness-105 active:scale-[0.97]"
                style={{ background: t.color }}
              >
                {t.name}
              </button>
            ))}
            <button
              onClick={() => reveal()}
              className="rounded-full border border-line px-5 py-2.5 font-semibold text-mute transition hover:bg-cream hover:text-ink"
            >
              Reveal answer
            </button>
          </div>
        </>
      ) : (
        <div role="status" className="text-center">
          {winner ? (
            <p className="font-display mb-2 text-2xl text-sage">
              +{value} for {winner.name}!
            </p>
          ) : (
            left <= 0 && <p className="font-display mb-2 text-2xl text-coral">Time's up!</p>
          )}
          <p className="mb-5 rounded-2xl bg-butter-soft px-4 py-3 text-lg text-ink">
            The answer is <strong className="text-butter-deep">{clue.answer}</strong>
          </p>
          <button
            onClick={next}
            autoFocus
            className="font-display rounded-xl bg-sage px-10 py-3 text-lg text-white transition hover:bg-sage-deep active:scale-[0.98]"
          >
            {index + 1 < clues.length ? "Next clue" : "Finish the round"}
          </button>
        </div>
      )}
    </motion.div>
  );
}
