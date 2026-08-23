import { useMemo, useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getDemographics, getInsights, getTownIndices } from "../../api/client";
import { loadZonesWithIndices, type ZoneWithIndices } from "../../api/loadZonesWithIndices";
import {
  THEME_META,
  THEME_ORDER,
  type DemographicBar,
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
import CoxcombChart from "../../components/IndexViz/CoxcombChart";
import StakeholderMatrixGrid from "../../components/IndexViz/StakeholderMatrixGrid";
import BarChartGeneric, { type BarDatum } from "../../components/IndexViz/BarChartGeneric";
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

function toBars(bars: DemographicBar[]): BarDatum[] {
  return bars.map((b) => ({ key: b.label, label: b.label, value: b.value, hint: `${b.count} responses` }));
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
        .from(q(".overview-insights-grid > .panel"), { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.12 }, "-=0.2")
        .from(q(".overview-demographics-grid > .panel"), { autoAlpha: 0, y: 20, duration: 0.5, stagger: 0.1 }, "-=0.2")
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

          <div className="overview-insights-grid">
            <div className="panel overview-coxcomb-panel">
              <span className="eyebrow">Sustainability triad</span>
              <p className="overview-insights-note">
                The 6 pillars regrouped into Economic / Social / Environmental (Triple Bottom
                Line), unified so radius = stress. See Methodology for the exact grouping.
              </p>
              <CoxcombChart
                data={[
                  { key: "economic", label: "Economic", value: data.insights.sustainability.economic },
                  { key: "social", label: "Social", value: data.insights.sustainability.social },
                  { key: "environmental", label: "Environmental", value: data.insights.sustainability.environmental },
                ]}
              />
            </div>

            <div className="panel overview-matrix-panel">
              <span className="eyebrow">Who feels it, and where</span>
              <p className="overview-insights-note">
                Each cell: how much pressure that respondent group&apos;s own answers show on that
                pillar (0-100, higher = more pressure). Blank cells mean that group wasn&apos;t
                asked about that pillar.
              </p>
              <StakeholderMatrixGrid data={data.insights.stakeholder_matrix} />
            </div>
          </div>

          <div className="overview-demographics-grid">
            <div className="panel overview-demo-panel">
              <span className="eyebrow">
                Who we surveyed -- {data.demographics.zones_surveyed} zones
              </span>
              <div style={{ marginTop: "var(--sp-3)" }}>
                <BarChartGeneric data={toBars(data.demographics.respondent_mix)} max={100} />
              </div>
            </div>

            <div className="panel overview-demo-panel">
              <span className="eyebrow">Tourist profile</span>
              <div className="overview-demo-subchart" style={{ marginTop: "var(--sp-3)" }}>
                <span className="overview-demo-sublabel">Age group</span>
                <BarChartGeneric data={toBars(data.demographics.tourist_age_group)} max={100} />
              </div>
              <div className="overview-demo-subchart">
                <span className="overview-demo-sublabel">Gender</span>
                <BarChartGeneric data={toBars(data.demographics.tourist_gender)} max={100} />
              </div>
            </div>

            <div className="panel overview-demo-panel">
              <span className="eyebrow">Visit pattern</span>
              <div className="overview-demo-subchart" style={{ marginTop: "var(--sp-3)" }}>
                <span className="overview-demo-sublabel">First-time vs. repeat visitor</span>
                <BarChartGeneric data={toBars(data.demographics.tourist_first_visit)} max={100} />
              </div>
              <div className="overview-demo-subchart">
                <span className="overview-demo-sublabel">Accommodation type</span>
                <BarChartGeneric data={toBars(data.demographics.tourist_accommodation)} max={100} />
              </div>
            </div>

            <div className="panel overview-demo-panel">
              <span className="eyebrow">Livelihoods -- enterprise &amp; worker mix</span>
              <div className="overview-demo-subchart" style={{ marginTop: "var(--sp-3)" }}>
                <span className="overview-demo-sublabel">Enterprise type</span>
                <BarChartGeneric data={toBars(data.demographics.enterprise_type)} max={100} />
              </div>
              <div className="overview-demo-subchart">
                <span className="overview-demo-sublabel">Worker sector</span>
                <BarChartGeneric data={toBars(data.demographics.worker_sector)} max={100} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
