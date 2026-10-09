import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useMotionSafe } from "../lib/useMotionSafe";

/** Final Quizzical: wager everything (or nothing) on one last clue. */
export default function FinalRound() {
  const phase = useGameStore((s) => s.phase);
  const finalClue = useGameStore((s) => s.finalClue);
  const score = useGameStore((s) => s.score);
  const wager = useGameStore((s) => s.wager);
  const feedback = useGameStore((s) => s.feedback);
  const setWager = useGameStore((s) => s.setWager);
  const beginFinalClue = useGameStore((s) => s.beginFinalClue);
  const submitFinal = useGameStore((s) => s.submitFinal);
  const revealFinal = useGameStore((s) => s.revealFinal);
  const selfGradeFinal = useGameStore((s) => s.selfGradeFinal);
  const reduce = useMotionSafe();

  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (phase === "final-clue") {
      const id = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [phase]);

  if (!finalClue) return null;
  const maxWager = Math.max(0, score);

  if (phase === "final-wager") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl rounded-3xl border border-edge bg-board p-8 text-center shadow-pop"
      >
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.3em] text-coral">
          Final Quizzical
        </p>
        <h2 className="mb-2 font-display text-2xl text-cream sm:text-3xl">
          Category: <span className="text-gold">{finalClue.categoryName}</span>
        </h2>
        <p className="mb-6 text-muted">
          Your score: <strong className="text-cream">{score}</strong> — wager up to {maxWager}{" "}
          points on one last clue.
        </p>

        <label htmlFor="wager-input" className="sr-only">
          Wager
        </label>
        <input
          id="wager-input"
          type="number"
          min={0}
          max={maxWager}
          value={wager}
          onChange={(e) => setWager(Number(e.target.value))}
          className="mb-4 w-full rounded-xl border border-edge bg-ink px-4 py-3 text-center font-display text-2xl text-gold"
        />
        <input
          type="range"
          min={0}
          max={maxWager}
          value={wager}
          onChange={(e) => setWager(Number(e.target.value))}
          aria-label="Wager slider"
          className="mb-6 w-full accent-gold"
        />
        <button
          onClick={beginFinalClue}
          className="w-full rounded-xl bg-coral px-6 py-4 font-display text-xl text-ink transition hover:brightness-110 active:scale-[0.98]"
        >
          Lock it in
        </button>
      </motion.div>
    );
  }

  if (phase === "final-clue") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mx-auto max-w-2xl rounded-3xl border border-edge bg-board p-8 shadow-pop sm:p-10"
      >
        <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.25em]">
          <span className="text-sky">{finalClue.categoryName}</span>
          <span className="text-coral">wager: {wager} pts</span>
        </div>
        <p className="mb-8 text-xl font-semibold leading-relaxed text-cream sm:text-2xl">
          {finalClue.clue}
        </p>

        {!feedback && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) submitFinal(text);
            }}
            className="flex flex-col gap-3"
          >
            <label htmlFor="final-answer" className="sr-only">
              Your final answer
            </label>
            <input
              id="final-answer"
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your final answer…"
              autoComplete="off"
              className="w-full rounded-xl border border-edge bg-ink px-4 py-3 text-lg text-cream placeholder:text-muted/60"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!text.trim()}
                className="flex-1 rounded-xl bg-coral px-6 py-3 font-display text-lg text-ink transition enabled:hover:brightness-110 enabled:active:scale-[0.98] disabled:opacity-40"
              >
                Final Answer
              </button>
              <button
                type="button"
                onClick={revealFinal}
                className="rounded-xl border border-edge px-6 py-3 font-semibold text-muted transition hover:text-cream"
              >
                Reveal
              </button>
            </div>
          </form>
        )}

        {feedback && (
          <div className="text-center" role="status">
            {feedback.kind === "correct" && (
              <p className="mb-2 font-display text-3xl text-mint">Correct! +{wager}</p>
            )}
            {feedback.kind === "wrong" && (
              <p className="mb-2 font-display text-3xl text-coral">Missed −{wager}</p>
            )}
            <p className="mb-6 text-lg text-cream">
              The answer is <strong className="text-gold">{feedback.answer}</strong>
            </p>
            {feedback.kind === "revealed" && (
              <div className="flex gap-3">
                <button
                  onClick={() => selfGradeFinal(true)}
                  className="flex-1 rounded-xl bg-mint px-6 py-3 font-display text-lg text-ink transition hover:brightness-110 active:scale-[0.98]"
                >
                  Got it ✓
                </button>
                <button
                  onClick={() => selfGradeFinal(false)}
                  className="flex-1 rounded-xl bg-coral px-6 py-3 font-display text-lg text-ink transition hover:brightness-110 active:scale-[0.98]"
                >
                  Missed it ✗
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    );
  }

  return null;
}
