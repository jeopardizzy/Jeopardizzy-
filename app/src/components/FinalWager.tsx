import { motion } from "motion/react";
import { useTeamStore } from "../store/teamStore";
import { useMotionSafe } from "../lib/useMotionSafe";
import { say } from "../audio/voice";
import { usePartyHost } from "../party/hostSession";
import { judge } from "../party/round";
import { displayClue } from "../lib/displayClue";

/** Final Quizzical for teams: per-team wagers, reveal, per-team grading. */
export default function FinalWager() {
  const phase = useTeamStore((s) => s.phase);
  const finalClue = useTeamStore((s) => s.finalClue);
  const teams = useTeamStore((s) => s.teams);
  const wagers = useTeamStore((s) => s.wagers);
  const finalMarks = useTeamStore((s) => s.finalMarks);
  const revealed = useTeamStore((s) => s.revealed);
  const setWager = useTeamStore((s) => s.setWager);
  const markFinal = useTeamStore((s) => s.markFinal);
  const finishGame = useTeamStore((s) => s.finishGame);
  const reduce = useMotionSafe();
  // several-phones play: wagers and final answers come from each team's phone
  const partyOn = usePartyHost((s) => s.room !== null);
  const wagered = usePartyHost((s) => s.wagered);
  const finalAnswers = usePartyHost((s) => s.finalAnswers);

  if (!finalClue) return null;

  if (phase === "final-wager") {
    return (
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-xl rounded-3xl border border-line bg-surface p-8 shadow-pop lg:max-w-[46vw]"
      >
        <p className="mb-1 text-center text-xs font-bold uppercase tracking-[0.3em] text-coral">
          Final Quizzical
        </p>
        <h2 className="font-display mb-2 text-center text-2xl text-ink">
          Category: <span className="text-sage-deep">{finalClue.categoryName}</span>
        </h2>
        <p className="mb-6 text-center text-sm text-mute">
          {partyOn
            ? "Each team wagers up to its score on its own phone — secretly. Lock in when every team has wagered."
            : "Each team wagers up to its score. Write the wagers down, then lock in."}
        </p>

        <div className="mb-6 space-y-3">
          {teams.map((t) => (
            <div key={t.id} className="flex items-center gap-3">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ background: t.color }}
                aria-hidden
              />
              <span className="w-32 truncate text-sm font-semibold text-ink">{t.name}</span>
              <span className="text-xs text-mute">({t.score} pts)</span>
              {partyOn ? (
                <span className={`ml-auto text-sm font-semibold ${wagered.includes(t.id) ? "text-sage-deep" : "text-mute"}`}>
                  {wagered.includes(t.id) ? "✓ Wagered" : "Waiting…"}
                </span>
              ) : (
              <input
                type="number"
                min={0}
                max={Math.max(0, t.score)}
                value={wagers[t.id] ?? 0}
                onChange={(e) => setWager(t.id, Number(e.target.value))}
                aria-label={`Wager for ${t.name}`}
                className="ml-auto w-28 rounded-xl border border-line bg-cream px-3 py-2 text-center font-display text-lg text-sage-deep"
              />
              )}
            </div>
          ))}
        </div>

        <LockInButton />
      </motion.div>
    );
  }

  // final-clue
  const allMarked = finalMarks.every((m) => m !== null);
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface p-8 shadow-pop sm:p-10 lg:max-w-[46vw]"
    >
      <div className="mb-4 flex items-center justify-between text-xs font-bold uppercase tracking-[0.25em]">
        <span className="text-sage">{finalClue.categoryName}</span>
        <span className="text-coral">final</span>
      </div>
      <p className="mb-8 text-center text-xl font-semibold leading-relaxed text-ink sm:text-2xl">
        {displayClue(finalClue.clue)}
      </p>

      {!revealed ? (
        <div className="text-center">
          {partyOn && (
            <p className="mb-4 text-sm text-mute" role="status">
              Answers in: {Object.keys(finalAnswers).length} of {teams.length}
            </p>
          )}
          <button
            onClick={() => useTeamStore.getState().revealFinal()}
            autoFocus
            className="font-display rounded-xl bg-sage px-10 py-3 text-lg text-white transition hover:bg-sage-deep active:scale-[0.98]"
          >
            Reveal answer
          </button>
        </div>
      ) : (
        <div role="status">
          <p className="mb-6 rounded-2xl bg-butter-soft px-4 py-3 text-center text-lg text-ink">
            The answer is <strong className="text-butter-deep">{finalClue.answer}</strong>
          </p>
          <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-mute">
            Did each team get it right?
          </p>
          <div className="mb-6 space-y-2">
            {teams.map((t) => (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-cream px-4 py-2.5"
              >
                <span
                  className="h-4 w-4 rounded-full"
                  style={{ background: t.color }}
                  aria-hidden
                />
                <span className="flex-1 text-sm font-semibold text-ink">
                  {t.name} <span className="font-normal text-mute">(wagered {wagers[t.id]})</span>
                  {partyOn && (
                    <span className="block text-xs font-normal text-mute">
                      {finalAnswers[t.id]
                        ? `answered “${finalAnswers[t.id].text}”${judge(finalAnswers[t.id].text, finalAnswers[t.id].spoken, finalClue.answer) ? " — looks right" : ""}`
                        : "no answer sent"}
                    </span>
                  )}
                </span>
                {finalMarks[t.id] === null ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => markFinal(t.id, true)}
                      className="rounded-lg bg-sage px-4 py-1.5 text-sm font-bold text-white transition hover:bg-sage-deep"
                    >
                      ✓ Right
                    </button>
                    <button
                      onClick={() => markFinal(t.id, false)}
                      className="rounded-lg bg-coral px-4 py-1.5 text-sm font-bold text-white transition hover:brightness-105"
                    >
                      ✗ Wrong
                    </button>
                  </div>
                ) : (
                  <span
                    className={`text-sm font-bold ${finalMarks[t.id] ? "text-sage" : "text-coral"}`}
                  >
                    {finalMarks[t.id] ? `+${wagers[t.id]}` : `−${wagers[t.id]}`}
                  </span>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={finishGame}
            disabled={!allMarked}
            className="font-display w-full rounded-xl bg-butter px-6 py-4 text-xl text-ink transition enabled:hover:brightness-105 enabled:active:scale-[0.98] disabled:opacity-40"
          >
            Crown the winners
          </button>
        </div>
      )}
    </motion.div>
  );
}

function LockInButton() {
  const go = () => {
    const clue = useTeamStore.getState().finalClue;
    if (clue) say({ line: "finalClue" }, { kind: "clue", text: clue.clue });
    useTeamStore.setState({ phase: "final-clue" });
  };
  return (
    <button
      onClick={go}
      className="font-display w-full rounded-xl bg-coral px-6 py-4 text-xl text-white transition hover:brightness-105 active:scale-[0.98]"
    >
      Lock wagers, show the clue
    </button>
  );
}
