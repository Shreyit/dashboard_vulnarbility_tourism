import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getDemographics, getInsights, getSustainabilityByStakeholder, getThemeVariables } from "../../api/client";
import { THEME_META, type ThemeKey } from "../../api/types";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import CoxcombChart from "../../components/IndexViz/CoxcombChart";
import ScoreScale from "../../components/IndexViz/ScoreScale";
import BarChartGeneric, { type BarDatum } from "../../components/IndexViz/BarChartGeneric";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./StakeholderTab.css";

const ENTERPRISE_THEMES: ThemeKey[] = ["wsi", "wspi", "edpi", "scpi"];

async function loadEnterpriseData() {
  const [insights, triads, demographics, wsi, edpi] = await Promise.all([
    getInsights(),
    getSustainabilityByStakeholder(),
    getDemographics(),
    getThemeVariables("wsi"),
    getThemeVariables("edpi"),
  ]);
  return { insights, triads, demographics, wsi, edpi };
}

function toBars(bars: { label: string; value: number; count: number }[]): BarDatum[] {
  return bars.map((b) => ({ key: b.label, label: b.label, value: b.value, hint: `${b.count} responses` }));
}

function pickComponent(components: { component: string; value: number }[], suffix: string): number | null {
  const hit = components.find((c) => c.component === suffix);
  return hit ? hit.value : null;
}

/**
 * Enterprises are the supply side: every respondent in this survey already
 * runs a tourism-related business, so unlike Residents/Workers there's no
 * "tourism-dependent vs. not" cut to make here -- the whole group is
 * tourism-dependent by construction. Instead this tab profiles the pressure
 * they carry: water constraints, waste/sewage practice, and how much of the
 * benefit stays local (non-local employment share).
 */
export default function EnterprisesTab() {
  const { status, data, error } = useAsync(loadEnterpriseData, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const pillarBars: BarDatum[] = useMemo(() => {
    if (status !== "ready") return [];
    const row = data.insights.stakeholder_matrix.matrix.enterprise ?? {};
    return ENTERPRISE_THEMES.filter((t) => row[t] !== null && row[t] !== undefined).map((t) => ({
      key: t,
      label: THEME_META[t].short,
      value: row[t] ?? null,
      hint: THEME_META[t].higherIsBetter ? "higher = better" : "higher = more pressure",
    }));
  }, [status, data]);

  const kpis = useMemo(() => {
    if (status !== "ready") return null;
    return {
      waterConstraint: pickComponent(data.wsi.components, "enterprise_water_constraint_stress"),
      tankerDependency: pickComponent(data.wsi.components, "enterprise_tanker_dependency"),
      nonLocalEmployment: pickComponent(data.edpi.components, "enterprise_non_local_employment_share"),
    };
  }, [status, data]);

  useGSAP(
    () => {
      if (status !== "ready" || !rootRef.current || reducedMotion) return;
      const q = gsap.utils.selector(rootRef);
      gsap.timeline({ defaults: { ease: "power3.out" } }).from(q(".panel"), { autoAlpha: 0, y: 22, duration: 0.5, stagger: 0.08 });
    },
    { dependencies: [status, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <>
      {status === "loading" && <Loading label="LOADING ENTERPRISE DATA" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && kpis && (
        <div ref={rootRef}>
          <p className="stakeholder-intro">
            154 tourism-related enterprises surveyed. Every respondent here already runs a
            tourism business -- so there&apos;s no dependent/non-dependent split to draw; the whole
            group carries the same structural exposure. What varies is how much operating pressure
            (water, waste) they absorb, and how much of the benefit stays local.
          </p>

          <div className="stakeholder-kpi-row">
            <div className="panel stat-panel">
              <span className="num mono-num">{kpis.waterConstraint === null ? "--" : Math.round(kpis.waterConstraint * 100)}</span>
              <span className="label">Water constraint stress</span>
              <p>Share reporting water shortages affected operations.</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">{kpis.tankerDependency === null ? "--" : Math.round(kpis.tankerDependency * 100)}</span>
              <span className="label">Tanker-water dependency</span>
              <p>Share whose primary water source is a private tanker.</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">{kpis.nonLocalEmployment === null ? "--" : Math.round(kpis.nonLocalEmployment * 100)}</span>
              <span className="label">Non-local employment share</span>
              <p>Share of staff who aren&apos;t Nainital-district residents.</p>
            </div>
          </div>

          <div className="stakeholder-grid">
            <div className="panel stakeholder-coxcomb-panel">
              <span className="eyebrow">Enterprise, on the sustainability triad</span>
              <CoxcombChart
                data={[
                  { key: "economic", label: "Economic", value: data.triads.enterprise?.economic ?? null },
                  { key: "environmental", label: "Environmental", value: data.triads.enterprise?.environmental ?? null },
                  { key: "social", label: "Social", value: data.triads.enterprise?.social ?? null },
                ]}
              />
              <ScoreScale />
            </div>

            <div className="panel stakeholder-bars-panel">
              <span className="eyebrow">Where enterprises show up in the six pillars</span>
              <BarChartGeneric data={pillarBars} />
            </div>
          </div>

          <div className="panel stakeholder-demo-panel">
            <span className="eyebrow">Enterprise type</span>
            <BarChartGeneric data={toBars(data.demographics.enterprise_type)} max={100} />
          </div>
        </div>
      )}
    </>
  );
}
