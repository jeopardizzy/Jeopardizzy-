import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { buildBackup, downloadBackup, parseBackup } from "../lib/backup";
import { loadRecords, loadSettings, saveRecords, saveSettings } from "../lib/saves";
import {
  useWorkbookStore,
  workbookPool,
  drillPool,
  bestKey,
  TEST_LENGTHS,
  type Level,
} from "../store/workbookStore";
import {
  TASK_TYPE_LABELS,
  type TaskType,
} from "../data/categoryTypes";
import { useMotionSafe } from "../lib/useMotionSafe";
import { getVerdict } from "../lib/verdict";
import Toggles from "../components/Toggles";
import SpokenAnswer from "../components/SpokenAnswer";
import { canUseLevel, FREE_WORKBOOK_LEVEL } from "../lib/access";
import { useEntitlement } from "../store/entitlementStore";

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
  const type = useWorkbookStore((s) => s.type);
  const level = useWorkbookStore((s) => s.level);
  const questionCount = useWorkbookStore((s) => s.questionCount);
  const drillCategories = useWorkbookStore((s) => s.drillCategories);
  const setQuestionCount = useWorkbookStore((s) => s.setQuestionCount);
  const clearDrill = useWorkbookStore((s) => s.clearDrill);
  const pick = useWorkbookStore((s) => s.pick);
  const startTest = useWorkbookStore((s) => s.startTest);
  const bests = useWorkbookStore((s) => s.records.workbookBests);
  const reduce = useMotionSafe();
  const fullClub = useEntitlement((s) => s.fullClub);
  const openSheet = useEntitlement((s) => s.openSheet);

  // free tier: Easy tests only, no drills (also covers a refund mid-session)
  useEffect(() => {
    if (fullClub) return;
    if (drillCategories) clearDrill();
    if (!canUseLevel(level, false)) pick(type, FREE_WORKBOOK_LEVEL);
  }, [fullClub, drillCategories, level, type, pick, clearDrill]);

  const types: (TaskType | "all")[] = [
    "all",
    ...(Object.keys(TASK_TYPE_LABELS) as TaskType[]),
  ];

  const poolSize = drillCategories
    ? drillPool(drillCategories).length
    : workbookPool(type, level).length;

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0 }}
    >
      <div className="mb-6 flex items-center justify-end">
        <Toggles />
      </div>

      <h1 className="font-display mb-1 text-3xl text-ink sm:text-4xl">Workbook</h1>
      <p className="mb-6 text-mute">
        Pick a puzzle type and a level — you get a 10-question test with instant feedback. Best
        scores are kept on this device.
      </p>

      {drillCategories && (
        <div className="mb-6 rounded-2xl border border-sage bg-sage-soft p-4 shadow-card">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="font-display text-sm uppercase tracking-wider text-sage-deep">
              🎯 Drill mode — from the podium's training notes
            </p>
            <button
              onClick={clearDrill}
              className="rounded-lg px-2 py-1 text-sm font-semibold text-mute transition hover:text-ink"
            >
              ✕ Cancel
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {drillCategories.map((c) => (
              <span
                key={c}
                className="rounded-full bg-surface px-3 py-1 text-xs font-bold text-sage-deep"
              >
                {c}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-mute">
            {poolSize} clues from these categories (boards included). Type/level filters don't apply
            in drill mode.
          </p>
        </div>
      )}

      <div
        className={`mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${
          drillCategories ? "pointer-events-none opacity-40" : ""
        }`}
      >
        {types.map((t) => {
          const count = workbookPool(t, "all").length;
          const active = type === t;
          const best = bests[bestKey(t, level, questionCount)];
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
                {best !== undefined && (
                  <span className="ml-1 text-sage">· best {best}/{questionCount}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className={`mb-4 flex flex-wrap gap-2 ${drillCategories ? "pointer-events-none opacity-40" : ""}`}
        role="group"
        aria-label="Difficulty level"
      >
        {LEVELS.map((l) => {
          const locked = !canUseLevel(l.id, fullClub);
          return (
            <button
              key={l.id}
              onClick={() => (locked ? openSheet() : pick(type, l.id))}
              aria-pressed={level === l.id}
              aria-label={locked ? `${l.label} — Full Club` : undefined}
              className={`rounded-full px-5 py-2 text-sm font-bold shadow-card transition ${
                level === l.id
                  ? "bg-sage text-white"
                  : "border border-line bg-surface text-mute hover:text-ink"
              }`}
            >
              {locked && <span aria-hidden>🔒 </span>}
              {l.label}
            </button>
          );
        })}
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label="Test length">
        <span className="mr-1 text-sm font-semibold text-mute">Questions:</span>
        {TEST_LENGTHS.map((n) => {
          const tooLong = poolSize < n;
          const active = questionCount === n;
          return (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              disabled={tooLong}
              aria-pressed={active}
              title={tooLong ? `Only ${poolSize} clues in this pool` : `${n} questions`}
              className={`rounded-full px-5 py-2 text-sm font-bold shadow-card transition ${
                active
                  ? "bg-butter text-ink"
                  : tooLong
                    ? "cursor-not-allowed border border-line bg-surface text-mute/40"
                    : "border border-line bg-surface text-mute hover:text-ink"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>

      <button
        onClick={startTest}
        disabled={poolSize === 0}
        className="rounded-2xl bg-butter px-10 py-4 text-xl font-bold text-ink shadow-card transition enabled:hover:brightness-105 enabled:active:scale-[0.98] disabled:opacity-40"
      >
        {drillCategories ? "Start drill test" : "Start test"} (
        {poolSize === 0 ? "no clues" : `${Math.min(questionCount, poolSize)} questions`})
      </button>

      <FullClubCard />
      <ProgressBackup />
    </motion.div>
  );
}

/* ---------- test runner ---------- */

/** Wrong answers to listen for alongside the right one: same category first. */
function otherAnswers(questions: { categoryName: string; answer: string }[], index: number): string[] {
  const q = questions[index];
  const rest = questions.filter((_, i) => i !== index);
  return [...rest.filter((o) => o.categoryName === q.categoryName), ...rest.filter((o) => o.categoryName !== q.categoryName)].map(
    (o) => o.answer,
  );
}

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
            <SpokenAnswer
              answer={q.answer}
              others={otherAnswers(questions, index)}
              onHeard={(heard) => {
                setText(heard);
                answerCurrent(heard);
              }}
              onType={() => inputRef.current?.focus()}
            />
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
  const total = results.length;
  const percent = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isDrill = useWorkbookStore((s) => s.drillCategories !== null);
  const key = bestKey(type, level, total);
  const isBest = !isDrill && correct > 0 && correct >= (bests[key] ?? 0);

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
          <span className="text-3xl text-mute">/{total}</span>
        </div>
        <p className="mb-1 text-sm font-bold uppercase tracking-wider text-butter-deep">
          {percent}% correct
        </p>
        <p className="mb-6 text-lg font-semibold text-ink" data-testid="verdict">
          {getVerdict(percent)}
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

/* ---------- backup / restore ---------- */

/** Full Club status, with Restore always reachable (store requirement). */
function FullClubCard() {
  const fullClub = useEntitlement((s) => s.fullClub);
  const platform = useEntitlement((s) => s.platform);
  const openSheet = useEntitlement((s) => s.openSheet);
  if (fullClub) {
    return (
      <p className="mt-10 rounded-2xl border border-line bg-surface px-5 py-4 text-sm font-semibold text-sage-deep shadow-card">
        🏆 Full Club unlocked — every board and level is yours.
      </p>
    );
  }
  return (
    <div className="mt-10 rounded-2xl border border-line bg-surface p-5 shadow-card">
      <h2 className="font-display mb-1 text-lg text-ink">🏆 Full Club</h2>
      <p className="mb-3 text-sm text-mute">
        All 18 team games, every workbook level and the training-note drills. One-time purchase.
      </p>
      <button
        onClick={openSheet}
        className="rounded-xl bg-sage px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sage-deep"
      >
        {platform === "native" ? "Unlock or restore" : "See Full Club"}
      </button>
    </div>
  );
}

function ProgressBackup() {
  const [msg, setMsg] = useState<string | null>(null);
  const [msgKind, setMsgKind] = useState<"ok" | "err">("ok");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (kind: "ok" | "err", text: string) => {
    setMsgKind(kind);
    setMsg(text);
  };

  const doExport = () => {
    downloadBackup("quizzical-club-backup.json", buildBackup(loadRecords(), loadSettings()));
    flash("ok", "Backup downloaded — keep it to move progress to another device.");
  };

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildBackup(loadRecords(), loadSettings()));
      flash("ok", "Backup copied to clipboard.");
    } catch {
      flash("err", "Clipboard unavailable — use the file download instead.");
    }
  };

  const doImport = (text: string) => {
    const parsed = parseBackup(text);
    if (!parsed) {
      flash("err", "That file doesn't look like a Quizzical Club backup — nothing was restored.");
      return;
    }
    saveRecords(parsed.records);
    saveSettings(parsed.settings);
    flash("ok", "Progress restored. Reloading…");
    window.setTimeout(() => window.location.reload(), 800);
  };

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    f.text().then(doImport);
    e.target.value = "";
  };

  return (
    <section className="mt-10 rounded-2xl border border-line bg-surface p-5 shadow-card" aria-label="Your progress">
      <h2 className="font-display mb-1 text-lg text-sage-deep">Your progress</h2>
      <p className="mb-4 text-sm text-mute">
        Records and settings live only on this device. Back them up to move to another phone or
        browser.
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={doExport}
          className="rounded-xl bg-sage px-5 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-sage-deep active:scale-[0.98]"
        >
          Back up (file)
        </button>
        <button
          onClick={doCopy}
          className="rounded-xl border border-line bg-cream px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-butter-soft active:scale-[0.98]"
        >
          Copy to clipboard
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-xl border border-line bg-cream px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-butter-soft active:scale-[0.98]"
        >
          Restore from file
        </button>
        <button
          onClick={() => setPasteOpen((v) => !v)}
          aria-expanded={pasteOpen}
          className="rounded-xl border border-line bg-cream px-5 py-2.5 text-sm font-bold text-ink transition hover:bg-butter-soft active:scale-[0.98]"
        >
          Paste backup text
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={onFile}
          aria-label="Backup file"
        />
      </div>
      {pasteOpen && (
        <div className="mt-3">
          <label htmlFor="backup-paste" className="sr-only">
            Paste backup JSON
          </label>
          <textarea
            id="backup-paste"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={4}
            placeholder='{"kind":"quizzical-club-backup", ...}'
            className="w-full rounded-xl border border-line bg-cream px-3 py-2 font-mono text-xs text-ink placeholder:text-mute/60"
          />
          <button
            onClick={() => doImport(pasteText)}
            disabled={!pasteText.trim()}
            className="mt-2 rounded-xl bg-sage px-5 py-2 text-sm font-bold text-white transition enabled:hover:bg-sage-deep disabled:opacity-40"
          >
            Restore pasted backup
          </button>
        </div>
      )}
      {msg && (
        <p
          role="status"
          className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${
            msgKind === "ok" ? "bg-sage-soft text-sage-deep" : "bg-coral/15 text-coral"
          }`}
        >
          {msg}
        </p>
      )}
    </section>
  );
}
