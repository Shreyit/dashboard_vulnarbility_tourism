import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type RangeDatum = {
  key: string;
  label: string;
  low: number;
  high: number;
  baseline: number | null;
  hint?: string;
};

type RangeBarChartProps = {
  data: RangeDatum[];
  /** Track domain. Defaults to 0-100 (a 0-100 index score); pass the data's own
   * min/max instead when the values cluster in a narrow band -- otherwise a
   * tight spread (e.g. TVI 40-52) reads as a sliver against a fixed 0-100 axis. */
  min?: number;
  max?: number;
};

/**
 * A p5-p95 band with a baseline tick per row -- the "how much does this number
 * move" read the Monte Carlo sensitivity check needs, same track language as
 * SubIndexBar/BarChartGeneric rather than a new visual system.
 */
export default function RangeBarChart({ data, min = 0, max = 100 }: RangeBarChartProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>(".range-bar-row", rootRef.current!);
      if (!rows.length) return;
      if (reduced) {
        gsap.set(rows, { autoAlpha: 1, x: 0 });
        return;
      }
      gsap.from(rows, { autoAlpha: 0, x: -14, duration: 0.4, stagger: 0.05 });
    },
    { dependencies: [data, reduced], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div ref={rootRef}>
      {data.map((d) => {
        const scale = (v: number) => Math.max(0, Math.min(100, ((v - min) / (max - min)) * 100));
        const lowPct = scale(d.low);
        const highPct = scale(d.high);
        const basePct = d.baseline === null ? null : scale(d.baseline);
        return (
          <div className="subindex-bar range-bar-row" key={d.key} title={d.hint}>
            <span className="subindex-bar-label">{d.label}</span>
            <span className="subindex-bar-track range-bar-track">
              <span className="range-bar-band" style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }} />
              {basePct !== null && <span className="range-bar-baseline" style={{ left: `${basePct}%` }} />}
            </span>
            <span className="subindex-bar-value mono-num">
              {d.baseline === null ? "--" : Math.round(d.baseline)}
              <small>
                {" "}
                ({Math.round(d.low)}&ndash;{Math.round(d.high)})
              </small>
            </span>
          </div>
        );
      })}
      {data.length === 0 && <p className="component-empty">No data for this selection.</p>}
    </div>
  );
}
