import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GUIDES } from "../data/guides";
import { tasksByGuide } from "../data/taskGuides";
import { builderCategories } from "../lib/board";
import { quizData } from "../data/quizData";
import { TASK_TYPE_LABELS, type TaskType } from "../data/categoryTypes";
import { useWorkbookStore } from "../store/workbookStore";
import { useMotionSafe } from "../lib/useMotionSafe";
import Toggles from "../components/Toggles";

/** Guides: how every puzzle type works, with examples and strategy tips. */
export default function Guides() {
  const navigate = useNavigate();
  const reduce = useMotionSafe();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const pick = useWorkbookStore((s) => s.pick);

  const [query, setQuery] = useState("");
  // every task in the app, under the guide that explains it
  const tasks = useMemo(
    () => tasksByGuide([...builderCategories().map((c) => c.name), ...quizData.categories.map((c) => c.name)]),
    [],
  );
  const q = query.trim().toLowerCase();
  const matches = (g: (typeof GUIDES)[number]) =>
    !q || g.name.toLowerCase().includes(q) || (tasks.get(g.id) ?? []).some((t) => t.toLowerCase().includes(q));
  const gameGuides = GUIDES.filter((g) => g.type !== "general" && matches(g));
  const generalGuides = GUIDES.filter((g) => g.type === "general");

  const practice = (type: string) => {
    if (type in TASK_TYPE_LABELS) {
      pick(type as TaskType, "all");
      navigate("/workbook");
    }
  };

  const renderCard = (g: (typeof GUIDES)[number], idx: number) => {
    // a search that finds one guide opens it
    const open = openIdx === idx || (openIdx === null && !!q && gameGuides.length === 1 && idx === 0);
    const practicable = g.type in TASK_TYPE_LABELS;
    return (
      <motion.div
        key={`${g.name}-${idx}`}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : Math.min(idx * 0.04, 0.4) }}
        className="overflow-hidden rounded-2xl border border-line bg-surface shadow-card"
      >
        <button
          onClick={() => setOpenIdx(open ? -1 : idx)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-cream"
        >
          <div>
            <span className="font-display text-lg text-ink">{g.name}</span>
            {g.type in TASK_TYPE_LABELS && (
              <span className="ml-2 rounded-full bg-sage-soft px-2.5 py-0.5 text-xs font-bold text-sage-deep">
                {TASK_TYPE_LABELS[g.type as TaskType]}
              </span>
            )}
          </div>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: reduce ? 0 : 0.2 }}
            className="text-mute"
            aria-hidden
          >
            ▾
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduce ? 0 : 0.25 }}
            >
              <div className="border-t border-line px-5 py-4">
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-mute">
                  {g.skills}
                </p>
                <p className="mb-3 leading-relaxed text-ink">{g.how}</p>

                <div
                  className="mb-4 rounded-xl bg-butter-soft px-4 py-3 text-sm leading-relaxed text-ink"
                  // Static bundled guide content (trusted, authored for this app)
                  dangerouslySetInnerHTML={{ __html: g.example }}
                />

                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-mute">
                  Strategy tips
                </h3>
                <ul className="mb-4 list-inside list-disc space-y-1 text-sm text-ink/85">
                  {g.tips.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>

                {(tasks.get(g.id)?.length ?? 0) > 0 && (
                  <>
                    <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-mute">Tasks</h3>
                    <ul className="mb-4 flex flex-wrap gap-1.5" aria-label={`Tasks for ${g.name}`}>
                      {tasks.get(g.id)!.map((t) => (
                        <li key={t} className="rounded-full border border-line bg-cream px-2.5 py-0.5 text-xs text-ink">
                          {t}
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {practicable && (
                  <button
                    onClick={() => practice(g.type)}
                    className="rounded-full bg-sage px-5 py-2 text-sm font-bold text-white transition hover:bg-sage-deep active:scale-[0.98]"
                  >
                    Practice this type →
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <main className="stage-bg min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-end">
          <Toggles />
        </div>

        <h1 className="font-display mb-1 text-3xl text-ink sm:text-4xl">Guides</h1>
        <p className="mb-6 text-mute">
          Every puzzle type explained: the rules, a worked example, and the strategies that make
          them easier. Every task in the app is listed under its guide.
        </p>

        <label htmlFor="guide-search" className="sr-only">
          Find a task
        </label>
        <input
          id="guide-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpenIdx(null);
          }}
          placeholder="Find a task, e.g. Bonus Mix or Sheesh…"
          className="mb-6 w-full rounded-xl border border-line bg-surface px-4 py-2.5 text-ink"
        />

        <h2 className="font-display mb-3 text-lg text-sage-deep">Puzzle types</h2>
        <div className="mb-8 space-y-3">
          {gameGuides.map((g, i) => renderCard(g, i))}
          {gameGuides.length === 0 && <p className="text-mute">No task by that name.</p>}
        </div>

        {generalGuides.length > 0 && !q && (
          <>
            <h2 className="font-display mb-3 text-lg text-sage-deep">General approach</h2>
            <div className="space-y-3">
              {generalGuides.map((g, i) => renderCard(g, gameGuides.length + i))}
            </div>
          </>
        )}

        <p className="mt-10 text-center text-xs text-mute/70">
          Quizzical Club {__APP_VERSION__} · build {__APP_BUILD__} · {__APP_COMMIT__}
        </p>
      </div>
    </main>
  );
}
