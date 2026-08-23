import { useEffect, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type LinePoint = { label: string; value: number | null };

type LineChartProps = {
  points: LinePoint[];
  width?: number;
  height?: number;
  max?: number;
  valueFormat?: (v: number) => string;
};

/**
 * A hand-built SVG line chart: an axis, gridlines at 25/50/75/100% (the same
 * tick-ring language RadialGauge/CoxcombChart use), a drawn path, and a point +
 * value label at each category. Categories are evenly spaced regardless of the
 * underlying numeric gap between them (e.g. footfall multipliers 1x..16.7x) --
 * this is a discrete-scenario chart, not a continuous-time one, and spacing it
 * by category rather than by multiplier keeps it from misreading as a real
 * timeline.
 */
export default function LineChart({ points, width = 640, height = 280, max, valueFormat }: LineChartProps) {
  const rootRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const reduced = useReducedMotion();

  const padX = 32;
  const padTop = 28;
  const padBottom = 36;
  const plotW = width - padX * 2;
  const plotH = height - padTop - padBottom;
  const maxVal = max ?? Math.max(1, ...points.map((p) => p.value ?? 0)) * 1.15;

  const coords = points.map((p, i) => {
    const x = padX + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
    const v = p.value ?? 0;
    const y = padTop + plotH - (v / maxVal) * plotH;
    return { ...p, x, y };
  });

  const linePath = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const length = path.getTotalLength();
    path.style.strokeDasharray = String(length);
    path.style.strokeDashoffset = reduced ? "0" : String(length);
  }, [linePath, reduced]);

  useGSAP(
    () => {
      const path = pathRef.current;
      if (!path || reduced) return;
      const q = gsap.utils.selector(rootRef);
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(path, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" })
        .from(q(".line-chart-point"), { scale: 0, transformOrigin: "center", duration: 0.35, stagger: 0.08 }, "-=0.5")
        .from(q(".line-chart-value"), { autoAlpha: 0, y: 8, duration: 0.3, stagger: 0.08 }, "-=0.4");
    },
    { dependencies: [linePath, reduced], scope: rootRef, revertOnUpdate: true },
  );

  const fmt = valueFormat ?? ((v: number) => v.toFixed(1));

  return (
    <svg ref={rootRef} className="line-chart" width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {[0.25, 0.5, 0.75, 1].map((f) => {
        const y = padTop + plotH - f * plotH;
        return <line key={f} x1={padX} y1={y} x2={width - padX} y2={y} stroke="var(--line)" strokeWidth={1} />;
      })}
      <line x1={padX} y1={padTop + plotH} x2={width - padX} y2={padTop + plotH} stroke="var(--line-strong)" strokeWidth={1.5} />

      <path ref={pathRef} d={linePath} fill="none" stroke="var(--rust)" strokeWidth={2.5} strokeLinejoin="round" />

      {coords.map((c) => (
        <g key={c.label}>
          <circle className="line-chart-point" cx={c.x} cy={c.y} r={5} fill="var(--rust)" stroke="var(--white)" strokeWidth={1.5} />
          <text className="line-chart-value" x={c.x} y={c.y - 12} textAnchor="middle">
            {c.value === null ? "--" : fmt(c.value)}
          </text>
          <text className="line-chart-label" x={c.x} y={height - 12} textAnchor="middle">
            {c.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
