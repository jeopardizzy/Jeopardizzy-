import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import { dailyStamp } from "../lib/random";
import { useMotionSafe } from "../lib/useMotionSafe";
import Toggles from "../components/Toggles";

/**
 * Home: the Daily Jeopardy card, front and center. Sections live in the
 * sidebar (Guides / Workbook / Jeopardy).
 */
export default function Home() {
  const navigate = useNavigate();
  const selectSet = useTeamStore((s) => s.selectSet);
  const gamesPlayed = useTeamStore((s) => s.records.gamesPlayed);
  const bests = useTeamStore((s) => s.records.workbookBests);
  const reduce = useMotionSafe();

  const bestCount = Object.keys(bests ?? {}).length;

  return (
    <main className="stage-bg flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <div className="absolute right-4 top-4">
        <Toggles />
      </div>

      <motion.section
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 200, damping: 22 }}
        className="w-full max-w-2xl rounded-3xl border border-line bg-surface p-8 shadow-pop sm:p-12"
        aria-labelledby="daily-title"
      >
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.3em] text-sage">
          ☀️ {dailyStamp()}
        </p>
        <h1 id="daily-title" className="font-display mb-3 text-3xl text-ink sm:text-4xl">
          Daily Jeopardy
        </h1>
        <p className="mb-8 text-lg leading-relaxed text-mute">
          One quick board of 5 random categories, 25 clues, values 100–500. Same board all day on
          this device — bring the family to it tonight.
        </p>
        <button
          onClick={() => {
            selectSet("daily-jeopardy");
            navigate("/setup");
          }}
          className="font-display w-full rounded-2xl bg-sage px-8 py-5 text-2xl text-white shadow-card transition hover:bg-sage-deep active:scale-[0.98]"
        >
          Play today’s board →
        </button>
        {(gamesPlayed > 0 || bestCount > 0) && (
          <p className="mt-6 text-center text-sm text-mute">
            {gamesPlayed > 0 && `${gamesPlayed} team game${gamesPlayed === 1 ? "" : "s"} played`}
            {gamesPlayed > 0 && bestCount > 0 && " · "}
            {bestCount > 0 && `${bestCount} workbook record${bestCount === 1 ? "" : "s"}`}{" "}
            on this device
          </p>
        )}
      </motion.section>

      <motion.p
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 0.4 }}
        className="mt-8 max-w-md text-center text-sm text-mute"
      >
        More ways to play:{" "}
        <button onClick={() => navigate("/sets")} className="font-semibold text-sage-deep underline-offset-4 hover:underline">
          game sets
        </button>{" "}
        ·{" "}
        <button onClick={() => navigate("/workbook")} className="font-semibold text-sage-deep underline-offset-4 hover:underline">
          practice workbook
        </button>{" "}
        ·{" "}
        <button onClick={() => navigate("/guides")} className="font-semibold text-sage-deep underline-offset-4 hover:underline">
          guides
        </button>
      </motion.p>
    </main>
  );
}
