import { useMemo, useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getDemographics, getInsights, getTownIndices } from "../../api/client";
import { loadZonesWithIndices, type ZoneWithIndices } from "../../api/loadZonesWithIndices";
import {
  STAKEHOLDER_COLORS,
  THEME_META,
  THEME_ORDER,
  type DemographicsOut,
  type IndexBundle,
  type InsightsOut,
  type ThemeKey,
} from "../../api/types";
import { stressValue } from "../../lib/pillarStress";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import RadialGauge from "../../components/IndexViz/RadialGauge";
import SubIndexBar from "../../components/IndexViz/SubIndexBar";
import StackedBarChart from "../../components/IndexViz/StackedBarChart";
import KpiRow from "../../components/IndexViz/KpiRow";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./OverviewTab.css";

type OverviewData = {
  indices: IndexBundle;
  insights: InsightsOut;
  zones: ZoneWithIndices[];
  demographics: DemographicsOut;
};

async function loadOverviewData(): Promise<OverviewData> {
  const [indices, insights, zones, demographics] = await Promise.all([
    getTownIndices(),
    getInsights(),
    loadZonesWithIndices(),
    getDemographics(),
  ]);
  return { indices, insights, zones, demographics };
}

export default function OverviewTab() {
  const { status, data, error } = useAsync(loadOverviewData, []);
  const [expanded, setExpanded] = useState<ThemeKey | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const detailRefs = useRef<Partial<Record<ThemeKey, HTMLDivElement | null>>>({});
  const reducedMotion = useReducedMotion();

  const kpis = useMemo(() => {
    if (status !== "ready") return null;
    const { indices, insights, zones } = data;
    const ranked = THEME_ORDER.map((theme) => ({
      theme,
      label: THEME_META[theme].short,
      value: stressValue(theme, indices.sub_indices[theme] ?? null),
    })).filter((r): r is { theme: ThemeKey; label: string; value: number } => r.value !== null);
    ranked.sort((a, b) => b.value - a.value);
    const mostStressed = ranked[0] ?? null;
    const leastStressed = ranked[ranked.length - 1] ?? null;

    const rankedZones = zones
      .filter((z) => z.bundle.tvi !== null)
      .sort((a, b) => (b.bundle.tvi ?? 0) - (a.bundle.tvi ?? 0));
    const mostVulnerableZone = rankedZones[0]
      ? { name: rankedZones[0].zone.name, tvi: rankedZones[0].bundle.tvi as number }
      : null;

    return {
      tvi: indices.tvi,
      mostStressed,
      leastStressed,
      mostVulnerableZone,
      seasonality: insights.seasonality.value,
      hostVisitorGap: insights.host_visitor_gap.gap,
    };
  }, [status, data]);

  // ---- entrance: the panels get stamped down rather than faded up ----
  useGSAP(
    () => {
      if (status !== "ready" || !gridRef.current || reducedMotion) return;
      const q = gsap.utils.selector(gridRef);

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q(".kpi-row .panel"), { autoAlpha: 0, y: 18, duration: 0.5, stagger: 0.06 })
        .from(
          q(".overview-grid > .panel"),
          {
            autoAlpha: 0,
            y: 26,
            scale: 0.97,
            rotation: -0.5,
            duration: 0.6,
            ease: "back.out(1.5)",
            stagger: 0.12,
          },
          "-=0.25",
        )
        .from(q(".overview-bars-panel .subindex-bar"), { autoAlpha: 0, x: -14, duration: 0.4, stagger: 0.06 }, "-=0.3")
        .from(q(".overview-demo-panel"), { autoAlpha: 0, y: 20, duration: 0.5 }, "-=0.2")
        .from(q(".eyebrow"), { autoAlpha: 0, duration: 0.3 }, 0.2);
    },
    { dependencies: [status, reducedMotion], scope: gridRef, revertOnUpdate: true },
  );

  // ---- pillar breakdown opens and closes as a height animation ----
  useGSAP(
    () => {
      if (status !== "ready") return;
      THEME_ORDER.forEach((theme) => {
        const el = detailRefs.current[theme];
        if (!el) return;
        const open = expanded === theme;

        if (reducedMotion) {
          gsap.set(el, { height: open ? "auto" : 0, autoAlpha: open ? 1 : 0 });
          return;
        }

        gsap.to(el, {
          height: open ? "auto" : 0,
          autoAlpha: open ? 1 : 0,
          duration: 0.42,
          ease: "power3.inOut",
          overwrite: true,
        });
        if (open) {
          gsap.from(el.querySelectorAll(".component-row"), {
            autoAlpha: 0,
            x: -12,
            duration: 0.32,
            stagger: 0.035,
            ease: "power2.out",
            overwrite: true,
          });
        }
      });
    },
    { dependencies: [expanded, status, reducedMotion], scope: gridRef },
  );

  return (
    <>
      {status === "loading" && <Loading label="COMPUTING INDEX" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && kpis && (
        <div ref={gridRef}>
          <KpiRow
            tvi={kpis.tvi}
            mostStressed={kpis.mostStressed}
            leastStressed={kpis.leastStressed}
            mostVulnerableZone={kpis.mostVulnerableZone}
            seasonality={kpis.seasonality}
            hostVisitorGap={kpis.hostVisitorGap}
          />

          <div className="overview-grid">
            <div className="panel overview-gauge-panel">
              <RadialGauge value={data.indices.tvi} label="TVI" size={240} />
            </div>

            <div className="panel overview-bars-panel">
              <span className="eyebrow">Six pillars</span>
              <div style={{ marginTop: "var(--sp-3)" }}>
                {THEME_ORDER.map((theme) => (
                  <div key={theme}>
                    <SubIndexBar
                      theme={theme}
                      value={data.indices.sub_indices[theme] ?? null}
                      active={expanded === theme}
                      onClick={() => setExpanded(expanded === theme ? null : theme)}
                    />
                    <div
                      className="component-list-shell"
                      ref={(el) => {
                        detailRefs.current[theme] = el;
                      }}
                    >
                      <div className="component-list">
                        {(data.indices.details[theme] ?? []).map((c) => (
                          <div className="component-row" key={c.component}>
                            <span className="name">{c.component.replace(/_/g, " ")}</span>
                            <span className="value mono-num">{Math.round(c.value * 100)}</span>
                            {c.town_wide_proxy && <span className="proxy-flag">town proxy</span>}
                          </div>
                        ))}
                        {(data.indices.details[theme] ?? []).length === 0 && (
                          <p className="component-empty">No components with usable data for this view.</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel overview-demo-panel">
            <span className="eyebrow">Who we surveyed -- {data.demographics.zones_surveyed} zones</span>
            <p className="overview-insights-note">
              1,029 responses across 4 stakeholder groups. Each group&apos;s own story -- how tourism
              affects them, and their own demographic mix -- lives on its own tab next.
            </p>
            <div style={{ marginTop: "var(--sp-3)" }}>
              <StackedBarChart
                segments={data.demographics.respondent_mix.map((b) => ({
                  key: b.label,
                  label: b.label,
                  value: b.value,
                  count: b.count,
                  color: STAKEHOLDER_COLORS[b.label],
                }))}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
