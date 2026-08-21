import { useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./Cursor.css";

/**
 * Minimal crosshair cursor (Arch-Linux-Xcursor-style: thin, precise, no lag).
 * Interactive elements opt in with `data-cursor` (bracket/viewfinder state) and
 * an optional `data-cursor-label` (e.g. "VIEW", "OPEN") shown beside it.
 *
 * Two layers: the crosshair tracks the pointer almost exactly, and a ring
 * trails behind it with a slower easing and rotates with pointer velocity.
 * Both are moved with `gsap.quickTo`, which reuses a single tween per property
 * rather than allocating a new one on every mousemove.
 */
export default function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState("");
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const root = rootRef.current;
      const ring = ringRef.current;
      if (!root || !ring) return;

      // The crosshair is near-instant; the ring is deliberately slower, which
      // is what gives the pair its weight without making the point feel laggy.
      const xTo = gsap.quickTo(root, "x", { duration: reduced ? 0 : 0.12, ease: "power3.out" });
      const yTo = gsap.quickTo(root, "y", { duration: reduced ? 0 : 0.12, ease: "power3.out" });
      const rxTo = gsap.quickTo(ring, "x", { duration: reduced ? 0 : 0.42, ease: "power3.out" });
      const ryTo = gsap.quickTo(ring, "y", { duration: reduced ? 0 : 0.42, ease: "power3.out" });
      const rotTo = gsap.quickTo(ring, "rotation", { duration: 0.8, ease: "power3.out" });

      let lastX = 0;
      let lastY = 0;
      let lastT = 0;

      const onMove = (e: MouseEvent) => {
        xTo(e.clientX);
        yTo(e.clientY);
        rxTo(e.clientX);
        ryTo(e.clientY);

        if (!reduced) {
          const dt = e.timeStamp - lastT;
          if (lastT !== 0 && dt > 0) {
            const speed = Math.hypot(e.clientX - lastX, e.clientY - lastY) / dt;
            rotTo(gsap.utils.clamp(0, 45, speed * 90));
          }
          lastX = e.clientX;
          lastY = e.clientY;
          lastT = e.timeStamp;
        }
      };

      const onOver = (e: MouseEvent) => {
        const target = (e.target as HTMLElement)?.closest<HTMLElement>("[data-cursor]");
        if (target) {
          setHover(true);
          setLabel(target.dataset.cursorLabel ?? "");
        } else {
          setHover(false);
          setLabel("");
        }
      };

      // A click should register on the cursor itself, not only on the target.
      const onDown = () => {
        if (reduced) return;
        gsap.to(root, { scale: 0.72, duration: 0.14, ease: "power3.out", overwrite: "auto" });
        gsap.to(ring, { scale: 1.35, duration: 0.2, ease: "power3.out", overwrite: "auto" });
      };
      const onUp = () => {
        if (reduced) return;
        gsap.to(root, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
        gsap.to(ring, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
      };

      // Without this the cursor is stranded at the last in-window position
      // whenever the pointer leaves for the browser chrome or another window.
      const onLeaveWindow = () => gsap.to([root, ring], { autoAlpha: 0, duration: 0.2, overwrite: "auto" });
      const onEnterWindow = () => gsap.to([root, ring], { autoAlpha: 1, duration: 0.2, overwrite: "auto" });

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseover", onOver);
      window.addEventListener("mousedown", onDown);
      window.addEventListener("mouseup", onUp);
      document.addEventListener("mouseleave", onLeaveWindow);
      document.addEventListener("mouseenter", onEnterWindow);

      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseover", onOver);
        window.removeEventListener("mousedown", onDown);
        window.removeEventListener("mouseup", onUp);
        document.removeEventListener("mouseleave", onLeaveWindow);
        document.removeEventListener("mouseenter", onEnterWindow);
      };
    },
    { dependencies: [reduced] },
  );

  return (
    <>
      <span className={`cursor-ring${hover ? " is-hover" : ""}`} ref={ringRef} aria-hidden="true" />
      <div
        ref={rootRef}
        className={`cursor${hover ? " is-hover" : ""}${label ? " has-label" : ""}`}
        aria-hidden="true"
      >
        <span className="cursor-tick cursor-tick--n" />
        <span className="cursor-tick cursor-tick--s" />
        <span className="cursor-tick cursor-tick--e" />
        <span className="cursor-tick cursor-tick--w" />
        <span className="cursor-dot" />
        <span className="cursor-label">{label}</span>
      </div>
    </>
  );
}
