import { useMotion } from "../motion/useMotion";

/**
 * True when the user has asked for reduced motion -- either through the OS
 * (`prefers-reduced-motion: reduce`) or through the header's motion toggle.
 *
 * gsap tweens don't respect the CSS `prefers-reduced-motion` block in
 * global.css, so call sites driving gsap directly must check this and use
 * `gsap.set` instead of `.to`/`.from`.
 */
export function useReducedMotion(): boolean {
  return useMotion().reduced;
}
