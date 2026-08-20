import { useEffect, useMemo, useRef, type ReactNode } from "react";
import gsap from "gsap";
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
 * "pixel" pattern -- used as a scroll-reveal for imagery and, later, as the
 * transition between dashboard views.
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
  const revealedRef = useRef(false);

  const cellCount = columns * rows;
  const cells = useMemo(() => Array.from({ length: cellCount }), [cellCount]);

  const squares = () =>
    gridRef.current ? Array.from(gridRef.current.children) : [];

  useEffect(() => {
    // hover mode starts with the grid hidden (scale 0); it grows in on hover.
    // inview mode starts with the grid fully covering (scale 1, the CSS default) until revealed.
    if (trigger === "hover") {
      gsap.set(squares(), { scale: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  useEffect(() => {
    if (trigger !== "inview" || !rootRef.current) return;
    const el = rootRef.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !revealedRef.current) {
          revealedRef.current = true;
          gsap.to(squares(), {
            scale: 0,
            duration: 0.5,
            ease: "power2.inOut",
            stagger: { each: 0.012, from, grid: [rows, columns] },
          });
          io.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);

  const onHoverIn = () => {
    if (trigger !== "hover") return;
    gsap.to(squares(), {
      scale: 1,
      duration: 0.35,
      ease: "power2.out",
      stagger: { each: 0.008, from: "start", grid: [rows, columns] },
      onStart: () => {
        if (frontRef.current) frontRef.current.style.opacity = "1";
      },
    });
  };

  const onHoverOut = () => {
    if (trigger !== "hover") return;
    gsap.to(squares(), {
      scale: 0,
      duration: 0.35,
      ease: "power2.in",
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
      <div className="pixel-transition-layer pixel-transition-layer--back">
        {firstContent}
      </div>
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
