import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { TEAM_COLORS, useTeamStore } from "../store/teamStore";
import { buildDailyBoard } from "../lib/board";
import { dailySeed } from "../lib/random";
import { say, stopVoice } from "../audio/voice";
import { sfx } from "../audio/sound";
import QrCode from "../components/QrCode";
import { hostRoom, RELAY_URL, type HostRoom, type PlayerMsg, type RoomStatus } from "../party/connection";
import {
  answer,
  buzz,
  buzzOrderText,
  newPartyGame,
  nextClue,
  openBuzzers,
  partyView,
  revealClue,
  startParty,
  type PartyClue,
  type PartyGame,
} from "../party/game";

/** Prototype: ten clues from today's Daily Board, cheapest first. */
function partyClues(): PartyClue[] {
  return buildDailyBoard(dailySeed())
    .tiles.slice()
    .sort((a, b) => a.value - b.value)
    .slice(0, 10)
    .map((t) => ({ categoryName: t.categoryName, clue: t.clue, answer: t.answer, value: t.value }));
}

/**
 * Party host (prototype): this phone shows the clue and referees; each team
 * buzzes and answers on its own phone, through the relay.
 */
export default function PartyHost() {
  const savedNames = useTeamStore((s) => s.settings.teamNames);
  const [names, setNames] = useState<string[]>(() =>
    savedNames.length >= 2 ? savedNames.slice(0, 4) : ["Team Sage", "Team Butter"],
  );
  const [room, setRoom] = useState<HostRoom | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<RoomStatus>("connecting");
  const [game, setGameState] = useState<PartyGame | null>(null);
  const [members, setMembersState] = useState<Record<string, number>>({});
  const [online, setOnline] = useState<Record<string, boolean>>({});

  // the relay callbacks outlive renders: keep the latest state in refs
  const gameRef = useRef<PartyGame | null>(null);
  const membersRef = useRef<Record<string, number>>({});
  const setGame = useCallback((g: PartyGame) => {
    gameRef.current = g;
    setGameState(g);
  }, []);
  const setMembers = useCallback((m: Record<string, number>) => {
    membersRef.current = m;
    setMembersState(m);
  }, []);

  const roomRef = useRef<HostRoom | null>(null);
  useEffect(() => () => roomRef.current?.close(), []);

  const open = () => {
    if (!RELAY_URL) return;
    const teams = names.map((n, i) => ({
      id: i,
      name: n.trim() || `Team ${i + 1}`,
      color: TEAM_COLORS[i % TEAM_COLORS.length],
      score: 0,
    }));
    setGame(newPartyGame(teams, partyClues()));
    const r = hostRoom(RELAY_URL, {
      status: setStatus,
      peer: (peer, up) => {
        setOnline((o) => ({ ...o, [peer]: up }));
        const g = gameRef.current;
        if (up && g) {
          r.sendTo(peer, { t: "view", view: partyView(g) });
          r.sendTo(peer, { t: "you", team: membersRef.current[peer] ?? null });
        }
      },
      message: (peer, msg: PlayerMsg, at) => {
        const g = gameRef.current;
        if (!g) return;
        if (msg.t === "team") {
          if (!g.teams.some((t) => t.id === msg.team)) return;
          setMembers({ ...membersRef.current, [peer]: msg.team });
          r.sendTo(peer, { t: "you", team: msg.team });
          return;
        }
        const team = membersRef.current[peer];
        if (team === undefined || msg.clue !== g.index) return; // stale or unassigned
        if (msg.t === "buzz") {
          const next = buzz(g, team, at);
          if (next !== g) {
            sfx.tick();
            setGame(next);
          }
        } else if (msg.t === "answer") {
          const next = answer(g, team, msg.text);
          if (next !== g) {
            if (next.winner !== null) sfx.ding();
            else sfx.buzz();
            setGame(next);
          }
        }
      },
    });
    roomRef.current = r;
    setRoom(r);
    r.code.then(setCode);
    r.link.then(setLink);
  };

  // everyone sees the latest public view
  useEffect(() => {
    if (room && game) room.sendAll({ t: "view", view: partyView(game) });
  }, [room, game]);

  // the quizmaster reads each new clue
  const index = game?.index;
  const phase = game?.phase;
  useEffect(() => {
    if (!game || phase !== "reading") return;
    say({ kind: "clue", text: game.clues[game.index].clue });
  }, [index, phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!RELAY_URL) {
    return (
      <main className="stage-bg flex min-h-dvh items-center justify-center px-4">
        <div className="max-w-md rounded-3xl border border-line bg-surface p-8 text-center shadow-pop">
          <p className="mb-4 text-ink">Playing on several phones is coming soon.</p>
          <Link to="/sets" className="font-semibold text-sage-deep">
            ← Back to Trivia Night
          </Link>
        </div>
      </main>
    );
  }

  const view = game ? partyView(game) : null;
  const teamName = (id: number | null) => game?.teams.find((t) => t.id === id)?.name ?? "";
  const phonesFor = (team: number) =>
    Object.entries(members).filter(([p, t]) => t === team && online[p] !== false).length;

  return (
    <main className="stage-bg min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-3xl border border-line bg-surface p-6 shadow-pop sm:p-8">
        <div className="mb-4 flex items-center justify-between">
          <Link to="/sets" className="text-sm font-semibold text-mute hover:text-ink" onClick={() => stopVoice()}>
            ← Back
          </Link>
          <span className="rounded-full bg-butter-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-butter-deep">
            Preview
          </span>
        </div>
        <h1 className="font-display mb-1 text-2xl text-ink">Play on several phones</h1>

        {!room && (
          <>
            <p className="mb-5 text-sm text-mute">
              Each team buzzes and answers on its own phone. This phone shows the clues and keeps score.
            </p>
            <div className="mb-5 space-y-2">
              {names.map((n, i) => (
                <input
                  key={i}
                  aria-label={`Team ${i + 1} name`}
                  value={n}
                  maxLength={24}
                  onChange={(e) => setNames(names.map((x, j) => (j === i ? e.target.value : x)))}
                  className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 font-semibold text-ink"
                />
              ))}
              {names.length < 4 && (
                <button
                  onClick={() => setNames([...names, `Team ${names.length + 1}`])}
                  className="w-full rounded-xl border-2 border-dashed border-line px-4 py-2 text-sm font-semibold text-mute"
                >
                  + Add a team
                </button>
              )}
            </div>
            <button
              onClick={open}
              className="font-display w-full rounded-2xl bg-sage px-6 py-4 text-xl text-white hover:bg-sage-deep"
            >
              Open a room
            </button>
          </>
        )}

        {room && game && view && (
          <>
            <div className="mb-5 rounded-2xl bg-cream p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-mute">Join code</p>
              <p className="font-display text-4xl tracking-[0.3em] text-ink" aria-label="Join code">
                {code ?? "…"}
              </p>
              {link && view.phase === "lobby" && (
                <div className="mt-3 flex justify-center">
                  <QrCode text={link} label="QR code to join this room" />
                </div>
              )}
              {link && (
                <p className="mt-2 break-all text-xs text-mute">
                  <a href={link} target="_blank" rel="noreferrer" className="text-sage-deep underline" data-testid="join-link">
                    {link}
                  </a>
                </p>
              )}
              {status !== "open" && <p className="mt-2 text-xs font-semibold text-coral">Connection: {status}</p>}
            </div>

            <ul className="mb-5 flex flex-wrap gap-2" aria-label="Team scores">
              {game.teams.map((t) => (
                <li
                  key={t.id}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${
                    view.answering === t.id ? "border-sage bg-sage-soft" : "border-line"
                  }`}
                >
                  <span className="h-3 w-3 rounded-full" style={{ background: t.color }} aria-hidden />
                  <span className="font-semibold text-ink">{t.name}</span>
                  <span className="font-display text-sage-deep">{t.score}</span>
                  <span className="text-xs text-mute">📱{phonesFor(t.id)}</span>
                </li>
              ))}
            </ul>

            {view.phase === "lobby" && (
              <button
                onClick={() => setGame(startParty(game))}
                className="font-display w-full rounded-2xl bg-sage px-6 py-4 text-xl text-white hover:bg-sage-deep"
              >
                Start
              </button>
            )}

            {view.clue && (
              <div className="mb-4">
                <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[0.2em]">
                  <span className="text-sage">{view.clue.categoryName}</span>
                  <span className="text-butter-deep">
                    {view.index + 1} of {view.total} · {view.clue.value} pts
                  </span>
                </div>
                <p className="mb-4 text-xl font-semibold leading-relaxed text-ink">{view.clue.clue}</p>

                {view.buzzes.length > 0 && (
                  <p role="status" aria-label="Buzz order" className="mb-2 text-sm font-semibold text-ink">
                    {buzzOrderText(view)}
                  </p>
                )}
                {view.lastAnswer && (
                  <p className={`mb-2 text-sm font-semibold ${view.lastAnswer.correct ? "text-sage-deep" : "text-coral"}`}>
                    {teamName(view.lastAnswer.team)}: “{view.lastAnswer.text}” —{" "}
                    {view.lastAnswer.correct ? "correct!" : "not quite."}
                  </p>
                )}
                {view.phase === "answering" && (
                  <p className="mb-3 text-sm text-mute">{teamName(view.answering)} is answering on their phone…</p>
                )}
                {view.answer && (
                  <p className="mb-3 rounded-2xl bg-butter-soft px-4 py-3 text-center text-lg text-ink">
                    The answer is <strong className="text-butter-deep">{view.answer}</strong>
                  </p>
                )}

                <div className="flex flex-wrap justify-center gap-2">
                  {view.phase === "reading" && (
                    <button
                      onClick={() => setGame(openBuzzers(game, 0))}
                      className="rounded-xl bg-coral px-6 py-3 font-bold text-white"
                    >
                      Open buzzers
                    </button>
                  )}
                  {(view.phase === "reading" || view.phase === "buzzing" || view.phase === "answering") && (
                    <button
                      onClick={() => setGame(revealClue(game))}
                      className="rounded-xl border border-line px-6 py-3 font-semibold text-mute"
                    >
                      Reveal answer
                    </button>
                  )}
                  {view.phase === "revealed" && (
                    <button
                      onClick={() => {
                        stopVoice();
                        setGame(nextClue(game));
                      }}
                      className="rounded-xl bg-sage px-6 py-3 font-bold text-white"
                    >
                      {view.index + 1 < view.total ? "Next clue" : "Final scores"}
                    </button>
                  )}
                </div>
              </div>
            )}

            {view.phase === "done" && (
              <p className="font-display text-center text-2xl text-sage">
                {[...game.teams].sort((a, b) => b.score - a.score)[0].name} wins!
              </p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
