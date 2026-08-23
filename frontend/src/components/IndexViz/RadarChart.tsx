import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type RadarAxis = { key: string; label: string };
export type RadarSeries = { key: string; label: string; values: Record<string, number | null>; dashed?: boolean };

type RadarChartProps = {
  axes: RadarAxis[];
  series: RadarSeries[];
  size?: number;
  max?: number;
};

/**
 * A radar/spider chart: one polygon per series over shared axes. Series are
 * told apart by stroke style (solid vs. dashed) and marker shape (circle vs.
 * square), not by new hues -- everything stays rust-on-paper, same convention
 * as CoxcombChart's texture-only wedges.
 */
export default function RadarChart({ axes, series, size = 320, max = 100 }: RadarChartProps) {
  const rootRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 56;
  const n = axes.length;

  const angleFor = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;

  const seriesPoints = series.map((s) => {
    const pts = axes.map((axis, i) => {
      const v = Math.max(0, Math.min(max, s.values[axis.key] ?? 0));
      const r = (v / max) * maxR;
      const angle = angleFor(i);
      return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), value: s.values[axis.key] };
    });
    const path = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";
    return { ...s, pts, path };
  });

  useGSAP(
    () => {
      const groups = gsap.utils.toArray<SVGGElement>(".radar-series", rootRef.current!);
      if (!groups.length || reduced) return;
      gsap.from(groups, {
        scale: 0,
        duration: 0.6,
        ease: "back.out(1.5)",
        stagger: 0.15,
        transformOrigin: `${cx}px ${cy}px`,
      });
    },
    { dependencies: [series, reduced, cx, cy], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div className="radar-chart-wrap">
      <svg ref={rootRef} className="radar-chart" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <circle key={f} cx={cx} cy={cy} r={maxR * f} fill="none" stroke="var(--line)" strokeWidth={1} />
        ))}
        {axes.map((axis, i) => {
          const angle = angleFor(i);
          const x = cx + maxR * Math.cos(angle);
          const y = cy + maxR * Math.sin(angle);
          const lx = cx + (maxR + 22) * Math.cos(angle);
          const ly = cy + (maxR + 22) * Math.sin(angle);
          return (
            <g key={axis.key}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line)" strokeWidth={1} />
              <text x={lx} y={ly} textAnchor="middle" className="radar-axis-label">
                {axis.label}
              </text>
            </g>
          );
        })}

        {seriesPoints.map((s) => (
          <g className="radar-series" key={s.key}>
            <path
              d={s.path}
              fill="var(--rust)"
              fillOpacity={0.08}
              stroke="var(--rust)"
              strokeWidth={2}
              strokeDasharray={s.dashed ? "6 4" : undefined}
            />
            {s.pts.map((p, i) =>
              s.dashed ? (
                <rect key={i} x={p.x - 4} y={p.y - 4} width={8} height={8} fill="var(--white)" stroke="var(--rust)" strokeWidth={1.5} />
              ) : (
                <circle key={i} cx={p.x} cy={p.y} r={4.5} fill="var(--rust)" stroke="var(--white)" strokeWidth={1.5} />
              ),
            )}
          </g>
        ))}
      </svg>

      <div className="radar-legend">
        {series.map((s) => (
          <span className="radar-legend-item" key={s.key}>
            <span className={`radar-legend-swatch${s.dashed ? " radar-legend-swatch-dashed" : ""}`} aria-hidden="true" />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
