/**
 * Steals on one shared phone: the team that picked the tile answers first;
 * after a miss the turn passes to the next team, in seating order, that
 * hasn't tried this clue yet. Null once every team has missed.
 */
export function nextAnswering(teamIds: number[], pickerId: number, tried: number[]): number | null {
  const start = teamIds.indexOf(pickerId);
  for (let k = 0; k < teamIds.length; k++) {
    const id = teamIds[(Math.max(start, 0) + k) % teamIds.length];
    if (!tried.includes(id)) return id;
  }
  return null;
}
