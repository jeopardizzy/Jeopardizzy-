import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { joinRoom, RELAY_URL, type PhoneView, type PlayerMsg, type PlayerRoom, type RoomStatus } from "../party/connection";
import { buzzOrderText } from "../party/round";
import PhoneSpeak from "../components/PhoneSpeak";

const STATUS_TEXT: Record<RoomStatus, string> = {
  connecting: "Connecting…",
  open: "",
  offline: "Connection lost — reconnecting…",
  "no-room": "That game doesn't exist any more. Check the code with the host.",
  "room-full": "This game is full (16 phones). Ask a teammate to share their phone.",
  closed: "The host ended the game.",
};

/** A team's phone in Trivia Night on several phones: pick a team, buzz, answer, wager. */
export default function PartyJoin() {
  const { code = "", key = "" } = useParams();
  const [status, setStatus] = useState<RoomStatus>("connecting");
  const [view, setView] = useState<PhoneView | null>(null);
  const [team, setTeam] = useState<number | null>(null);
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

  if (!RELAY_URL) {
    return (
      <main className="stage-bg flex min-h-dvh items-center justify-center px-4">
        <p className="text-ink">Playing on several phones isn't available here.</p>
      </main>
    );
  }

  const online = status === "open";
  /** false (nothing sent) while offline */
  const send = (msg: PlayerMsg) => roomRef.current?.send(msg) ?? false;
  const mine = view?.teams.find((t) => t.id === team) ?? null;
  const name = (id: number | null) => view?.teams.find((t) => t.id === id)?.name ?? "";

  return (
    <main className="stage-bg min-h-dvh px-4 py-6">
      <div className="mx-auto max-w-md">
        <p className="mb-3 text-center text-xs font-bold uppercase tracking-[0.25em] text-mute">
          {view?.game ? `${view.game} · ` : ""}Game {code.toUpperCase()}
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
                  disabled={!online}
                  className="rounded-2xl px-5 py-4 text-lg font-bold text-white shadow-card disabled:opacity-50"
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
              <span className="text-xs font-bold uppercase tracking-wider text-mute">{view.roundLabel}</span>
              <span className="font-display text-xl text-sage-deep">{mine.score}</span>
            </div>
            <Stage view={view} team={mine.id} online={online} send={send} name={name} />
          </div>
        )}

        {view && <Scores view={view} />}

        <p className="mt-6 text-center text-xs text-mute">
          Hosting your own game?{" "}
          <Link to="/" className="font-semibold text-sage-deep">
            Get Quizzical Club
          </Link>
        </p>
      </div>
    </main>
  );
}

interface StageProps {
  view: PhoneView;
  team: number;
  online: boolean;
  send: (msg: PlayerMsg) => boolean;
  name: (id: number | null) => string;
}

