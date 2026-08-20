import type { ThemeKey } from "../../api/types";
import { THEME_META } from "../../api/types";
import "./IndexViz.css";

type SubIndexBarProps = {
  theme: ThemeKey;
  value: number | null; // 0-1, in the sub-index's own natural direction
  active?: boolean;
  onClick?: () => void;
};

/** One row: label, hard-edged fill bar, mono value. `value` is shown in the
 * sub-index's own natural direction (VARIABLES_AND_DATA_SOURCES.md SS4) with a
 * "higher = better/worse" hint, since IAI/VEI read the opposite way from the other four. */
export default function SubIndexBar({ theme, value, active, onClick }: SubIndexBarProps) {
  const meta = THEME_META[theme];
  const pct = value === null ? 0 : Math.round(value * 100);
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
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
        <span className="subindex-bar-fill" style={{ width: `${pct}%` }} />
      </span>
      <span className="subindex-bar-value mono-num">{value === null ? "--" : pct}</span>
    </Tag>
  );
}
