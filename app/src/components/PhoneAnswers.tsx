import { useTeamStore } from "../store/teamStore";
import { usePartyHost } from "../party/hostSession";
import { buzzOrderText, everyoneMissed, withGaps } from "../party/round";

/**
 * The clue card's answering area when teams play on their own phones: open
 * the buzzers, see who buzzed first and what each team answered. Answers are
 * checked here (typed, or spoken and turned into text on the team's phone);
 * the host still awards the points.
 */
export default function PhoneAnswers() {
  const round = usePartyHost((s) => s.round);
  const openBuzzers = usePartyHost((s) => s.openBuzzers);
  const teams = useTeamStore((s) => s.teams);
  if (!round) return null;
  const name = (id: number | null) => teams.find((t) => t.id === id)?.name ?? "";
  const allMissed = everyoneMissed(round, teams.map((t) => t.id));

  return (
    <div className="mx-auto mb-5 flex max-w-md flex-col items-center gap-2 text-sm">
      {!round.open && round.winner === null && (
        <>
          <button
            type="button"
            onClick={openBuzzers}
            className="font-display rounded-xl bg-coral px-8 py-3 text-lg text-white transition hover:brightness-105 active:scale-[0.98]"
          >
            Open buzzers
          </button>
          <p className="text-xs text-mute">Open them when the clue has been read, so nobody buzzes on the first word.</p>
        </>
      )}
      {round.open && round.buzzes.length === 0 && (
        <p className="font-semibold text-ink">Buzzers open — the first team to buzz answers.</p>
      )}
      {round.buzzes.length > 0 && (
        <p role="status" aria-label="Buzz order" className="font-semibold text-ink">
          {buzzOrderText(withGaps(round.buzzes), name)}
        </p>
      )}
      {round.lastAnswer && !round.lastAnswer.correct && (
        <p className="font-semibold text-coral">
          {name(round.lastAnswer.team)}: {round.lastAnswer.spoken ? "🎙️ " : ""}“{round.lastAnswer.text}” — not quite.
        </p>
      )}
      {round.answering !== null && (
        <p className="text-mute">
          <span className="font-semibold text-ink">{name(round.answering)}</span> is answering on their phone…
        </p>
      )}
      {round.open && round.answering === null && round.buzzes.length > 0 && !allMissed && (
        <p className="text-mute">Teams that haven't tried can still buzz.</p>
      )}
      {allMissed && <p className="font-semibold text-coral">Every team has had a go — reveal the answer.</p>}
    </div>
  );
}
