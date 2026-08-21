import { useCallback, useEffect, useRef } from "react";
import { gsap } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";

export type MagneticOptions = {
  /** How far the element travels toward the pointer, as a fraction of the offset. */
  strength?: number;
  /** Pull starts this many px outside the element's own box. */
  radius?: number;
  /** Cap on displacement, px. Keeps big elements from sliding off their own row. */
  maxOffset?: number;
  /** Multiplier applied to the inner layer, for a bit of parallax depth. */
  innerStrength?: number;
  disabled?: boolean;
};

const COARSE_POINTER = "(hover: none), (pointer: coarse)";

/**
 * Pointer-attraction ("magnetic") behaviour for a button.
 *
 * The element eases toward the cursor while the cursor is inside an invisible
 * proximity ring around it, and snaps back with a single overshoot on exit --
 * the entry is a soft follow, the exit is a released spring, which is what
 * makes it read as magnetism rather than as drag.
 *
 * Two implementation notes that matter:
 *  - Position is driven by `gsap.quickTo`, which reuses one tween per property
 *    instead of allocating a new tween on every pointermove.
 *  - The element's rect is cached and only re-measured when scroll or resize
 *    marks it stale, so a pointermove never forces a synchronous layout.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(options: MagneticOptions = {}) {
  const {
    strength = 0.38,
    radius = 90,
    maxOffset = 34,
    innerStrength = 0.45,
    disabled = false,
  } = options;

  const ref = useRef<T>(null);
  const innerRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const engagedRef = useRef(false);

  const off = disabled || reduced;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Touch/pen devices have no hover to attract with; leave the element alone.
    if (window.matchMedia(COARSE_POINTER).matches) return;

    if (off) {
      gsap.set([el, innerRef.current].filter(Boolean) as HTMLElement[], { x: 0, y: 0 });
      return;
    }

    const xTo = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3.out" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3.out" });
    const inner = innerRef.current;
    const ixTo = inner ? gsap.quickTo(inner, "x", { duration: 0.65, ease: "power3.out" }) : null;
    const iyTo = inner ? gsap.quickTo(inner, "y", { duration: 0.65, ease: "power3.out" }) : null;

    // Cached geometry. Measured lazily, invalidated by anything that can move
    // the element, so pointermove stays a pure read of already-known numbers.
    let rect: DOMRect | null = null;
    const invalidate = () => {
      rect = null;
    };

    const release = () => {
      if (!engagedRef.current) return;
      engagedRef.current = false;
      el.classList.remove("is-magnetised");
      // The exit is deliberately a different curve from the entry: one clean
      // overshoot past centre, then settle. That release is the whole effect.
      gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.36)", overwrite: "auto" });
      if (inner) {
        gsap.to(inner, { x: 0, y: 0, duration: 1.1, ease: "elastic.out(1, 0.3)", overwrite: "auto" });
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      if (!rect) rect = el.getBoundingClientRect();

      // Distance from the pointer to the element's box (0 when inside it),
      // so the ring hugs the element's shape instead of being a circle around
      // its centre -- wide buttons otherwise attract oddly at their ends.
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const gapX = Math.max(0, Math.abs(dx) - rect.width / 2);
      const gapY = Math.max(0, Math.abs(dy) - rect.height / 2);
      const distance = Math.hypot(gapX, gapY);

      if (distance > radius) {
        release();
        return;
      }

      // Falloff: full pull inside the box, easing to nothing at the ring's edge.
      const falloff = 1 - distance / radius;
      const pull = strength * falloff * falloff;
      const clamp = gsap.utils.clamp(-maxOffset, maxOffset);
      const tx = clamp(dx * pull);
      const ty = clamp(dy * pull);

      if (!engagedRef.current) {
        engagedRef.current = true;
        el.classList.add("is-magnetised");
      }

      xTo(tx);
      yTo(ty);
      ixTo?.(tx * innerStrength);
      iyTo?.(ty * innerStrength);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", invalidate, { passive: true });
    window.addEventListener("resize", invalidate);
    // A pointer leaving the document entirely never produces another move event.
    document.addEventListener("pointerleave", release);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", invalidate);
      window.removeEventListener("resize", invalidate);
      document.removeEventListener("pointerleave", release);
      engagedRef.current = false;
      el.classList.remove("is-magnetised");
      gsap.killTweensOf(el);
      gsap.set(el, { x: 0, y: 0 });
      if (inner) {
        gsap.killTweensOf(inner);
        gsap.set(inner, { x: 0, y: 0 });
      }
    };
  }, [off, strength, radius, maxOffset, innerStrength]);

  /** Fire on click for a short mechanical press, independent of the magnetic pull. */
  const press = useCallback(() => {
    const el = ref.current;
    if (!el || off) return;
    gsap.fromTo(
      el,
      { scale: 0.94 },
      { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.4)", overwrite: "auto" },
    );
  }, [off]);

  return { ref, innerRef, press };
}
