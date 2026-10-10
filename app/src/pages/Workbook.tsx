import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useWorkbookStore,
  workbookPool,
  type Level,
} from "../store/workbookStore";
import {
  TASK_TYPE_LABELS,
  type TaskType,
} from "../data/categoryTypes";
import { useMotionSafe } from "../lib/useMotionSafe";
import Toggles from "../components/Toggles";

const LEVELS: { id: Level; label: string }[] = [
  { id: "all", label: "All levels" },
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
];

const TYPE_EMOJI: Record<string, string> = {
  all: "🎲",
  homonyms: "👂",
  compound: "🧩",
  "word-parts": "🔤",
  backwords: "🔙",
  heteronyms: "🎭",
  "letter-trivia": "🔠",
  initials: "🅰️",
  "hidden-word": "🫥",
  "title-swap": "📚",
  geography: "🌍",
  knowledge: "💡",
};

export default function Workbook() {
  const phase = useWorkbookStore((s) => s.phase);
  return (
    <main className="stage-bg min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <AnimatePresence mode="wait">
          {phase === "pick" && <Picker key="pick" />}
          {phase === "test" && <TestRunner key="test" />}
          {phase === "results" && <TestResults key="results" />}
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ---------- picker ---------- */

function Picker() {
  const navigate = useNavigate();
  const type = useWorkbookStore((s) => s.type);
  const level = useWorkbookStore((s) => s.level);
  const pick = useWorkbookStore((s) => s.pick);
  const startTest = useWorkbookStore((s) => s.startTest);
  const bests = useWorkbookStore((s) => s.records.workbookBests);
  const reduce = useMotionSafe();

  const types: (TaskType | "all")[] = [
    "all",
    ...(Object.keys(TASK_TYPE_LABELS) as TaskType[]),
  ];

  const poolSize = workbookPool(type, level).length;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0 }}
    >
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/")}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-mute shadow-card transition hover:text-ink"
        >
          ← Home
        </button>
        <Toggles />
      </div>

      <h1 className="font-display mb-1 text-3xl text-ink sm:text-4xl">Workbook</h1>
      <p className="mb-6 text-mute">
        Pick a puzzle type and a level — you get a 10-question test with instant feedback. Best
        scores are kept on this device.
      </p>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {types.map((t) => {
          const count = workbookPool(t, "all").length;
          const active = type === t;
          const best = bests[`${t}|${level}`];
          return (
            <button
              key={t}
              onClick={() => pick(t, level)}
              aria-pressed={active}
              className={`rounded-2xl border p-4 text-left shadow-card transition hover:-translate-y-0.5 ${
                active ? "border-sage bg-sage-soft" : "border-line bg-surface"
              }`}
            >
              <div className="mb-1 text-2xl">{TYPE_EMOJI[t]}</div>
              <div className="text-sm font-bold text-ink">
                {t === "all" ? "Everything" : TASK_TYPE_LABELS[t]}
              </div>
              <div className="text-xs text-mute">
                {count} clues
                {best !== undefined && <span className="ml-1 text-sage">· best {best}/10</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Difficulty level">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => pick(type, l.id)}
            aria-pressed={level === l.id}
            className={`rounded-full px-5 py-2 text-sm font-bold shadow-card transition ${
              level === l.id
                ? "bg-sage text-white"
                : "border border-line bg-surface text-mute hover:text-ink"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <button
        onClick={startTest}
        disabled={poolSize === 0}
        className="font-display rounded-2xl bg-butter px-10 py-4 text-xl text-ink shadow-card transition enabled:hover:brightness-105 enabled:active:scale-[0.98] disabled:opacity-40"
      >
        Start test ({poolSize === 0 ? "no clues" : `${Math.min(10, poolSize)} questions`})
      </button>
    </motion.div>
  );
}

/* ---------- test runner ---------- */

function TestRunner() {
  const questions = useWorkbookStore((s) => s.questions);
  const index = useWorkbookStore((s) => s.index);
  const feedback = useWorkbookStore((s) => s.feedback);
  const answerCurrent = useWorkbookStore((s) => s.answerCurrent);
  const nextQuestion = useWorkbookStore((s) => s.nextQuestion);
  const quit = useWorkbookStore((s) => s.quit);
  const reduce = useMotionSafe();

  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const q = questions[index];

  // focus the input whenever a new question appears
  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(id);
  }, [index]);

  const advance = () => {
    setText(""); // clear synchronously — no effect race with fast typers
    nextQuestion();
  };

  if (!q) return null;
  const progress = (index / questions.length) * 100;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl pt-6"
    >
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={quit}
          className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-mute shadow-card transition hover:text-ink"
        >
          ← Quit test
        </button>
        <span className="text-sm font-bold text-mute">
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-line" aria-hidden>
        <motion.div
          className="h-full bg-sage"
          animate={{ width: `${progress}%` }}
          transition={{ duration: reduce ? 0 : 0.3 }}
        />
      </div>

      <div className="rounded-3xl border border-line bg-surface p-6 shadow-pop sm:p-10">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-sage">
          {q.categoryName}
        </p>
        <p className="mb-8 text-xl font-semibold leading-relaxed text-ink sm:text-2xl">{q.clue}</p>

        {!feedback ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (text.trim()) answerCurrent(text);
            }}
            className="flex flex-col gap-3"
          >
            <label htmlFor="wb-answer" className="sr-only">
              Your answer
            </label>
            <input
              id="wb-answer"
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your answer…"
              autoComplete="off"
              className="w-full rounded-xl border border-line bg-cream px-4 py-3 text-lg text-ink placeholder:text-mute/60"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="font-display rounded-xl bg-sage px-6 py-3 text-lg text-white transition enabled:hover:bg-sage-deep enabled:active:scale-[0.98] disabled:opacity-40"
            >
              Check
            </button>
          </form>
        ) : (
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
            role="status"
          >
            {feedback.correct ? (
              <p className="font-display mb-2 text-3xl text-sage">Correct!</p>
            ) : (
              <p className="font-display mb-2 text-3xl text-coral">Not quite</p>
            )}
            <p className="mb-6 text-lg text-ink">
              The answer is <strong className="text-butter-deep">{feedback.answer}</strong>
            </p>
            <button
              onClick={advance}
              autoFocus
              className="font-display rounded-xl bg-butter px-10 py-3 text-lg text-ink transition hover:brightness-105 active:scale-[0.98]"
            >
              {index + 1 < questions.length ? "Next question" : "See results"}
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ---------- results ---------- */

function TestResults() {
  const results = useWorkbookStore((s) => s.results);
  const type = useWorkbookStore((s) => s.type);
  const level = useWorkbookStore((s) => s.level);
  const bests = useWorkbookStore((s) => s.records.workbookBests);
  const startTest = useWorkbookStore((s) => s.startTest);
  const quit = useWorkbookStore((s) => s.quit);
  const navigate = useNavigate();
  const reduce = useMotionSafe();

  const correct = results.filter((r) => r.correct).length;
  const key = `${type}|${level}`;
  const isBest = correct > 0 && correct >= (bests[key] ?? 0);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-2xl pt-6"
    >
      <div className="mb-6 rounded-3xl border border-line bg-surface p-8 text-center shadow-pop">
        {isBest && (
          <p className="mb-2 inline-block rounded-full bg-sage-soft px-4 py-1 text-sm font-bold text-sage-deep">
            ★ New best for this set (this device)
          </p>
        )}
        <div className="font-display my-3 text-7xl text-sage-deep">
          {correct}
          <span className="text-3xl text-mute">/{results.length}</span>
        </div>
        <p className="mb-6 text-mute">
          {correct === results.length
            ? "Perfect score. Try a harder level!"
            : correct >= 7
              ? "Strong run — a little polish and it's perfect."
              : correct >= 4
                ? "Good practice. Check the misses below."
                : "Every miss is a new fact learned. Read the guides and try again!"}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={startTest}
            className="font-display flex-1 rounded-xl bg-sage px-6 py-3.5 text-lg text-white transition hover:bg-sage-deep active:scale-[0.98]"
          >
            Retake
          </button>
          <button
            onClick={quit}
            className="flex-1 rounded-xl border border-line px-6 py-3.5 font-semibold text-ink transition hover:bg-cream"
          >
            Pick another type
          </button>
          <button
            onClick={() => navigate("/guides")}
            className="flex-1 rounded-xl border border-line px-6 py-3.5 font-semibold text-ink transition hover:bg-cream"
          >
            Read the guides
          </button>
        </div>
      </div>

      <h2 className="font-display mb-3 text-lg text-ink">Review</h2>
      <div className="space-y-2">
        {results.map((r, i) => (
          <div
            key={i}
            className={`rounded-xl border px-4 py-3 text-sm shadow-card ${
              r.correct ? "border-sage/30 bg-sage-soft" : "border-coral/30 bg-surface"
            }`}
          >
            <p className="text-ink">{r.question.clue}</p>
            <p className="mt-1 text-mute">
              {r.correct ? "✓" : `✗ you said “${r.given}” ·`} answer:{" "}
              <strong className="text-butter-deep">{r.question.answer}</strong>
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
