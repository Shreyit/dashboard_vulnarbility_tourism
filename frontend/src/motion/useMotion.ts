import { useContext } from "react";
import { MotionContext, type MotionState } from "./context";

/** The site's motion switch: OS `prefers-reduced-motion`, overridable by the header toggle. */
export function useMotion(): MotionState {
  return useContext(MotionContext);
}
