import { useMemo, useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./PixelTransition.css";

type PixelTransitionProps = {
  /** content shown underneath / after the reveal */
  firstContent: ReactNode;
  /** optional second layer, swapped in on hover (trigger="hover" only) */
  secondContent?: ReactNode;
  trigger?: "inview" | "hover";
  columns?: number;
  rows?: number;
  color?: string;
  className?: string;
  /** stagger origin for the pixel dissolve */
  from?: "random" | "center" | "edges" | "start";
};

/**
 * Covers its content with a grid of squares that dissolve away in a staggered
 * "pixel" pattern -- the scroll-reveal for imagery, and the same stepped
 * vocabulary as the route wipe and the loading bar.
 *
 * Uses ScrollTrigger rather than a hand-rolled IntersectionObserver: the rest
 * of the page's scroll behaviour is already ScrollTrigger's, and sharing one
 * scroll observer means the reveal is re-measured by the same
 * `ScrollTrigger.refresh()` that route changes and font loads already fire.
 */
export default function PixelTransition({
  firstContent,
  secondContent,
  trigger = "inview",
  columns = 10,
  rows = 6,
  color = "var(--paper)",
  className = "",
  from = "random",
}: PixelTransitionProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const cellCount = columns * rows;
  const cells = useMemo(() => Array.from({ length: cellCount }), [cellCount]);

  const squares = () => (gridRef.current ? Array.from(gridRef.current.children) : []);

  useGSAP(
    () => {
      const grid = squares();
      if (!grid.length) return;

      if (trigger === "hover") {
        // hover mode starts with the grid hidden; it grows in on hover
        gsap.set(grid, { scale: 0 });
        return;
      }

      // inview mode starts fully covering (the CSS default, scale 1)
      if (reduced) {
        gsap.set(grid, { scale: 0 });
        return;
      }

      gsap.to(grid, {
        scale: 0,
        duration: 0.5,
        ease: "power2.inOut",
        stagger: { each: 0.012, from, grid: [rows, columns] },
        scrollTrigger: { trigger: rootRef.current!, start: "top bottom-=15%", once: true },
      });
    },
    { dependencies: [trigger, reduced, from, rows, columns], scope: rootRef, revertOnUpdate: true },
  );

  const onHoverIn = () => {
    if (trigger !== "hover" || reduced) return;
    gsap.to(squares(), {
      scale: 1,
      duration: 0.35,
      ease: "power2.out",
      overwrite: true,
      stagger: { each: 0.008, from: "start", grid: [rows, columns] },
      onStart: () => {
        if (frontRef.current) frontRef.current.style.opacity = "1";
      },
    });
  };

  const onHoverOut = () => {
    if (trigger !== "hover" || reduced) return;
    gsap.to(squares(), {
      scale: 0,
      duration: 0.35,
      ease: "power2.in",
      overwrite: true,
      stagger: { each: 0.008, from: "end", grid: [rows, columns] },
      onComplete: () => {
        if (frontRef.current) frontRef.current.style.opacity = "0";
      },
    });
  };

  return (
    <div
      ref={rootRef}
      className={`pixel-transition ${className}`}
      onMouseEnter={onHoverIn}
      onMouseLeave={onHoverOut}
    >
      <div className="pixel-transition-layer pixel-transition-layer--back">{firstContent}</div>
      {secondContent && (
        <div
          ref={frontRef}
          className="pixel-transition-layer pixel-transition-layer--front"
          style={{ opacity: 0 }}
        >
          {secondContent}
        </div>
      )}
      <div
        ref={gridRef}
        className="pixel-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}
      >
        {cells.map((_, i) => (
          <span key={i} style={{ background: color }} />
        ))}
      </div>
    </div>
  );
}
