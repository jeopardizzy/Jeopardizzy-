import { isCorrect } from "../lib/answerMatch";
import { heardIn } from "../lib/spokenMatch";

/**
 * One clue played on several phones, refereed by the host phone. Pure rules:
 * buzz order uses the relay's clock (one clock for the whole room); the first
 * buzzer answers; a miss passes the turn to the next buzzer; teams that haven't
 * tried can still buzz. Answers are typed, or spoken and turned into text on
 * the team's own phone (checked here with the same accent-tolerant matching as
 * the Workbook's Say it).
 */

export interface Buzz {
  team: number;
  at: number;
}

export interface AnswerResult {
  team: number;
  text: string;
  spoken: boolean;
  correct: boolean;
}

export interface Round {
  /** which clue this round belongs to (tile id); messages for other clues are stale */
  key: string;
  open: boolean;
  /** one per team, earliest first */
  buzzes: Buzz[];
  answering: number | null;
  tried: number[];
  lastAnswer: AnswerResult | null;
  winner: number | null;
}

export const newRound = (key: string): Round => ({
  key,
  open: false,
  buzzes: [],
  answering: null,
  tried: [],
  lastAnswer: null,
  winner: null,
});

/** The quizmaster has read the clue: buzzers open. */
export const openBuzzers = (r: Round): Round => (r.open || r.winner !== null ? r : { ...r, open: true });

/** A team buzzed at relay time `at`. Closed, repeat and already-tried buzzes are ignored. */
export function buzz(r: Round, team: number, at: number): Round {
  if (!r.open || r.winner !== null || r.tried.includes(team) || r.buzzes.some((b) => b.team === team)) return r;
  const buzzes = [...r.buzzes, { team, at }].sort((a, b) => a.at - b.at);
  // the turn goes to whoever buzzed if nobody is answering now
  return { ...r, buzzes, answering: r.answering ?? team };
}

/** Does this text answer the clue? Spoken text is matched more leniently. */
export function judge(text: string, spoken: boolean, answer: string): boolean {
  return isCorrect(text, answer) || (spoken && heardIn(text, answer));
}

/** The answering team's answer. Anyone else's is ignored. */
export function answer(r: Round, team: number, text: string, spoken: boolean, correctAnswer: string): Round {
  const t = text.trim().slice(0, 80);
  if (r.answering !== team || !t || r.winner !== null) return r;
  const correct = judge(t, spoken, correctAnswer);
  const lastAnswer = { team, text: t, spoken, correct };
  if (correct) return { ...r, lastAnswer, winner: team, answering: null, open: false };
  const tried = [...r.tried, team];
  const next = r.buzzes.find((b) => !tried.includes(b.team))?.team ?? null;
  return { ...r, lastAnswer, tried, answering: next };
}

/** Every team has tried and missed. */
export const everyoneMissed = (r: Round, teamIds: number[]): boolean =>
  r.winner === null && teamIds.every((id) => r.tried.includes(id));

/** "Team Sage first · Team Butter +0.12 s" */
export function buzzOrderText(buzzes: { team: number; gapMs: number }[], name: (id: number) => string): string {
  return buzzes
    .map((b, i) => (i === 0 ? `${name(b.team)} first` : `${name(b.team)} +${(b.gapMs / 1000).toFixed(2)} s`))
    .join(" · ");
}

export const withGaps = (buzzes: Buzz[]) =>
  buzzes.map((b) => ({ team: b.team, gapMs: b.at - (buzzes[0]?.at ?? b.at) }));
