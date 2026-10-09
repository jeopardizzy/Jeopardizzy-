import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useGameStore } from "../store/gameStore";
import { useMotionSafe } from "../lib/useMotionSafe";

/**
 * Full-screen clue overlay: read the clue, type an answer (fuzzy-checked)
 * or reveal it and grade yourself — party-play friendly.
 */
export default function ClueModal() {
  const phase = useGameStore((s) => s.phase);
  const board = useGameStore((s) => s.board);
  const currentTileId = useGameStore((s) => s.currentTileId);
  const feedback = useGameStore((s) => s.feedback);
  const submitAnswer = useGameStore((s) => s.submitAnswer);
  const revealAnswer = useGameStore((s) => s.revealAnswer);
  const selfGrade = useGameStore((s) => s.selfGrade);
  const closeClue = useGameStore((s) => s.closeClue);
  const reduce = useMotionSafe();

  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const tile = board?.tiles.find((t) => t.id === currentTileId) ?? null;
  const open = phase === "clue" && tile !== null;

  useEffect(() => {
    if (open) {
      setText("");
      // autofocus the answer field when the modal opens
      const id = window.setTimeout(() => inputRef.current?.focus(), 60);
      return () => window.clearTimeout(id);
    }
  }, [open, currentTileId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && feedback) closeClue();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, feedback, closeClue]);

  return (
    <AnimatePresence>
      {open && tile && (
        <motion.div
          key="clue-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${tile.categoryName} for ${tile.value} points`}
        >
          <motion.div
            initial={reduce ? false : { scale: 0.86, rotateX: 18, opacity: 0 }}
            animate={{ scale: 1, rotateX: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className={`w-full max-w-2xl rounded-3xl border border-edge bg-board p-6 shadow-pop sm:p-10 ${
              feedback?.kind === "correct"
                ? "ring-4 ring-mint/60"
                : feedback?.kind === "wrong"
                  ? "ring-4 ring-coral/60"
                  : ""
            }`}
          >
            <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.25em]">
              <span className="text-sky">{tile.categoryName}</span>
              <span className="text-gold">{tile.value} pts</span>
            </div>

            <p className="mb-8 text-xl font-semibold leading-relaxed text-cream sm:text-2xl">
              {tile.clue}
            </p>

            {!feedback && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (text.trim()) submitAnswer(text);
                }}
                className="flex flex-col gap-3"
              >
                <label htmlFor="answer-input" className="sr-only">
                  Your answer
                </label>
                <input
                  id="answer-input"
                  ref={inputRef}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your answer…"
                  autoComplete="off"
                  className="w-full rounded-xl border border-edge bg-ink px-4 py-3 text-lg text-cream placeholder:text-muted/60"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={!text.trim()}
                    className="flex-1 rounded-xl bg-gold px-6 py-3 font-display text-lg text-ink transition enabled:hover:bg-gold-2 enabled:active:scale-[0.98] disabled:opacity-40"
                  >
                    Answer
                  </button>
                  <button
                    type="button"
                    onClick={revealAnswer}
                    className="rounded-xl border border-edge px-6 py-3 font-semibold text-muted transition hover:text-cream"
                  >
                    Reveal
                  </button>
                </div>
              </form>
            )}

            {feedback && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
                role="status"
              >
                {feedback.kind === "correct" && (
                  <p className="mb-2 font-display text-3xl text-mint">Correct! +{tile.value}</p>
                )}
                {feedback.kind === "wrong" && (
                  <p className="mb-2 font-display text-3xl text-coral">Not quite −{tile.value}</p>
                )}
                <p className="mb-6 text-lg text-cream">
                  The answer is <strong className="text-gold">{feedback.answer}</strong>
                </p>

                {feedback.kind === "revealed" ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-muted">Playing with friends? Grade it yourself:</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => selfGrade(true)}
                        className="flex-1 rounded-xl bg-mint px-6 py-3 font-display text-lg text-ink transition hover:brightness-110 active:scale-[0.98]"
                      >
                        Got it ✓
                      </button>
                      <button
                        onClick={() => selfGrade(false)}
                        className="flex-1 rounded-xl bg-coral px-6 py-3 font-display text-lg text-ink transition hover:brightness-110 active:scale-[0.98]"
                      >
                        Missed it ✗
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={closeClue}
                    autoFocus
                    className="rounded-xl bg-gold px-10 py-3 font-display text-lg text-ink transition hover:bg-gold-2 active:scale-[0.98]"
                  >
                    Continue
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
