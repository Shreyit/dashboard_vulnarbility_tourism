import { useRef } from "react";
import { gsap, useGSAP, EASE } from "../../lib/gsap";
import { useMotion } from "../../motion/useMotion";
import { useMagnetic } from "./useMagnetic";
import "./Magnetic.css";

/**
 * The site's motion switch, and the reference implementation of the magnetic
 * interaction reused elsewhere on the page.
 *
 * Three animations are layered on it, deliberately kept separate so they can't
 * corrupt each other's endpoints:
 *  1. the magnetic pull/release, driven by `useMagnetic` on the button's
 *     `transform` and, at a lower rate, on the track's (parallax depth);
 *  2. a paused state timeline scrubbed between "motion" (progress 0) and
 *     "still" (progress 1) -- built once, never re-created, so an interrupted
 *     flip reverses cleanly instead of stacking a second tween;
 *  3. an idle waveform loop on the bars, which only runs while motion is on.
 */
export default function MotionToggle() {
  const { reduced, toggle } = useMotion();
  const { ref, innerRef, press } = useMagnetic<HTMLButtonElement>({
    strength: 0.5,
    radius: 110,
    maxOffset: 18,
    innerStrength: 0.5,
  });

  const stateTl = useRef<gsap.core.Timeline | null>(null);
  const idleTl = useRef<gsap.core.Timeline | null>(null);
  const rippleRef = useRef<HTMLSpanElement>(null);
  // Seeded with the mount-time value so the flip effect below can tell a real
  // change from its own first run.
  const prevReduced = useRef(reduced);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const knob = root.querySelector<HTMLElement>(".motion-toggle-knob");
      const track = root.querySelector<HTMLElement>(".motion-toggle-track");
      const fill = root.querySelector<HTMLElement>(".motion-toggle-fill");
      const bars = gsap.utils.toArray<HTMLElement>(".motion-toggle-ticks i", root);
      const lines = gsap.utils.toArray<SVGRectElement>(".motion-toggle-knob rect", root);
      const onLabel = root.querySelector<HTMLElement>('[data-label="on"]');
      const offLabel = root.querySelector<HTMLElement>('[data-label="off"]');
      if (!knob || !track || !fill) return;

      // "motion on" resting state: the knob's three speed-lines are ragged,
      // like a signal. Set here rather than in CSS so the timeline has a known
      // numeric start value to animate away from.
      gsap.set(lines, { transformOrigin: "left center", scaleX: (i) => [1, 0.55, 0.78][i] ?? 1 });
      gsap.set(bars, { transformOrigin: "center" });
      gsap.set(knob, { transformOrigin: "center" });

      // Measured rather than hard-coded, so the switch still lands flush if the
      // root font-size changes.
      const travel = () => track.clientWidth - knob.offsetWidth - 4;

      // --- state timeline: progress 0 = motion, 1 = still ---
      const tl = gsap.timeline({ paused: true, defaults: { duration: 0.45, ease: EASE.snap } });
      tl.to(knob, { x: travel }, 0)
        // squash on the way across and recover -- a solid object thrown, rather
        // than a rectangle sliding on rails
        .to(knob, { scaleX: 1.28, scaleY: 0.84, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.inOut" }, 0.04)
        .to(fill, { scaleX: 0, duration: 0.4, ease: "power3.inOut" }, 0)
        // the waveform collapses to a flat line
        .to(bars, { scaleY: 0.12, duration: 0.35, ease: "power2.inOut", stagger: { each: 0.03, from: "start" } }, 0)
        // the three speed-lines square up into one solid block
        .to(lines, { scaleX: 1, duration: 0.35, ease: "power2.inOut", stagger: 0.02 }, 0)
        .to(onLabel, { yPercent: -110, autoAlpha: 0, duration: 0.28, ease: "power2.in" }, 0)
        .fromTo(
          offLabel,
          { yPercent: 110, autoAlpha: 0 },
          { yPercent: 0, autoAlpha: 1, duration: 0.3, ease: "power2.out" },
          0.12,
        );
      stateTl.current = tl;

      // --- idle loop: the bars drift like a live signal while motion is on ---
      const idle = gsap.timeline({ repeat: -1, yoyo: true, defaults: { ease: "sine.inOut" } });
      idle.to(bars, { scaleY: 0.45, duration: 0.7, stagger: { each: 0.09, from: "start" } });
      idleTl.current = idle;

      // Land on the current state without playing through it on first paint.
      tl.progress(reduced ? 1 : 0);
      if (reduced) idle.pause();

      return () => {
        stateTl.current = null;
        idleTl.current = null;
      };
    },
    { scope: ref },
  );

  // Flip between the two states whenever the shared motion setting changes --
  // including when the OS setting changes with this button never being clicked.
  useGSAP(
    () => {
      const tl = stateTl.current;
      const idle = idleTl.current;
      if (!tl || reduced === prevReduced.current) return;
      prevReduced.current = reduced;

      // Turning motion *off* still animates the switch itself: it is the direct,
      // local confirmation of a click, not incidental decoration. It just gets
      // there faster.
      tl.timeScale(reduced ? 1.6 : 1);
      if (reduced) {
        tl.play();
        idle?.pause();
      } else {
        tl.reverse();
        idle?.play();
      }
    },
    { dependencies: [reduced], scope: ref },
  );

  const onClick = () => {
    press();
    // hard square ripple -- flat, never blurred, per the design system's shadow rule
    if (rippleRef.current && !reduced) {
      gsap.fromTo(
        rippleRef.current,
        { opacity: 1, scale: 1 },
        { opacity: 0, scale: 1.5, duration: 0.5, ease: "power2.out", overwrite: true },
      );
    }
    toggle();
  };

  return (
    <button
      type="button"
      ref={ref}
      className="motion-toggle"
      role="switch"
      aria-checked={!reduced}
      aria-label={reduced ? "Turn animations on" : "Turn animations off"}
      onClick={onClick}
      data-cursor
      data-cursor-label={reduced ? "ANIMATE" : "CALM"}
    >
      <span className="motion-toggle-label" aria-hidden="true">
        <span data-label="on">motion</span>
        <span data-label="off" style={{ opacity: 0 }}>
          still
        </span>
      </span>

      <span className="motion-toggle-track" ref={innerRef as React.RefObject<HTMLSpanElement>}>
        <span className="motion-toggle-fill" />
        <span className="motion-toggle-ticks" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="motion-toggle-knob">
          <svg width="14" height="10" viewBox="0 0 14 10" aria-hidden="true">
            <rect x="1" y="1" width="12" height="1.6" />
            <rect x="1" y="4.2" width="12" height="1.6" />
            <rect x="1" y="7.4" width="12" height="1.6" />
          </svg>
        </span>
        <span className="motion-toggle-ripple" ref={rippleRef} />
      </span>
    </button>
  );
}
