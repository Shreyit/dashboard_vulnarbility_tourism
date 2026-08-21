import { createContext } from "react";

export type MotionState = {
  /** True when animation should be suppressed -- either the OS asked, or the user toggled it off. */
  reduced: boolean;
  /** True when the value came from the in-page toggle rather than the OS setting. */
  overridden: boolean;
  toggle: () => void;
};

/** Lives apart from the provider component so Fast Refresh can keep working:
 *  a module that exports both a component and a non-component loses HMR. */
export const MotionContext = createContext<MotionState>({
  reduced: false,
  overridden: false,
  toggle: () => {},
});

export const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const MOTION_STORAGE_KEY = "nainital:motion";
