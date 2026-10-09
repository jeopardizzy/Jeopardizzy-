import { motion } from "motion/react";
import { useGameStore } from "../store/gameStore";
import { useMotionSafe } from "../lib/useMotionSafe";

/** The 5x5 clue board. */
export default function BoardGrid() {
  const board = useGameStore((s) => s.board);
  const played = useGameStore((s) => s.playedTileIds);
  const openClue = useGameStore((s) => s.openClue);
  const round = useGameStore((s) => s.round);
  const reduce = useMotionSafe();

  if (!board) return null;

  return (
    <div
      className="grid grid-cols-5 gap-1.5 sm:gap-2.5"
      role="grid"
      aria-label={`Round ${round} clue board`}
    >
      {board.categories.map((c, i) => (
        <motion.div
          key={`${round}-${c.id}`}
          role="columnheader"
          initial={reduce ? false : { opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.05 * i, duration: 0.3 }}
          className="flex min-h-14 items-center justify-center rounded-lg bg-ink-2 px-1 py-2 text-center text-[10px] font-bold uppercase leading-tight tracking-wide text-cream sm:min-h-20 sm:text-sm"
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
              onClick={() => openClue(tile.id)}
              initial={reduce ? false : { opacity: 0, scale: 0.8, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
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
              className={`tile font-display flex h-14 items-center justify-center rounded-lg text-lg text-gold transition-colors sm:h-20 sm:text-2xl ${
                isPlayed ? "opacity-25" : ""
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
