import { useGameStore } from "../store/gameStore";
import { useReducedMotion } from "motion/react";

/** True when animations should be minimal: user setting OR OS preference. */
export function useMotionSafe(): boolean {
  const prefersReduced = useReducedMotion();
  const reduceMotion = useGameStore((s) => s.settings.reduceMotion);
  return Boolean(prefersReduced || reduceMotion);
}
