import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type CoxcombSlice = { key: string; label: string; value: number | null };

type CoxcombChartProps = {
  /** exactly 3 entries expected: Economic, Social, Environmental */
  data: CoxcombSlice[];
  size?: number;
};

const TEXTURES = ["solid", "hatch", "outline"] as const;

/**
 * A Nightingale/coxcomb rose: equal-angle wedges, radius = stress value (0-100).
 * The categories are told apart by texture, not by introducing new hues -- solid
 * rust, a diagonal-hatch rust pattern, and an outline-only wedge, three
 * treatments of the one accent colour (workflow.md SS9.1: no rainbow/colour-
 * stripe accents). Radius grows from the centre on mount, same "instrument
 * sweeping to its reading" language as RadialGauge.
 */
export default function CoxcombChart({ data, size = 320 }: CoxcombChartProps) {
  const rootRef = useRef<SVGSVGElement>(null);
  const reduced = useReducedMotion();
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 56;
  const n = data.length;
  const gapRad = 0.06;

  useGSAP(
    () => {
      const groups = gsap.utils.toArray<SVGGElement>(".coxcomb-wedge", rootRef.current!);
      if (!groups.length) return;
      if (reduced) {
        gsap.set(groups, { scale: 1 });
        return;
      }
      gsap.from(groups, {
        scale: 0,
        duration: 0.7,
        ease: "back.out(1.6)",
        stagger: 0.12,
        transformOrigin: `${cx}px ${cy}px`,
      });
    },
    { dependencies: [data, reduced, cx, cy], scope: rootRef, revertOnUpdate: true },
  );

  const wedges = data.map((slice, i) => {
    const startAngle = (i / n) * Math.PI * 2 - Math.PI / 2 + gapRad / 2;
    const endAngle = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2 - gapRad / 2;
    const value = Math.max(0, Math.min(100, slice.value ?? 0));
    const r = (value / 100) * maxR;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const large = endAngle - startAngle > Math.PI ? 1 : 0;
    const path = r < 0.5 ? "" : `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
    const texture = TEXTURES[i % TEXTURES.length];
    const midAngle = (startAngle + endAngle) / 2;
    const labelR = maxR + 26;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    return { slice, path, texture, lx, ly };
  });

  return (
    <svg ref={rootRef} className="coxcomb-chart" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <pattern id="coxcomb-hatch" patternUnits="userSpaceOnUse" width="7" height="7" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="var(--paper)" />
          <line x1="0" y1="0" x2="0" y2="7" stroke="var(--rust)" strokeWidth="3" />
        </pattern>
      </defs>

      {/* instrument rings, same tick-ring language as RadialGauge */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <circle key={f} cx={cx} cy={cy} r={maxR * f} fill="none" stroke="var(--line)" strokeWidth={1} />
      ))}

      {wedges.map(({ slice, path, texture }) =>
        path ? (
          <g className="coxcomb-wedge" key={slice.key}>
            <path
              d={path}
              fill={texture === "outline" ? "var(--paper)" : texture === "hatch" ? "url(#coxcomb-hatch)" : "var(--rust)"}
              stroke="var(--rust)"
              strokeWidth={texture === "outline" ? 2 : 1}
            />
          </g>
        ) : null,
      )}

      {wedges.map(({ slice, lx, ly }) => (
        <text key={slice.key} x={lx} y={ly} textAnchor="middle" className="coxcomb-label">
          <tspan x={lx} dy="-0.3em" className="coxcomb-label-name">
            {slice.label}
          </tspan>
          <tspan x={lx} dy="1.2em" className="coxcomb-label-value mono-num">
            {slice.value === null ? "--" : Math.round(slice.value)}
          </tspan>
        </text>
      ))}
    </svg>
  );
}
