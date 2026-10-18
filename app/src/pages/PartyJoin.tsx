import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { joinRoom, RELAY_URL, type PlayerRoom, type RoomStatus } from "../party/connection";
import { buzzOrderText, type PartyView } from "../party/game";

const STATUS_TEXT: Record<RoomStatus, string> = {
  connecting: "Connecting…",
  open: "",
  offline: "Connection lost — reconnecting…",
  "no-room": "That room doesn't exist. Check the code with the host.",
  closed: "The host closed the room.",
};

/** A team's phone in a party room (prototype): pick a team, buzz, answer. */
export default function PartyJoin() {
  const { code = "", key = "" } = useParams();
  const [status, setStatus] = useState<RoomStatus>("connecting");
  const [view, setView] = useState<PartyView | null>(null);
  const [team, setTeam] = useState<number | null>(null);
  const [text, setText] = useState("");
  const roomRef = useRef<PlayerRoom | null>(null);

  useEffect(() => {
    if (!RELAY_URL) return;
    const r = joinRoom(RELAY_URL, code.toUpperCase(), key, {
      status: setStatus,
      message: (m) => {
        if (m.t === "view") setView(m.view);
        else if (m.t === "you") setTeam(m.team);
      },
    });
    roomRef.current = r;
    return () => r.close();
  }, [code, key]);

  // a new clue clears the answer box
  const index = view?.index;
  useEffect(() => setText(""), [index]);

  if (!RELAY_URL) {
    return (
      <main className="stage-bg flex min-h-dvh items-center justify-center px-4">
        <p className="text-ink">Playing on several phones is coming soon.</p>
      </main>
    );
  }

  const send = roomRef.current?.send ?? (() => {});
  const mine = view?.teams.find((t) => t.id === team) ?? null;
  const buzzed = view?.buzzes.some((b) => b.team === team) ?? false;
  const out = team !== null && (view?.tried.includes(team) ?? false);
  const canBuzz = view && team !== null && (view.phase === "buzzing" || view.phase === "answering") && !buzzed && !out;
  const myTurn = view?.phase === "answering" && view.answering === team && team !== null;

  return (
    <main className="stage-bg min-h-dvh px-4 py-6">
      <div className="mx-auto max-w-md">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-mute">
          Room {code.toUpperCase()}
        </p>
        {STATUS_TEXT[status] && (
          <p role="status" className="mb-3 text-center text-sm font-semibold text-coral">
            {STATUS_TEXT[status]}
          </p>
        )}

        {view && team === null && (
          <div className="rounded-3xl border border-line bg-surface p-6 shadow-pop">
            <h1 className="font-display mb-4 text-center text-2xl text-ink">Which team are you?</h1>
            <div className="flex flex-col gap-2">
              {view.teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => send({ t: "team", team: t.id })}
                  className="rounded-2xl px-5 py-4 text-lg font-bold text-white shadow-card"
                  style={{ background: t.color }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {view && mine && (
          <div className="rounded-3xl border-4 bg-surface p-6 shadow-pop" style={{ borderColor: mine.color }}>
            <div className="mb-4 flex items-center justify-between">
              <span className="font-bold text-ink">{mine.name}</span>
              <span className="font-display text-xl text-sage-deep">{mine.score}</span>
            </div>

            {view.phase === "lobby" && <p className="text-center text-mute">You're in! Waiting for the host to start…</p>}

            {view.clue && (
              <>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-sage">
                  {view.clue.categoryName} · {view.clue.value} pts
                </p>
                <p className="mb-5 text-lg font-semibold leading-relaxed text-ink">{view.clue.clue}</p>
              </>
            )}

            {view.phase === "reading" && <p className="mb-3 text-center text-sm text-mute">Listen… buzzers open soon.</p>}

            {canBuzz && (
              <button
                onClick={() => send({ t: "buzz", clue: view.index })}
                className="font-display mb-4 aspect-square w-full rounded-full bg-coral text-4xl text-white shadow-pop active:scale-95"
              >
                BUZZ
              </button>
            )}

            {myTurn && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!text.trim()) return;
                  send({ t: "answer", clue: view.index, text });
                  setText("");
                }}
                className="mb-4 flex gap-2"
              >
                <input
                  autoFocus
                  aria-label="Your answer"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Your turn — type the answer"
                  className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-4 py-3 text-base text-ink"
                />
                <button type="submit" className="rounded-xl bg-sage px-4 py-3 font-semibold text-white">
                  Send
                </button>
              </form>
            )}

            {view.buzzes.length > 0 && (
              <p className="mb-2 text-center text-sm font-semibold text-ink">{buzzOrderText(view)}</p>
            )}
            {view.phase === "answering" && !myTurn && (
              <p className="text-center text-sm text-mute">
                {view.teams.find((t) => t.id === view.answering)?.name} is answering…
              </p>
            )}
            {out && view.phase !== "revealed" && (
              <p className="text-center text-sm text-coral">Not quite — wait for the next clue.</p>
            )}
            {view.answer && (
              <p className="mt-2 rounded-2xl bg-butter-soft px-4 py-3 text-center text-ink">
                {view.winner === team ? "You got it! " : ""}The answer is{" "}
                <strong className="text-butter-deep">{view.answer}</strong>
              </p>
            )}
            {view.phase === "done" && (
              <p className="font-display text-center text-xl text-sage">
                {[...view.teams].sort((a, b) => b.score - a.score)[0].name} wins!
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-xs text-mute">
          Hosting your own?{" "}
          <Link to="/" className="font-semibold text-sage-deep">
            Get Quizzical Club
          </Link>
        </p>
      </div>
    </main>
  );
}
