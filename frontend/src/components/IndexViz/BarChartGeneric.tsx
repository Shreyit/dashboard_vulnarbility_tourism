import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

export type BarDatum = { key: string; label: string; value: number | null; hint?: string };

type BarChartGenericProps = {
  data: BarDatum[];
  max?: number;
};

/**
 * A generic horizontal bar row list -- the same `.subindex-bar` visual
 * language SubIndexBar uses, generalized to take arbitrary labeled data
 * instead of a fixed ThemeKey. Reused for the 6-pillar overview bar and the
 * dynamic Variable Explorer, where the dataset itself changes on selection.
 */
export default function BarChartGeneric({ data, max = 1 }: BarChartGenericProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>(".generic-bar-row", rootRef.current!);
      rows.forEach((row) => {
        const fill = row.querySelector<HTMLElement>(".subindex-bar-fill");
        const readout = row.querySelector<HTMLElement>(".subindex-bar-value");
        const pct = Number(row.dataset.pct ?? 0);
        if (!fill) return;
        if (reduced) {
          gsap.set(fill, { scaleX: pct / 100 });
          if (readout) readout.textContent = row.dataset.value === "null" ? "--" : String(pct);
          return;
        }
        const counter = { v: 0 };
        gsap.to(counter, {
          v: pct,
          duration: 0.8,
          ease: "power3.out",
          onUpdate: () => {
            gsap.set(fill, { scaleX: counter.v / 100 });
            if (readout) readout.textContent = String(Math.round(counter.v));
          },
        });
      });
      gsap.from(rows, { autoAlpha: 0, x: -14, duration: 0.4, stagger: 0.05 });
    },
    { dependencies: [data, reduced], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div ref={rootRef}>
      {data.map((d) => {
        const pct = d.value === null ? 0 : Math.round((d.value / max) * 100);
        return (
          <div className="subindex-bar generic-bar-row" key={d.key} data-pct={pct} data-value={d.value === null ? "null" : "num"}>
            <span className="subindex-bar-label">
              {d.label}
              {d.hint && <small>{d.hint}</small>}
            </span>
            <span className="subindex-bar-track">
              <span className="subindex-bar-fill" />
            </span>
            <span className="subindex-bar-value mono-num">{d.value === null ? "--" : pct}</span>
          </div>
        );
      })}
      {data.length === 0 && <p className="component-empty">No data for this selection.</p>}
    </div>
  );
}
