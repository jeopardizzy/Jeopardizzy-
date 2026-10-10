import { motion } from "motion/react";
import { useTeamStore } from "../store/teamStore";
import { useMotionSafe } from "../lib/useMotionSafe";

/** The 5x5 clue board (team mode). */
export default function BoardGrid() {
  const board = useTeamStore((s) => s.board);
  const played = useTeamStore((s) => s.playedTileIds);
  const openTile = useTeamStore((s) => s.openTile);
  const roundIndex = useTeamStore((s) => s.roundIndex);
  const reduce = useMotionSafe();

  if (!board) return null;

  return (
    <div
      className="grid grid-cols-5 gap-1.5 sm:gap-2.5"
      role="grid"
      aria-label={`Round ${roundIndex + 1} clue board`}
    >
      {board.categories.map((c, i) => (
        <motion.div
          key={`${roundIndex}-${c.id}`}
          role="columnheader"
          initial={reduce ? false : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.05 * i, duration: 0.3 }}
          className="flex min-h-14 items-center justify-center rounded-xl border border-line bg-sage-soft px-1 py-2 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-sage-deep sm:min-h-20 sm:text-sm"
        >
          {c.name}
        </motion.div>
      ))}

      {[0, 1, 2, 3, 4].map((row) =>
        board.categories.map((_, col) => {
          const tile = board.tiles[col * 5 + row];
          const isPlayed = played.includes(tile.id);
          return (
            <motion.button
              key={tile.id}
              role="gridcell"
              disabled={isPlayed}
              onClick={() => openTile(tile.id)}
              initial={reduce ? false : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: reduce ? 0 : 0.04 * (col + row),
                type: "spring",
                stiffness: 300,
                damping: 22,
              }}
              aria-label={
                isPlayed
                  ? `${tile.categoryName}, ${tile.value} points, already played`
                  : `${tile.categoryName} for ${tile.value} points`
              }
              className={`tile font-display flex h-14 items-center justify-center rounded-xl text-lg text-butter-deep transition-colors sm:h-20 sm:text-2xl ${
                isPlayed ? "opacity-30" : ""
              }`}
            >
              {isPlayed ? "·" : tile.value}
            </motion.button>
          );
        }),
      )}
    </div>
  );
}
