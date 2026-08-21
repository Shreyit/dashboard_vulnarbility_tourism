import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./ScrollProgress.css";

/**
 * A hard-edged read-position bar across the very top of the page. Scrubbed
 * directly off document scroll, so it stays correct through the long sticky
 * sections where the page's own scrollbar stops being a useful guide to how
 * far through a section the reader is. The matching numeric readout lives in
 * the header's status rail, next to the rest of the instrument chrome.
 */
export default function ScrollProgress() {
  const barRef = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const bar = barRef.current;
      if (!bar) return;

      const trigger = ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          gsap.set(bar, { scaleX: self.progress });
        },
      });

      return () => trigger.kill();
    },
    { dependencies: [reduced] },
  );

  return (
    <div className="scroll-progress" aria-hidden="true">
      <span className="scroll-progress-bar" ref={barRef} />
    </div>
  );
}
