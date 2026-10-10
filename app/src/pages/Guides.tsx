import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GUIDES } from "../data/guides";
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

  const gameGuides = GUIDES.filter((g) => g.type !== "general");
  const generalGuides = GUIDES.filter((g) => g.type === "general");

  const practice = (type: string) => {
    if (type in TASK_TYPE_LABELS) {
      pick(type as TaskType, "all");
      navigate("/workbook");
    }
  };

  const renderCard = (g: (typeof GUIDES)[number], idx: number) => {
    const open = openIdx === idx;
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
          onClick={() => setOpenIdx(open ? null : idx)}
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
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm font-semibold text-mute shadow-card transition hover:text-ink"
          >
            ← Home
          </button>
          <Toggles />
        </div>

        <h1 className="font-display mb-1 text-3xl text-ink sm:text-4xl">Guides</h1>
        <p className="mb-6 text-mute">
          Every puzzle type explained: the rules, a worked example, and the strategies that make
          them easier.
        </p>

        <h2 className="font-display mb-3 text-lg text-sage-deep">Puzzle types</h2>
        <div className="mb-8 space-y-3">{gameGuides.map((g, i) => renderCard(g, i))}</div>

        {generalGuides.length > 0 && (
          <>
            <h2 className="font-display mb-3 text-lg text-sage-deep">General approach</h2>
            <div className="space-y-3">
              {generalGuides.map((g, i) => renderCard(g, gameGuides.length + i))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
