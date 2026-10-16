import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useTeamStore } from "../store/teamStore";
import type { GameDef } from "../data/games";
import { gameRoundCount, getRoundCategories, listPlayableGames } from "../lib/board";
import { useMotionSafe } from "../lib/useMotionSafe";
import { canPlayGame } from "../lib/access";
import { useEntitlement } from "../store/entitlementStore";

/** Exact clue count across all rounds (handles 4-wide boards and mixes). */
function gameClueCount(g: GameDef): number {
  if (g.daily) return 25; // one 5x5 board
  if (g.mix) return gameRoundCount(g) * 25; // randomly drawn 5x5 boards
  let n = 0;
  for (let r = 0; r < gameRoundCount(g); r++) {
    n += getRoundCategories(g, r).length * 5;
  }
  return n;
}

const LEVEL_STYLES: Record<string, string> = {
  "Warm-up": "bg-sage-soft text-sage-deep",
  Easy: "bg-butter-soft text-butter-deep",
  Medium: "bg-butter text-ink",
  Hard: "bg-coral/15 text-coral",
  Expert: "bg-skyblue/15 text-skyblue",
};

const SERIES_ORDER: GameDef["series"][] = ["Idiom Arenas", "Book Club", "Classic Vault"];
const SERIES_BLURBS: Record<GameDef["series"], string> = {
  "Idiom Arenas": "Pure idiom and saying training — the olympiad workout.",
  "Book Club": "Trivia and wordplay mixes for the whole table.",
  "Classic Vault": "The original collection, board by board.",
};

/** Jeopardy selection — the heart of the site: you choose what to play. */
export default function Sets() {
  const navigate = useNavigate();
  const selectSet = useTeamStore((s) => s.selectSet);
  const reduce = useMotionSafe();
  const fullClub = useEntitlement((s) => s.fullClub);
  const openSheet = useEntitlement((s) => s.openSheet);

  return (
    <main className="stage-bg min-h-dvh px-4 py-8">
      <div className="mx-auto max-w-4xl">

        <h1 className="font-display mb-1 text-3xl text-ink sm:text-4xl">Choose your jeopardy</h1>
        <p className="mb-8 text-mute">
          Every game is a list of boards — five categories, five clues each, values climbing with
          every round. Pick the flavor that fits the table.
        </p>

        {SERIES_ORDER.map((series) => {
          const games = listPlayableGames().filter((g) => g.series === series && !g.daily);
          if (games.length === 0) return null;
          return (
            <section key={series} className="mb-8">
              <h2 className="font-display text-lg text-sage-deep">{series}</h2>
              <p className="mb-3 text-sm text-mute">{SERIES_BLURBS[series]}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                {games.map((g, i) => {
                  const rounds = gameRoundCount(g);
                  const locked = !canPlayGame(g, fullClub);
                  return (
                    <motion.button
                      key={g.id}
                      aria-label={`Play ${g.name}${locked ? " — Full Club" : ""}`}
                      initial={reduce ? false : { opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: reduce ? 0 : 0.05 * i }}
                      onClick={() => {
                        if (locked) return openSheet();
                        selectSet(g.id);
                        navigate("/setup");
                      }}
                      className="group rounded-3xl border border-line bg-surface p-6 text-left shadow-card transition hover:-translate-y-1 hover:border-sage hover:shadow-pop"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-3xl">{g.emoji}</span>
                        <span className="flex items-center gap-2">
                          {locked && (
                            <span className="rounded-full bg-ink/5 px-3 py-1 text-xs font-bold text-mute">
                              🔒 Full Club
                            </span>
                          )}
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${LEVEL_STYLES[g.level]}`}
                          >
                            {g.level}
                          </span>
                        </span>
                      </div>
                      <h3 className="font-display mb-1 text-xl text-ink group-hover:text-sage-deep">
                        {g.name}
                      </h3>
                      <p className="mb-3 text-sm text-mute">{g.blurb}</p>
                      <p className="text-xs font-semibold text-sage">
                        {rounds} board{rounds === 1 ? "" : "s"}
                        {g.final ? " + final wager" : ""} · {gameClueCount(g)} clues
                      </p>
                      {g.bookRounds.length > 0 && (
                        <p className="mt-1 text-xs text-mute/80">
                          Round 1: {g.bookRounds[0].join(" · ")}
                        </p>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
