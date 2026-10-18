import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useTeamStore } from "../store/teamStore";
import { useMotionSafe } from "../lib/useMotionSafe";
import { isVoiceAvailable } from "../audio/voice";
import { sfx } from "../audio/sound";
import { isCorrect } from "../lib/answerMatch";
import SpokenAnswer from "./SpokenAnswer";

type Verdict = "correct" | "wrong" | null;

/**
 * The picking team can answer on the card itself, typed or out loud; the
 * app checks it like a Workbook answer. Right: the answer is revealed with
 * their team highlighted. Wrong: nothing is revealed, so they (or another
 * team) can try again. The host's buttons still decide the points.
 */
function ClueAnswer({ answer, others, onVerdict }: { answer: string; others: string[]; onVerdict: (v: Verdict) => void }) {
  const [text, setText] = useState("");
  const [wrong, setWrong] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const check = (guess: string) => {
    if (!guess.trim()) return;
    if (isCorrect(guess, answer)) return onVerdict("correct");
    sfx.buzz();
    setWrong(true);
    onVerdict("wrong");
  };

  return (
    <div className="mx-auto mb-5 flex max-w-md flex-col gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          check(text);
        }}
        className="flex gap-2"
      >
        <label htmlFor="clue-answer" className="sr-only">
          Your answer
        </label>
        <input
          id="clue-answer"
          ref={inputRef}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setWrong(false);
          }}
          placeholder="Type the answer…"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-4 py-2.5 text-base text-ink placeholder:text-mute/60"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="rounded-xl bg-sage px-4 py-2.5 font-semibold text-white transition enabled:hover:bg-sage-deep disabled:opacity-40"
        >
          Check
        </button>
      </form>
      {wrong && (
        <p role="status" className="text-center text-sm font-semibold text-coral">
          Not quite. Try again, let another team answer, or reveal it.
        </p>
      )}
      <SpokenAnswer
        answer={answer}
        others={others}
        onHeard={(heard) => {
          setText(heard);
          check(heard);
        }}
        onType={() => inputRef.current?.focus()}
      />
    </div>
  );
}

/**
 * Host-mode clue overlay: read the clue aloud (or let the quizmaster),
 * let the team answer on the card, reveal the answer, then award the
 * points to a team (or nobody).
 */
export default function HostClueModal() {
  const phase = useTeamStore((s) => s.phase);
  const board = useTeamStore((s) => s.board);
  const currentTileId = useTeamStore((s) => s.currentTileId);
  const revealed = useTeamStore((s) => s.revealed);
  const teams = useTeamStore((s) => s.teams);
  const activeTeam = useTeamStore((s) => s.activeTeam);
  const revealClue = useTeamStore((s) => s.revealClue);
  const awardTo = useTeamStore((s) => s.awardTo);
  const noAward = useTeamStore((s) => s.noAward);
  const repeatClue = useTeamStore((s) => s.repeatClue);
  const voiceOn = useTeamStore((s) => s.settings.voice !== false) && isVoiceAvailable();
  const reduce = useMotionSafe();

  const tile = board?.tiles.find((t) => t.id === currentTileId) ?? null;
  const open = phase === "clue" && tile !== null;
  const [verdict, setVerdict] = useState<Verdict>(null);
  useEffect(() => setVerdict(null), [currentTileId]);
  const others = board?.tiles.filter((t) => t.id !== currentTileId).map((t) => t.answer) ?? [];
  const picker = teams[activeTeam];

  return (
    <AnimatePresence>
      {open && tile && (
        <motion.div
          key="clue-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm lg:justify-start lg:pl-10"
          role="dialog"
          aria-modal="true"
          aria-label={`${tile.categoryName} for ${tile.value} points`}
        >
          <motion.div
            initial={reduce ? false : { scale: 0.9, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { scale: 0.94, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className="w-full max-w-2xl rounded-3xl border border-line bg-surface p-6 shadow-pop sm:p-10 lg:max-w-[46vw]"
          >
            <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.25em]">
              <span className="text-sage">{tile.categoryName}</span>
              <span className="text-butter-deep">{tile.value} pts</span>
            </div>

            <p className="mb-8 text-xl font-semibold leading-relaxed text-ink sm:text-2xl">
              {tile.clue}
            </p>

            {!revealed ? (
              <div className="text-center">
                <p className="mb-4 text-sm text-mute">
                  {voiceOn ? "The quizmaster reads it." : "Read it aloud."}{" "}
                  <span className="font-semibold text-ink">{teams[activeTeam]?.name}</span> picked
                  this tile.
                  {voiceOn && (
                    <button
                      onClick={repeatClue}
                      className="ml-2 rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink transition hover:bg-cream"
                    >
                      🔁 Read again
                    </button>
                  )}
                </p>
                <ClueAnswer
                  key={tile.id}
                  answer={tile.answer}
                  others={others}
                  onVerdict={(v) => {
                    setVerdict(v);
                    if (v === "correct") revealClue();
                  }}
                />
                <button
                  onClick={revealClue}
                  autoFocus
                  className="font-display rounded-xl bg-sage px-10 py-3 text-lg text-white transition hover:bg-sage-deep active:scale-[0.98]"
                >
                  Reveal answer
                </button>
              </div>
            ) : (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                role="status"
              >
                {verdict === "correct" && picker && (
                  <p className="font-display mb-2 text-center text-2xl text-sage">
                    Correct, {picker.name}!
                  </p>
                )}
                <p className="mb-2 rounded-2xl bg-butter-soft px-4 py-3 text-center text-lg text-ink">
                  The answer is <strong className="text-butter-deep">{tile.answer}</strong>
                </p>
                {tile.note && (
                  <p className="mx-auto mb-4 max-w-lg text-center text-sm italic leading-relaxed text-mute">
                    {tile.note}
                  </p>
                )}
                <p className="mb-3 mt-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-mute">
                  Award {tile.value} points to
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {teams.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => awardTo(t.id)}
                      autoFocus={verdict === "correct" && t.id === picker?.id}
                      className={`flex items-center gap-2 rounded-full px-5 py-2.5 font-bold text-white shadow-card transition hover:brightness-105 active:scale-[0.97] ${
                        verdict === "correct" && t.id === picker?.id ? "ring-4 ring-sage/40 ring-offset-2" : ""
                      }`}
                      style={{ background: t.color }}
                    >
                      {t.name}
                    </button>
                  ))}
                  <button
                    onClick={noAward}
                    className="rounded-full border border-line px-5 py-2.5 font-semibold text-mute transition hover:bg-cream hover:text-ink"
                  >
                    Nobody
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
