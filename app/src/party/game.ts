import { isCorrect } from "../lib/answerMatch";

/**
 * Party game rules, run only on the host phone (the referee). Team phones
 * send buzzes and answers; the host applies them here and sends everyone a
 * public view that never contains the answer before the reveal.
 *
 * Buzz order uses the relay's clock (one clock for the whole room), so phone
 * clocks don't matter. The first buzzer answers; a miss passes the turn to the
 * next buzzer in order; teams that haven't tried can still buzz.
 */

export interface PartyTeam {
  id: number;
  name: string;
  color: string;
  score: number;
}

export interface PartyClue {
  categoryName: string;
  clue: string;
  answer: string;
  value: number;
}

export type PartyPhase = "lobby" | "reading" | "buzzing" | "answering" | "revealed" | "done";

export interface Buzz {
  team: number;
  at: number;
}

export interface PartyGame {
  teams: PartyTeam[];
  clues: PartyClue[];
  index: number;
  phase: PartyPhase;
  buzzOpenAt: number | null;
  /** one per team, earliest first */
  buzzes: Buzz[];
  answering: number | null;
  tried: number[];
  lastAnswer: { team: number; text: string; correct: boolean } | null;
  winner: number | null;
}

export function newPartyGame(teams: PartyTeam[], clues: PartyClue[]): PartyGame {
  return {
    teams,
    clues,
    index: 0,
    phase: "lobby",
    buzzOpenAt: null,
    buzzes: [],
    answering: null,
    tried: [],
    lastAnswer: null,
    winner: null,
  };
}

const fresh = (g: PartyGame, index: number): PartyGame => ({
  ...g,
  index,
  phase: index < g.clues.length ? "reading" : "done",
  buzzOpenAt: null,
  buzzes: [],
  answering: null,
  tried: [],
  lastAnswer: null,
  winner: null,
});

export const startParty = (g: PartyGame): PartyGame => (g.phase === "lobby" ? fresh(g, 0) : g);

/** The quizmaster finished reading: buzzers open (relay time). */
export function openBuzzers(g: PartyGame, at: number): PartyGame {
  return g.phase === "reading" ? { ...g, phase: "buzzing", buzzOpenAt: at } : g;
}

/** A team buzzed at relay time `at`. Early, repeat and already-tried buzzes are ignored. */
export function buzz(g: PartyGame, team: number, at: number): PartyGame {
  if (g.phase !== "buzzing" && g.phase !== "answering") return g;
  if (g.buzzOpenAt === null || at < g.buzzOpenAt) return g;
  if (!g.teams.some((t) => t.id === team) || g.tried.includes(team)) return g;
  if (g.buzzes.some((b) => b.team === team)) return g;
  const buzzes = [...g.buzzes, { team, at }].sort((a, b) => a.at - b.at);
  if (g.answering !== null) return { ...g, buzzes };
  return { ...g, buzzes, answering: team, phase: "answering" };
}

/** The answering team's typed (or spoken, recognised on their phone) answer. */
export function answer(g: PartyGame, team: number, text: string): PartyGame {
  if (g.phase !== "answering" || g.answering !== team || !text.trim()) return g;
  const clue = g.clues[g.index];
  const correct = isCorrect(text, clue.answer);
  const lastAnswer = { team, text: text.trim().slice(0, 80), correct };
  if (correct) {
    return {
      ...g,
      lastAnswer,
      winner: team,
      phase: "revealed",
      answering: null,
      teams: g.teams.map((t) => (t.id === team ? { ...t, score: t.score + clue.value } : t)),
    };
  }
  const tried = [...g.tried, team];
  const next = g.buzzes.find((b) => !tried.includes(b.team))?.team ?? null;
  const everyoneTried = g.teams.every((t) => tried.includes(t.id));
  return {
    ...g,
    lastAnswer,
    tried,
    answering: next,
    phase: next !== null ? "answering" : everyoneTried ? "revealed" : "buzzing",
  };
}

export const revealClue = (g: PartyGame): PartyGame =>
  g.phase === "reading" || g.phase === "buzzing" || g.phase === "answering"
    ? { ...g, phase: "revealed", answering: null }
    : g;

export const nextClue = (g: PartyGame): PartyGame => (g.phase === "revealed" ? fresh(g, g.index + 1) : g);

/** What every phone may see: no answer until it is revealed. */
export interface PartyView {
  phase: PartyPhase;
  teams: PartyTeam[];
  index: number;
  total: number;
  clue: { categoryName: string; clue: string; value: number } | null;
  answer: string | null;
  buzzes: { team: number; gapMs: number }[];
  answering: number | null;
  tried: number[];
  lastAnswer: PartyGame["lastAnswer"];
  winner: number | null;
}

export function partyView(g: PartyGame): PartyView {
  const c = g.clues[g.index];
  const first = g.buzzes[0]?.at ?? 0;
  return {
    phase: g.phase,
    teams: g.teams,
    index: g.index,
    total: g.clues.length,
    clue: c && g.phase !== "lobby" && g.phase !== "done" ? { categoryName: c.categoryName, clue: c.clue, value: c.value } : null,
    answer: g.phase === "revealed" && c ? c.answer : null,
    buzzes: g.buzzes.map((b) => ({ team: b.team, gapMs: b.at - first })),
    answering: g.answering,
    tried: g.tried,
    lastAnswer: g.lastAnswer,
    winner: g.winner,
  };
}

/** "Team Sage first · Team Butter +0.12 s" */
export function buzzOrderText(view: Pick<PartyView, "buzzes" | "teams">): string {
  const name = (id: number) => view.teams.find((t) => t.id === id)?.name ?? "?";
  return view.buzzes
    .map((b, i) => (i === 0 ? `${name(b.team)} first` : `${name(b.team)} +${(b.gapMs / 1000).toFixed(2)} s`))
    .join(" · ");
}
