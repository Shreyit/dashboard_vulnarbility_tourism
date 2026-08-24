import { useRef, type CSSProperties } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type StackedBarSegment = {
  key: string;
  label: string;
  value: number;
  count?: number;
  /** Explicit CSS color (e.g. one per stakeholder group). Omit to fall back to
   * the texture-only solid/hatch/outline convention every other chart uses. */
  color?: string;
};

type StackedBarChartProps = {
  /** Segment values should already sum to (approximately) 100. */
  segments: StackedBarSegment[];
  height?: number;
};

const TEXTURES = ["solid", "hatch", "hatch-reverse", "outline"] as const;

/**
 * A single 100%-stacked bar: part-to-whole for a handful of categories (Gender,
 * first-time vs. repeat visitor, respondent mix), one shape instead of the
 * "one row per category" list BarChartGeneric renders. Plain flexbox + a
 * border-right gap rather than SVG -- a percentage flex-basis can't get the
 * gap math wrong the way a fixed viewBox scaled to a responsive width did.
 * Hover/focus pops the segment and reveals its value; segments take an
 * explicit `color` when the categories are a fixed identity (stakeholder
 * groups) rather than the shared texture-only convention.
 */
export default function StackedBarChart({ segments, height = 48 }: StackedBarChartProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const total = segments.reduce((s, seg) => s + Math.max(0, seg.value), 0) || 1;

  useGSAP(
    () => {
      const segs = gsap.utils.toArray<HTMLElement>(".stacked-bar-seg", rootRef.current!);
      if (!segs.length) return;
      if (reduced) {
        gsap.set(segs, { scaleX: 1 });
        return;
      }
      // set() + to() rather than from(): React 18 StrictMode double-invokes this effect
      // on mount, and a `.from()` tween killed by `revertOnUpdate` before it ever ticks
      // can leave `transform` stuck at the immediateRender "from" value forever instead
      // of reverting it. set() has no such immediateRender/revert interaction, so the
      // start state is always applied cleanly regardless of how many times this runs.
      gsap.set(segs, { scaleX: 0, transformOrigin: "left center" });
      gsap.to(segs, {
        scaleX: 1,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
      });
    },
    { dependencies: [segments, reduced], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div className="stacked-bar-chart" ref={rootRef}>
      <div className="stacked-bar-track" style={{ height }}>
        {segments.map((seg, i) => {
          const pct = (Math.max(0, seg.value) / total) * 100;
          const texture = TEXTURES[i % TEXTURES.length];
          const style: CSSProperties = { flexBasis: `${pct}%` };
          if (seg.color) {
            style.background = seg.color;
            style.borderColor = seg.color;
          }
          return (
            <div
              key={seg.key}
              className={`stacked-bar-seg${seg.color ? "" : ` tex-${texture}`}`}
              style={style}
              tabIndex={0}
            >
              <span className="stacked-bar-seg-tip">
                {seg.label} · {Math.round(seg.value)}%
              </span>
            </div>
          );
        })}
      </div>

      <ul className="stacked-bar-legend">
        {segments.map((seg, i) => {
          const texture = TEXTURES[i % TEXTURES.length];
          return (
            <li key={seg.key} className="stacked-bar-legend-item">
              <span
                className={`stacked-bar-swatch${seg.color ? "" : ` tex-${texture}`}`}
                style={seg.color ? { background: seg.color, borderColor: seg.color } : undefined}
                aria-hidden="true"
              />
              <span className="stacked-bar-legend-label">{seg.label}</span>
              <span className="stacked-bar-legend-value mono-num">
                {Math.round(seg.value)}%
                {seg.count !== undefined && <small> · {seg.count}</small>}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
