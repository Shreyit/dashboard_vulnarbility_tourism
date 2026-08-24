import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getDemographics, getInsights, getSustainabilityByStakeholder } from "../../api/client";
import { THEME_META, type ThemeKey } from "../../api/types";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import CoxcombChart from "../../components/IndexViz/CoxcombChart";
import BarChartGeneric, { type BarDatum } from "../../components/IndexViz/BarChartGeneric";
import ColumnChart from "../../components/IndexViz/ColumnChart";
import StackedBarChart from "../../components/IndexViz/StackedBarChart";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./StakeholderTab.css";

const TOURIST_THEMES: ThemeKey[] = ["wspi", "iai", "vei"];
const AGE_ORDER = ["Below 18", "18-25", "26-35", "36-45", "46-60", "Above 60"];

async function loadTouristData() {
  const [insights, triads, demographics] = await Promise.all([
    getInsights(),
    getSustainabilityByStakeholder(),
    getDemographics(),
  ]);
  return { insights, triads, demographics };
}

function toBars(bars: { label: string; value: number; count: number }[]): BarDatum[] {
  return bars.map((b) => ({ key: b.label, label: b.label, value: b.value, hint: `${b.count} responses` }));
}

function sortByAge(bars: { label: string; value: number; count: number }[]) {
  return [...bars].sort((a, b) => AGE_ORDER.indexOf(a.label) - AGE_ORDER.indexOf(b.label));
}

/**
 * Tourists are the demand side: they generate the footfall the other three
 * groups absorb. Their own pillar reads come from visitor-experience and
 * on-the-ground pressure questions -- how little they spend locally is the
 * economic cut (see derive.py's low_local_economic_engagement), not income
 * dependency, since a tourist has no local livelihood at stake.
 */
export default function TouristsTab() {
  const { status, data, error } = useAsync(loadTouristData, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const pillarBars: BarDatum[] = useMemo(() => {
    if (status !== "ready") return [];
    const row = data.insights.stakeholder_matrix.matrix.tourist ?? {};
    return TOURIST_THEMES.filter((t) => row[t] !== null && row[t] !== undefined).map((t) => ({
      key: t,
      label: THEME_META[t].short,
      value: row[t] ?? null,
      hint: THEME_META[t].higherIsBetter ? "higher = better" : "higher = more pressure",
    }));
  }, [status, data]);

  useGSAP(
    () => {
      if (status !== "ready" || !rootRef.current || reducedMotion) return;
      const q = gsap.utils.selector(rootRef);
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q(".panel"), { autoAlpha: 0, y: 22, duration: 0.5, stagger: 0.1 });
    },
    { dependencies: [status, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <>
      {status === "loading" && <Loading label="LOADING TOURIST DATA" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && (
        <div ref={rootRef}>
          <p className="stakeholder-intro">
            314 tourists surveyed. This group generates the pressure the other three groups feel --
            here&apos;s the pressure they report feeling and creating themselves.
          </p>

          <div className="stakeholder-grid">
            <div className="panel stakeholder-coxcomb-panel">
              <span className="eyebrow">Tourist, on the sustainability triad</span>
              <CoxcombChart
                data={[
                  { key: "economic", label: "Economic", value: data.triads.tourist?.economic ?? null },
                  { key: "environmental", label: "Environmental", value: data.triads.tourist?.environmental ?? null },
                  { key: "social", label: "Social", value: data.triads.tourist?.social ?? null },
                ]}
              />
              <p className="stakeholder-note">
                Economic here reads &quot;how little a tourist spends locally&quot; (no local guides, no
                local products) -- not income dependency, since tourists don&apos;t rely on Nainital
                for a living.
              </p>
            </div>

            <div className="panel stakeholder-bars-panel">
              <span className="eyebrow">Where tourists show up in the six pillars</span>
              <BarChartGeneric data={pillarBars} />
            </div>
          </div>

          <div className="panel stakeholder-hvg-panel">
            <span className="eyebrow">Host-visitor perception gap (Doxey&apos;s Irridex)</span>
            <div className="stakeholder-hvg-row">
              <div>
                <span className="num mono-num">
                  {data.insights.host_visitor_gap.visitor_satisfaction === null
                    ? "--"
                    : data.insights.host_visitor_gap.visitor_satisfaction.toFixed(2)}
                </span>
                <span className="label">Tourist satisfaction</span>
              </div>
              <div>
                <span className="num mono-num">
                  {data.insights.host_visitor_gap.host_sentiment === null
                    ? "--"
                    : data.insights.host_visitor_gap.host_sentiment.toFixed(2)}
                </span>
                <span className="label">Host sentiment</span>
              </div>
              <div>
                <span className="num mono-num">{data.insights.host_visitor_gap.doxey_stage ?? "--"}</span>
                <span className="label">Doxey stage</span>
              </div>
            </div>
          </div>

          <div className="stakeholder-demo-grid">
            <div className="panel stakeholder-demo-panel">
              <span className="eyebrow">Age group</span>
              <ColumnChart
                data={sortByAge(data.demographics.tourist_age_group).map((b) => ({
                  key: b.label,
                  label: b.label,
                  value: b.value,
                  hint: `${b.count} responses`,
                }))}
                max={100}
              />
            </div>
            <div className="panel stakeholder-demo-panel">
              <span className="eyebrow">Gender</span>
              <StackedBarChart
                segments={data.demographics.tourist_gender.map((b) => ({
                  key: b.label,
                  label: b.label,
                  value: b.value,
                  count: b.count,
                }))}
              />
            </div>
            <div className="panel stakeholder-demo-panel">
              <span className="eyebrow">First-time vs. repeat visitor</span>
              <StackedBarChart
                segments={data.demographics.tourist_first_visit.map((b) => ({
                  key: b.label,
                  label: b.label === "Yes" ? "First-time" : b.label === "No" ? "Repeat" : b.label,
                  value: b.value,
                  count: b.count,
                }))}
              />
            </div>
            <div className="panel stakeholder-demo-panel">
              <span className="eyebrow">Accommodation type</span>
              <BarChartGeneric data={toBars(data.demographics.tourist_accommodation)} max={100} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
