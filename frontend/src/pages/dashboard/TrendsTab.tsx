import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import {
  getScenarioTrend,
  getSustainabilityByStakeholder,
  getThemeVariables,
  getTownIndices,
} from "../../api/client";
import {
  STAKEHOLDER_META,
  THEME_META,
  THEME_ORDER,
  type IndexBundle,
  type ScenarioTrendPoint,
  type StakeholderTriad,
  type ThemeKey,
} from "../../api/types";
import { stressValue } from "../../lib/pillarStress";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import LineChart from "../../components/IndexViz/LineChart";
import RadarChart, { type RadarSeries } from "../../components/IndexViz/RadarChart";
import BarChartGeneric, { type BarDatum } from "../../components/IndexViz/BarChartGeneric";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./TrendsTab.css";

type TrendsData = {
  indices: IndexBundle;
  scenario: ScenarioTrendPoint[];
  stakeholderTriad: Record<string, StakeholderTriad>;
};

async function loadTrendsData(): Promise<TrendsData> {
  const [indices, scenario, stakeholderTriad] = await Promise.all([
    getTownIndices(),
    getScenarioTrend(),
    getSustainabilityByStakeholder(),
  ]);
  return { indices, scenario, stakeholderTriad };
}

const RADAR_AXES = [
  { key: "economic", label: "Economic" },
  { key: "social", label: "Social" },
  { key: "environmental", label: "Environmental" },
];

/**
 * The Dashboard's "Trends" tab: KPIs, a scenario-trend line chart, a pillar
 * bar chart, a stakeholder radar, and a dynamic variable explorer.
 */
export default function TrendsTab() {
  const { status, data, error } = useAsync(loadTrendsData, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const [theme, setTheme] = useState<ThemeKey>("wsi");
  const [components, setComponents] = useState<BarDatum[] | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setExplorerLoading(true);
    getThemeVariables(theme)
      .then((res) => {
        if (cancelled) return;
        setComponents(
          res.components.map((c) => ({
            key: c.component,
            label: c.component.replace(/_/g, " "),
            value: c.value,
            hint: c.town_wide_proxy ? "town proxy" : undefined,
          })),
        );
      })
      .catch(() => !cancelled && setComponents([]))
      .finally(() => !cancelled && setExplorerLoading(false));
    return () => {
      cancelled = true;
    };
  }, [theme]);

  const kpis = useMemo(() => {
    if (status !== "ready") return null;
    const baseline = data.scenario.find((p) => p.multiplier === 1)?.tvi ?? data.indices.tvi;
    const extreme = data.scenario[data.scenario.length - 1]?.tvi ?? null;
    const delta = baseline !== null && extreme !== null ? extreme - baseline : null;
    const ranked = THEME_ORDER.map((t) => ({
      label: THEME_META[t].short,
      value: stressValue(t, data.indices.sub_indices[t] ?? null),
    }))
      .filter((r): r is { label: string; value: number } => r.value !== null)
      .sort((a, b) => b.value - a.value);
    return { baseline, extreme, delta, mostStressed: ranked[0] ?? null };
  }, [status, data]);

  const pillarBars: BarDatum[] = useMemo(() => {
    if (status !== "ready") return [];
    return THEME_ORDER.map((t) => ({
      key: t,
      label: THEME_META[t].short,
      value: data.indices.sub_indices[t] ?? null,
      hint: THEME_META[t].higherIsBetter ? "higher = better" : "higher = more pressure",
    }));
  }, [status, data]);

  const radarSeries: RadarSeries[] = useMemo(() => {
    if (status !== "ready") return [];
    return Object.entries(data.stakeholderTriad)
      .filter(([, v]) => v.economic !== null && v.social !== null && v.environmental !== null)
      .map(([survey, v], i) => ({
        key: survey,
        label: STAKEHOLDER_META[survey] ?? survey,
        values: { economic: v.economic, social: v.social, environmental: v.environmental },
        dashed: i % 2 === 1,
      }));
  }, [status, data]);

  useGSAP(
    () => {
      if (status !== "ready" || !rootRef.current || reducedMotion) return;
      const q = gsap.utils.selector(rootRef);
      gsap.from(q(".trends-kpi .panel"), { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.06 });
      gsap.from(q(".trends-section"), { autoAlpha: 0, y: 24, duration: 0.5, stagger: 0.1 });
    },
    { dependencies: [status, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <>
      {status === "loading" && <Loading label="LOADING REPORT" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && kpis && (
        <div ref={rootRef}>
          <div className="panel-grid trends-kpi">
            <div className="panel stat-panel">
              <span className="num mono-num">{kpis.baseline === null ? "--" : kpis.baseline.toFixed(1)}</span>
              <span className="label">Baseline TVI</span>
              <p>Town-wide, today&apos;s footfall.</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">{kpis.extreme === null ? "--" : kpis.extreme.toFixed(1)}</span>
              <span className="label">Extreme-weekend TVI</span>
              <p>Same index, at the ~16.7x peak-weekend scenario.</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">
                {kpis.delta === null ? "--" : `${kpis.delta >= 0 ? "+" : ""}${kpis.delta.toFixed(1)}`}
              </span>
              <span className="label">Point increase</span>
              <p>Baseline to extreme weekend.</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">{kpis.mostStressed ? Math.round(kpis.mostStressed.value * 100) : "--"}</span>
              <span className="label">Most-stressed pillar</span>
              <p>{kpis.mostStressed?.label ?? "No data yet"}</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">1,029</span>
              <span className="label">Survey responses</span>
              <p>Across 5 respondent groups, 9 zones.</p>
            </div>
          </div>

          <div className="panel trends-section trends-line-panel">
            <span className="eyebrow">Tourism intensity vs. vulnerability</span>
            <p className="trends-note">
              Not a 2000-2024 history -- this project has no year-by-year tourist-arrival data
              yet. This is the Stress Test&apos;s own real footfall-multiplier scenarios, town-wide,
              re-read as a trend.
            </p>
            <LineChart points={data.scenario.map((p) => ({ label: p.label, value: p.tvi }))} max={100} />
          </div>

          <div className="trends-two-col">
            <div className="panel trends-section trends-bars-panel">
              <span className="eyebrow">Six pillars, at a glance</span>
              <BarChartGeneric data={pillarBars} />
            </div>

            <div className="panel trends-section trends-radar-panel">
              <span className="eyebrow">Sustainability pressure, enterprises vs. residents</span>
              {radarSeries.length > 0 ? (
                <RadarChart axes={RADAR_AXES} series={radarSeries} />
              ) : (
                <p className="component-empty">Not enough populated groups to compare yet.</p>
              )}
            </div>
          </div>

          <div className="panel trends-section trends-explorer-panel">
            <span className="eyebrow">Explore any variable</span>
            <label className="trends-explorer-label" htmlFor="explorer-theme">
              Pick a pillar
            </label>
            <select
              id="explorer-theme"
              className="trends-explorer-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value as ThemeKey)}
            >
              {THEME_ORDER.map((t) => (
                <option key={t} value={t}>
                  {THEME_META[t].label}
                </option>
              ))}
            </select>
            {explorerLoading && <Loading label="LOADING VARIABLES" />}
            {!explorerLoading && components && <BarChartGeneric data={components} />}
          </div>
        </div>
      )}
    </>
  );
}
