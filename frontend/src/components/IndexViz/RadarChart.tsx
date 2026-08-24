import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type RadarAxis = { key: string; label: string };
export type RadarSeries = {
  key: string;
  label: string;
  values: Record<string, number | null>;
  dashed?: boolean;
  /** Explicit CSS color for this series' stroke/fill/markers. Falls back to
   * the shared rust accent when omitted (e.g. a 2-series comparison, where
   * dash style alone is already unambiguous). */
  color?: string;
};

type RadarChartProps = {
  axes: RadarAxis[];
  series: RadarSeries[];
  size?: number;
  max?: number;
};

/**
 * A radar/spider chart: one polygon per series over shared axes. With 3+
 * overlapping series, stroke style (solid vs. dashed) and marker shape
 * (circle vs. square) alone stop being enough to tell two solid-stroke series
 * apart at a glance -- so each series can also carry its own color (still
 * kept to dash/marker-shape as a secondary channel, not color-only identity).
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

        {seriesPoints.map((s) => {
          const color = s.color ?? "var(--rust)";
          return (
            <g className="radar-series" key={s.key}>
              <path
                d={s.path}
                fill={color}
                fillOpacity={0.08}
                stroke={color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? "6 4" : undefined}
              />
              {s.pts.map((p, i) =>
                s.dashed ? (
                  <rect key={i} x={p.x - 4} y={p.y - 4} width={8} height={8} fill="var(--white)" stroke={color} strokeWidth={1.5} />
                ) : (
                  <circle key={i} cx={p.x} cy={p.y} r={4.5} fill={color} stroke="var(--white)" strokeWidth={1.5} />
                ),
              )}
            </g>
          );
        })}
      </svg>

      <div className="radar-legend">
        {series.map((s) => {
          const color = s.color ?? "var(--rust)";
          return (
            <span className="radar-legend-item" key={s.key}>
              <span
                className="radar-legend-swatch"
                style={{
                  background: s.dashed
                    ? `repeating-linear-gradient(to right, ${color} 0 5px, transparent 5px 8px)`
                    : color,
                }}
                aria-hidden="true"
              />
              {s.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