function Stage({ view, team, online, send, name }: StageProps) {
  const clue = view.clue;

  if (view.stage === "board") {
    return (
      <p className="py-6 text-center text-mute">
        {view.picker === team ? "Your team picks the next tile on the host's screen." : `${name(view.picker)} is picking a tile…`}
      </p>
    );
  }

  if (view.stage === "winner") {
    const top = Math.max(...view.teams.map((t) => t.score));
    const winners = view.teams.filter((t) => t.score === top);
    return (
      <p className="font-display py-4 text-center text-2xl text-sage">
        {winners.length > 1 ? "It's a tie!" : winners[0].id === team ? "You win! 🏆" : `${winners[0].name} wins!`}
      </p>
    );
  }

  if (view.stage === "final-wager") {
    return <Wager key="wager" view={view} team={team} online={online} send={send} />;
  }

  const revealed = view.answer !== null && (
    <p className="mt-3 rounded-2xl bg-butter-soft px-4 py-3 text-center text-ink">
      {view.winner === team ? "You got it! " : ""}The answer is <strong className="text-butter-deep">{view.answer}</strong>
    </p>
  );

  const clueText = clue && clue.text && (
    <>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-sage">
        {clue.category}
        {clue.value ? ` · ${clue.value} pts` : ""}
      </p>
      <p className="mb-5 text-lg font-semibold leading-relaxed text-ink">{clue.text}</p>
    </>
  );

  if (view.stage === "lightning") {
    return (
      <>
        {clueText}
        {!view.revealed && <p className="text-center font-semibold text-coral">⚡ Shout it out — the host taps who got it first.</p>}
        {revealed}
      </>
    );
  }

  if (view.stage === "final-clue") {
    const sent = view.finalAnswered.includes(team);
    return (
      <>
        {clueText}
        {!view.revealed && (
          <>
            <AnswerBox
              resetKey={`final-${sent}`}
              online={online}
              placeholder="Your final answer"
              onSend={(text, spoken) => send({ t: "final", text, spoken })}
            />
            <p className="mt-2 text-center text-xs text-mute">
              {sent ? "✓ Answer sent — you can change it until the host reveals." : "Only the host sees your answer."}
            </p>
          </>
        )}
        {revealed}
      </>
    );
  }

  // a clue on the board
  const b = view.buzz;
  const buzzed = b?.order.some((x) => x.team === team) ?? false;
  const out = b?.tried.includes(team) ?? false;
  const myTurn = !view.revealed && b?.answering === team;
  const canBuzz = online && !view.revealed && b?.open && !buzzed && !out;
  const mineLast = b?.lastAnswer?.team === team ? b.lastAnswer : null;
  return (
    <>
      {clueText}
      {!view.revealed && !b?.open && b?.answering == null && (
        <p className="mb-3 text-center text-sm text-mute">Listen… buzzers open soon.</p>
      )}
      {canBuzz && (
        <button
          onClick={() => clue && send({ t: "buzz", key: clue.key })}
          className="font-display mb-4 aspect-square w-full rounded-full bg-coral text-4xl text-white shadow-pop active:scale-95"
        >
          BUZZ
        </button>
      )}
      {myTurn && clue && (
        <AnswerBox
          resetKey={`${clue.key}-${mineLast?.text ?? ""}`}
          online={online}
          placeholder="Your turn — type the answer"
          onSend={(text, spoken) => send({ t: "answer", key: clue.key, text, spoken })}
        />
      )}
      {b && b.order.length > 0 && (
        <p className="mt-3 text-center text-sm font-semibold text-ink">{buzzOrderText(b.order, name)}</p>
      )}
      {!view.revealed && b?.answering != null && !myTurn && (
        <p className="text-center text-sm text-mute">{name(b.answering)} is answering…</p>
      )}
      {!view.revealed && out && (
        <p className="text-center text-sm text-coral">
          {mineLast ? `“${mineLast.text}” — not quite. ` : ""}Wait for the next clue.
        </p>
      )}
      {revealed}
    </>
  );
}

/** Typed answer, or Say it; keeps the draft until `resetKey` changes (the host has it). */
function AnswerBox({
  onSend,
  online,
  resetKey,
  placeholder,
}: {
  onSend: (text: string, spoken: boolean) => boolean;
  online: boolean;
  resetKey: string;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  useEffect(() => setText(""), [resetKey]);
  return (
    <div className="mb-2 flex flex-col gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (text.trim() && online) onSend(text, false);
        }}
        className="flex gap-2"
      >
        <input
          autoFocus
          aria-label="Your answer"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-4 py-3 text-base text-ink"
        />
        <button type="submit" disabled={!online} className="rounded-xl bg-sage px-4 py-3 font-semibold text-white disabled:opacity-40">
          Send
        </button>
      </form>
      <PhoneSpeak resetKey={resetKey} onText={(t) => online && onSend(t, true)} />
    </div>
  );
}

/** Final round: a secret wager on this phone. */
function Wager({ view, team, online, send }: Omit<StageProps, "name">) {
  const score = Math.max(0, view.teams.find((t) => t.id === team)?.score ?? 0);
  const [amount, setAmount] = useState(0);
  const sent = view.wagered.includes(team);
  return (
    <div className="text-center">
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-coral">Final round</p>
      <p className="mb-4 text-ink">
        Category: <strong className="text-sage-deep">{view.clue?.category}</strong>
      </p>
      <p className="mb-3 text-sm text-mute">Wager up to {score} points — only your phone sees it until the reveal.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (online) send({ t: "wager", amount: Math.max(0, Math.min(score, Math.floor(amount) || 0)) });
        }}
        className="flex gap-2"
      >
        <input
          type="number"
          min={0}
          max={score}
          aria-label="Your wager"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="min-w-0 flex-1 rounded-xl border border-line bg-cream px-4 py-3 text-center font-display text-xl text-sage-deep"
        />
        <button type="submit" disabled={!online} className="rounded-xl bg-coral px-4 py-3 font-semibold text-white disabled:opacity-40">
          {sent ? "Change" : "Wager"}
        </button>
      </form>
      {sent && <p className="mt-2 text-xs text-sage-deep">✓ Wager sent — you can change it until the host locks in.</p>}
    </div>
  );
}

function Scores({ view }: { view: PhoneView }) {
  return (
    <ul className="mt-4 flex flex-wrap justify-center gap-2" aria-label="Scores">
      {view.teams.map((t) => (
        <li key={t.id} className="flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.color }} aria-hidden />
          {t.name} <span className="font-display text-sage-deep">{t.score}</span>
        </li>
      ))}
    </ul>
  );
}
