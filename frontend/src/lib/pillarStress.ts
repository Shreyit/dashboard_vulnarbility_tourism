import { THEME_META, type ThemeKey } from "../api/types";

/** A pillar's own natural direction differs (IAI/VEI are "higher = better"); this
 * flips those two so every pillar reads on the same "higher = more stressed" scale
 * for ranking, matching the convention `insights.py`'s stakeholder matrix already
 * uses. Shared by OverviewTab (most/least stressed KPI) and the Trends page. */
export function stressValue(theme: ThemeKey, v: number | null): number | null {
  if (v === null) return null;
  return THEME_META[theme].higherIsBetter ? 1 - v : v;
}
