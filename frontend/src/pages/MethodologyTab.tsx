import { useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";
import PillTabs from "../components/PillTabs/PillTabs";
import { METHODOLOGY } from "./methodologyContent";
import "./MethodologyTab.css";

/**
 * Exact, citable methodology for every indicator on the dashboard: what it's
 * built from, how it's normalized, the formula, and where the numbers/framing
 * came from. Lives on the landing page's Data & Methodology section, not the
 * Dashboard, so the dashboard itself stays focused on the live numbers.
 * Reuses PillTabs (size="small") as the per-indicator picker.
 */
export default function MethodologyTab() {
  const [active, setActive] = useState(METHODOLOGY[0].id);
  const cardRef = useRef<HTMLDivElement>(null);
  const shown = useRef(active);
  const reduced = useReducedMotion();

  const entry = METHODOLOGY.find((m) => m.id === active) ?? METHODOLOGY[0];

  useGSAP(
    () => {
      if (active === shown.current) return;
      shown.current = active;
      const el = cardRef.current;
      if (!el || reduced) return;
      gsap.fromTo(el, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3, ease: "power3.out" });
    },
    { dependencies: [active, reduced], scope: cardRef },
  );

  return (
    <div className="methodology-tab">
      <PillTabs
        tabs={METHODOLOGY.map((m) => ({ id: m.id, label: m.name.replace(/\s*\([^)]*\)\s*/g, " ").trim() }))}
        active={active}
        onSelect={setActive}
        ariaLabel="Indicator"
        size="small"
      />

      <div className="panel methodology-card" ref={cardRef}>
        <span className="eyebrow">{entry.name}</span>
        <p className="methodology-definition">{entry.definition}</p>

        <div className="methodology-field">
          <span className="methodology-field-label">Components</span>
          <div className="methodology-chips">
            {entry.components.map((c) => (
              <span className="methodology-chip mono-num" key={c}>
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className="methodology-field">
          <span className="methodology-field-label">Normalization</span>
          <p>{entry.normalization}</p>
        </div>

        <div className="methodology-field">
          <span className="methodology-field-label">Formula</span>
          <code className="methodology-formula mono-num">{entry.formula}</code>
        </div>

        <div className="methodology-field">
          <span className="methodology-field-label">Citations</span>
          <ul className="methodology-citations">
            {entry.citations.map((c) => (
              <li key={c.label}>
                {c.url ? (
                  <a href={c.url} target="_blank" rel="noreferrer" data-cursor data-cursor-label="OPEN">
                    {c.label}
                  </a>
                ) : (
                  c.label
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
