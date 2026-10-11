/** Per-tile outcome recorded as the game is played (team mode). */
export interface TileOutcome {
  categoryName: string;
  value: number;
  /** true = a team was awarded the points; false = "Nobody" got it */
  awarded: boolean;
}

export interface CategoryStat {
  played: number;
  missed: number;
}

/** Aggregate tile outcomes into per-category played/missed counts. */
export function aggregateCategoryStats(outcomes: TileOutcome[]): Record<string, CategoryStat> {
  const out: Record<string, CategoryStat> = {};
  for (const o of outcomes) {
    const s = (out[o.categoryName] ??= { played: 0, missed: 0 });
    s.played += 1;
    if (!o.awarded) s.missed += 1;
  }
  return out;
}

/** Merge a finished game's stats into the all-time record. */
export function mergeCategoryStats(
  allTime: Record<string, CategoryStat>,
  gameStats: Record<string, CategoryStat>,
): Record<string, CategoryStat> {
  const out: Record<string, CategoryStat> = { ...allTime };
  for (const [name, s] of Object.entries(gameStats)) {
    const cur = (out[name] ??= { played: 0, missed: 0 });
    cur.played += s.played;
    cur.missed += s.missed;
  }
  return out;
}

/**
 * Weakest categories first: highest miss count, then highest miss rate,
 * then most played (as tiebreak). Categories with zero misses are excluded.
 */
export function weakestCategories(
  stats: Record<string, CategoryStat>,
  limit = 5,
): { name: string; played: number; missed: number }[] {
  return Object.entries(stats)
    .filter(([, s]) => s.missed > 0)
    .sort((a, b) => b[1].missed - a[1].missed || b[1].missed / b[1].played - a[1].missed / a[1].played || b[1].played - a[1].played)
    .slice(0, limit)
    .map(([name, s]) => ({ name, ...s }));
}
