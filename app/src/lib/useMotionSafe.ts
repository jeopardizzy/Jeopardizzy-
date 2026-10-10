import { useTeamStore } from "../store/teamStore";
import { useReducedMotion } from "motion/react";

/** True when animations should be minimal: user setting OR OS preference. */
export function useMotionSafe(): boolean {
  const prefersReduced = useReducedMotion();
  const reduceMotion = useTeamStore((s) => s.settings.reduceMotion);
  return Boolean(prefersReduced || reduceMotion);
}
