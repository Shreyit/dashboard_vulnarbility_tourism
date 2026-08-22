import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { STAKEHOLDER_META, THEME_META, type StakeholderMatrix } from "../../api/types";
import "./IndexViz.css";

type StakeholderMatrixGridProps = {
  data: StakeholderMatrix;
};

/**
 * "Who is most stressed, by which pillar" -- a hard-bordered grid rather than a
 * soft gradient heatmap, cell fill = rust at an opacity proportional to the
 * value (same `color-mix` technique the zone-map markers already use). Every
 * cell reads "higher = more pressure", see insights.py's compute_stakeholder_matrix
 * docstring for why IAI/VEI are inverted before they reach this component.
 */
export default function StakeholderMatrixGrid({ data }: StakeholderMatrixGridProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const cells = gsap.utils.toArray<HTMLElement>(".stakeholder-cell", rootRef.current!);
      if (!cells.length || reduced) return;
      gsap.from(cells, {
        autoAlpha: 0,
        scale: 0.85,
        duration: 0.35,
        ease: "power2.out",
        stagger: { each: 0.015, from: "start" },
      });
    },
    { dependencies: [data, reduced], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div className="stakeholder-matrix" ref={rootRef}>
      <div className="stakeholder-row stakeholder-row-head">
        <span className="stakeholder-row-label" />
        {data.themes.map((t) => (
          <span key={t} className="stakeholder-col-label">
            {THEME_META[t]?.short ?? t}
          </span>
        ))}
      </div>
      {data.surveys.map((s) => (
        <div className="stakeholder-row" key={s}>
          <span className="stakeholder-row-label">{STAKEHOLDER_META[s] ?? s}</span>
          {data.themes.map((t) => {
            const v = data.matrix[s]?.[t];
            const pct = v === null || v === undefined ? null : Math.round(v * 100);
            return (
              <span
                key={t}
                className="stakeholder-cell mono-num"
                style={
                  pct === null
                    ? undefined
                    : {
                        background: `color-mix(in srgb, var(--rust) ${pct}%, var(--paper-deep))`,
                        color: pct > 55 ? "var(--white)" : "var(--ink)",
                      }
                }
              >
                {pct === null ? "--" : pct}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
