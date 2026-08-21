import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { ThemeKey } from "../../api/types";
import { THEME_META } from "../../api/types";
import "./IndexViz.css";

type SubIndexBarProps = {
  theme: ThemeKey;
  value: number | null; // 0-1, in the sub-index's own natural direction
  active?: boolean;
  onClick?: () => void;
};

/**
 * One row: label, hard-edged fill bar, mono value. `value` is shown in the
 * sub-index's own natural direction (VARIABLES_AND_DATA_SOURCES.md SS4) with a
 * "higher = better/worse" hint, since IAI/VEI read the opposite way from the
 * other four.
 *
 * The fill is driven by GSAP on `scaleX` rather than by a CSS `width`
 * transition: width is a layout property, so animating it reflows the row on
 * every frame, while a transform stays on the compositor.
 *
 * The count runs on mount rather than on a per-row ScrollTrigger. A trigger
 * here was actively harmful: the readout is a *number*, so a row that had not
 * been scrolled to yet sat displaying 0 -- indistinguishable from a real zero,
 * and wrong. The markup now renders the true value, and the tween only ever
 * animates up to what is already correct.
 */
export default function SubIndexBar({ theme, value, active, onClick }: SubIndexBarProps) {
  const meta = THEME_META[theme];
  const pct = value === null ? 0 : Math.round(value * 100);
  const Tag = onClick ? "button" : "div";
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const fill = rootRef.current?.querySelector<HTMLElement>(".subindex-bar-fill");
      const readout = rootRef.current?.querySelector<HTMLElement>(".subindex-bar-value");
      if (!fill) return;

      if (reduced) {
        gsap.set(fill, { scaleX: pct / 100 });
        if (readout) readout.textContent = value === null ? "--" : String(pct);
        return;
      }

      const counter = { v: 0 };
      gsap.to(counter, {
        v: pct,
        duration: 0.9,
        ease: "power3.out",
        onUpdate: () => {
          gsap.set(fill, { scaleX: counter.v / 100 });
          if (readout) readout.textContent = String(Math.round(counter.v));
        },
      });
    },
    { dependencies: [pct, value, reduced], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <Tag
      ref={rootRef as never}
      className={`subindex-bar${active ? " is-active" : ""}`}
      onClick={onClick}
      type={onClick ? "button" : undefined}
      data-cursor={onClick ? true : undefined}
      data-cursor-label={onClick ? "VIEW" : undefined}
    >
      <span className="subindex-bar-label">
        {meta.short}
        <small>{meta.higherIsBetter ? "higher = better" : "higher = more pressure"}</small>
      </span>
      <span className="subindex-bar-track">
        <span className="subindex-bar-fill" />
      </span>
      <span className="subindex-bar-value mono-num">{value === null ? "--" : pct}</span>
    </Tag>
  );
}
