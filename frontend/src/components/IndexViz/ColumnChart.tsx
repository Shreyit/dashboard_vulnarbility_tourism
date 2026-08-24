import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type ColumnDatum = { key: string; label: string; value: number; hint?: string };

type ColumnChartProps = {
  data: ColumnDatum[];
  max?: number;
  height?: number;
};

/**
 * Vertical columns rising from a shared baseline -- the right form for an
 * ordered scale (age brackets) where left-to-right position carries meaning,
 * unlike the horizontal bar lists used for unordered long-tail categories.
 * Single rust hue, value on the cap, category label below the baseline.
 */
export default function ColumnChart({ data, max, height = 200 }: ColumnChartProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const scaleMax = max ?? Math.max(1, ...data.map((d) => d.value));

  useGSAP(
    () => {
      const cols = gsap.utils.toArray<HTMLElement>(".column-chart-fill", rootRef.current!);
      if (!cols.length) return;
      if (reduced) {
        gsap.set(cols, { scaleY: 1 });
        return;
      }
      gsap.from(cols, {
        scaleY: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.06,
        transformOrigin: "center bottom",
      });
    },
    { dependencies: [data, reduced], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div className="column-chart" ref={rootRef} style={{ height }}>
      {data.map((d) => {
        const pct = Math.max(0, Math.min(100, (d.value / scaleMax) * 100));
        return (
          <div className="column-chart-col" key={d.key} title={d.hint}>
            <span className="column-chart-value mono-num">{Math.round(d.value)}</span>
            <span className="column-chart-track">
              <span className="column-chart-fill" style={{ height: `${pct}%` }} />
            </span>
            <span className="column-chart-label">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
