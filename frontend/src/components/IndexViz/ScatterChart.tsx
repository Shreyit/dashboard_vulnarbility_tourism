import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type ScatterPoint = { key: string; label: string; x: number; y: number; group: number };
export type ScatterGroup = { group: number; label: string };

type ScatterChartProps = {
  points: ScatterPoint[];
  groups: ScatterGroup[];
  xCaption: string;
  yCaption: string;
  size?: number;
};

// Same texture set CoxcombChart/StackedBarChart use for categorical identity --
// no new hues, a cluster is told apart by fill pattern, not color.
const TEXTURES = ["tex-solid", "tex-hatch", "tex-outline", "tex-hatch-reverse"] as const;

/**
 * A minimal scatter plot for a handful of points (here: 9 zones on a PCA
 * projection) -- an HTML/CSS grid rather than SVG, reusing the same
 * tex-solid/tex-hatch/tex-outline fills the stacked bar chart already defines.
 */
export default function ScatterChart({ points, groups, xCaption, yCaption, size = 380 }: ScatterChartProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const { positioned, xDomain, yDomain } = useMemo(() => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const padFor = (vals: number[]) => {
      const min = Math.min(...vals, 0);
      const max = Math.max(...vals, 0);
      const span = max - min || 1;
      return { min: min - span * 0.2, max: max + span * 0.2 };
    };
    const xd = padFor(xs);
    const yd = padFor(ys);
    return {
      xDomain: xd,
      yDomain: yd,
      positioned: points.map((p) => ({
        ...p,
        left: ((p.x - xd.min) / (xd.max - xd.min)) * 100,
        top: 100 - ((p.y - yd.min) / (yd.max - yd.min)) * 100,
      })),
    };
  }, [points]);

  useGSAP(
    () => {
      const dots = gsap.utils.toArray<HTMLElement>(".scatter-point", rootRef.current!);
      if (!dots.length) return;
      if (reduced) {
        gsap.set(dots, { scale: 1, autoAlpha: 1 });
        return;
      }
      gsap.from(dots, { scale: 0, autoAlpha: 0, duration: 0.5, ease: "back.out(1.8)", stagger: 0.06 });
    },
    { dependencies: [points, reduced], scope: rootRef, revertOnUpdate: true },
  );

  const zeroX = ((0 - xDomain.min) / (xDomain.max - xDomain.min)) * 100;
  const zeroY = 100 - ((0 - yDomain.min) / (yDomain.max - yDomain.min)) * 100;

  return (
    <div ref={rootRef}>
      <div className="scatter-chart" style={{ width: "100%", maxWidth: size, height: size }}>
        <span className="scatter-axis-h" style={{ top: `${zeroY}%` }} />
        <span className="scatter-axis-v" style={{ left: `${zeroX}%` }} />
        {positioned.map((p) => (
          <span
            key={p.key}
            className={`scatter-point ${TEXTURES[p.group % TEXTURES.length]}`}
            style={{ left: `${p.left}%`, top: `${p.top}%` }}
            title={p.label}
          >
            <span className="scatter-point-label">{p.label}</span>
          </span>
        ))}
      </div>
      <p className="scatter-caption scatter-caption-x">{xCaption}</p>
      <p className="scatter-caption scatter-caption-y">{yCaption}</p>

      <ul className="stacked-bar-legend scatter-legend">
        {groups.map((g) => (
          <li className="stacked-bar-legend-item" key={g.group}>
            <span className={`stacked-bar-swatch ${TEXTURES[g.group % TEXTURES.length]}`} aria-hidden="true" />
            <span className="stacked-bar-legend-label">{g.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
