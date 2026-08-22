import { useRef } from "react";
import { useGSAP, Flip } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./PillTabs.css";

export type PillTab = { id: string; label: string };

type PillTabsProps = {
  tabs: PillTab[];
  active: string;
  onSelect: (id: string) => void;
  ariaLabel: string;
  size?: "default" | "small";
};

/**
 * An iOS-style segmented control: a solid thumb slides between tabs, re-parented
 * into whichever button is active via GSAP Flip -- the same re-parenting pattern
 * the header's active-link marker uses. Kept brutalist rather than soft: hard ink
 * border, hard offset shadow on the capsule, not a blurred plastic one -- the one
 * deliberately rounded shape in the system (workflow.md SS9.1).
 *
 * Used both for the Dashboard Dome's top-level view switch and, at `size="small"`,
 * for the Methodology tab's per-indicator picker.
 */
export default function PillTabs({ tabs, active, onSelect, ariaLabel, size = "default" }: PillTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  // the thumb's very first placement has no meaningful "previous box" to fly
  // from -- same guard as the header's active-link marker
  const thumbPlaced = useRef(false);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const bar = tabsRef.current;
      if (!bar) return;
      const thumb = bar.querySelector<HTMLElement>(".pill-tab-thumb");
      const target = bar.querySelector<HTMLElement>(`[data-tab="${active}"]`);
      if (!thumb || !target) return;

      const state = Flip.getState(thumb);
      target.appendChild(thumb);

      if (reduced || !thumbPlaced.current) {
        thumbPlaced.current = true;
        return;
      }
      Flip.from(state, { duration: 0.4, ease: "power3.inOut", absolute: true });
    },
    { dependencies: [active, reduced], scope: tabsRef },
  );

  return (
    <div
      className={`pill-tabs${size === "small" ? " pill-tabs-small" : ""}`}
      ref={tabsRef}
      role="tablist"
      aria-label={ariaLabel}
    >
      <span className="pill-tab-thumb" aria-hidden="true" />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          data-tab={tab.id}
          aria-selected={active === tab.id}
          className={`pill-tab${active === tab.id ? " is-active" : ""}`}
          onClick={() => onSelect(tab.id)}
          data-cursor
          data-cursor-label="VIEW"
        >
          <span className="pill-tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
