import { useRef } from "react";
import { useLocation } from "react-router-dom";
import { gsap, useGSAP, ScrollTrigger } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./RouteTransition.css";

const COLUMNS = 16;

/**
 * The wipe between dashboard views.
 *
 * Hard-edged columns sweep down over the outgoing view and off the bottom of
 * the incoming one -- the same "pixel / stepped" motion vocabulary as
 * PixelTransition and the stepped loading bar, rather than a soft cross-fade.
 *
 * It also does the two housekeeping jobs a client-side route change needs and
 * react-router does not do for you: reset scroll position, and tell
 * ScrollTrigger to re-measure once the new view has laid out. Without the
 * refresh, every scroll-driven section on the incoming page keeps the previous
 * page's start/end offsets.
 */
export default function RouteTransition() {
  const { pathname } = useLocation();
  const overlayRef = useRef<HTMLDivElement>(null);
  // Seeded with the mount-time path. A "have I run before?" boolean cannot be
  // used here: React StrictMode double-invokes mount effects in development,
  // so the second invocation would see the flag already flipped and wipe the
  // screen on first load. Comparing the value itself is immune to that.
  const shownPath = useRef(pathname);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const overlay = overlayRef.current;
      if (!overlay) return;

      // Nothing to wipe on the very first paint -- there is no outgoing view.
      if (pathname === shownPath.current) return;
      shownPath.current = pathname;

      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });

      if (reduced) {
        ScrollTrigger.refresh();
        return;
      }

      const columns = gsap.utils.toArray<HTMLElement>(".route-wipe-col", overlay);
      const tl = gsap.timeline({
        onStart: () => {
          overlay.style.pointerEvents = "auto";
        },
        onComplete: () => {
          overlay.style.pointerEvents = "none";
          // The incoming view is laid out by now; re-measure every trigger on it.
          ScrollTrigger.refresh();
        },
      });

      tl.fromTo(
        columns,
        { scaleY: 0, transformOrigin: "center top" },
        { scaleY: 1, duration: 0.34, ease: "power3.in", stagger: { each: 0.018, from: "start" } },
      ).to(
        columns,
        {
          scaleY: 0,
          transformOrigin: "center bottom",
          duration: 0.34,
          ease: "power3.out",
          stagger: { each: 0.018, from: "start" },
        },
        ">-0.04",
      );
    },
    { dependencies: [pathname, reduced] },
  );

  return (
    <div className="route-wipe" ref={overlayRef} aria-hidden="true">
      {Array.from({ length: COLUMNS }, (_, i) => (
        <span className="route-wipe-col" key={i} />
      ))}
    </div>
  );
}
