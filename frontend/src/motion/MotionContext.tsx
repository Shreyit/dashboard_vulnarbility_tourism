import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "../lib/gsap";
import { MotionContext, MOTION_QUERY, MOTION_STORAGE_KEY, type MotionState } from "./context";

function readInitial(): { reduced: boolean; overridden: boolean } {
  const osPrefersReduced = window.matchMedia(MOTION_QUERY).matches;
  try {
    const stored = window.localStorage.getItem(MOTION_STORAGE_KEY);
    if (stored === "full") return { reduced: false, overridden: true };
    if (stored === "reduced") return { reduced: true, overridden: true };
  } catch {
    // private-mode / storage-disabled browsers: fall through to the OS setting
  }
  return { reduced: osPrefersReduced, overridden: false };
}

/**
 * Owns the site's one motion switch.
 *
 * GSAP tweens don't obey the CSS `prefers-reduced-motion` block in global.css,
 * so every component that drives gsap directly reads this instead. It also
 * mirrors the state onto `<html data-motion>` so pure-CSS animations (the
 * prayer flags, the boat bob, the stepped loader) follow the same switch --
 * including the *user's* override, which a media query alone cannot see.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(readInitial);

  // The OS setting still wins until the user touches the in-page toggle.
  useEffect(() => {
    const mql = window.matchMedia(MOTION_QUERY);
    const onChange = () => {
      setState((prev) => (prev.overridden ? prev : { reduced: mql.matches, overridden: false }));
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.motion = state.reduced ? "reduced" : "full";
    // lagSmoothing keeps a long task from teleporting a scrubbed timeline;
    // turning motion off also means we want no catch-up jumps at all.
    gsap.ticker.lagSmoothing(state.reduced ? 0 : 500, 33);
    // Layout doesn't change, but scrubbed triggers created under the other
    // setting need their progress re-evaluated.
    ScrollTrigger.refresh();
  }, [state.reduced]);

  const toggle = useCallback(() => {
    setState((prev) => {
      const next = { reduced: !prev.reduced, overridden: true };
      try {
        window.localStorage.setItem(MOTION_STORAGE_KEY, next.reduced ? "reduced" : "full");
      } catch {
        // non-fatal: the toggle still works for this session
      }
      return next;
    });
  }, []);

  const value = useMemo<MotionState>(
    () => ({ reduced: state.reduced, overridden: state.overridden, toggle }),
    [state.reduced, state.overridden, toggle],
  );

  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
