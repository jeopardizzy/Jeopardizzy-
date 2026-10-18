/**
 * Trivia Night scoring rules for the optional game modes.
 *
 * Wrong answers cost points: a miss checked on the clue card subtracts the
 * tile value, once per team per clue. If the host then awards that team the
 * tile anyway (the checker was wrong), the penalty is refunded with the award.
 */

/** Points to subtract for a miss; 0 when the mode is off or the team was already charged. */
export function missPenalty(enabled: boolean, value: number, alreadyCharged: boolean): number {
  return enabled && !alreadyCharged ? value : 0;
}

/** Points for the team the host awards a tile to, including any refunded penalty. */
export function awardPoints(value: number, wasCharged: boolean): number {
  return wasCharged ? value * 2 : value;
}
