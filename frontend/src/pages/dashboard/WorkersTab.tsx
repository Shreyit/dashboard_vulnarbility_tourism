import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getDemographics, getInsights, getSustainabilityByStakeholder, getWorkerDependency } from "../../api/client";
import { THEME_META, type ThemeKey } from "../../api/types";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import CoxcombChart from "../../components/IndexViz/CoxcombChart";
import ScoreScale from "../../components/IndexViz/ScoreScale";
import BarChartGeneric, { type BarDatum } from "../../components/IndexViz/BarChartGeneric";
import DependencyPanel from "../../components/IndexViz/DependencyPanel";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./StakeholderTab.css";

const WORKER_THEMES: ThemeKey[] = ["edpi"];
const DEPENDENCY_PILLARS = [
  { key: "economic" as const, label: "Economic" },
  { key: "social" as const, label: "Social" },
];

async function loadWorkersData() {
  const [insights, triads, demographics, attitudes] = await Promise.all([
    getInsights(),
    getSustainabilityByStakeholder(),
    getDemographics(),
    getWorkerDependency(),
  ]);
  return { insights, triads, demographics, attitudes };
}

function toBars(bars: { label: string; value: number; count: number }[]): BarDatum[] {
  return bars.map((b) => ({ key: b.label, label: b.label, value: b.value, hint: `${b.count} responses` }));
}

/**
 * Workers -- tourism-linked labour (guides, boatmen, drivers, hospitality
 * staff) -- are this project's thinnest-measured group: only Economic
 * Dependency & Precarity has any Worker-sourced components, and nothing here
 * measures their environmental exposure at all. That gap is real, not a bug --
 * flagged rather than papered over (framework_esac.py and insights.py both
 * carry the same "NOT MEASURED" for Worker/Environmental).
 */
export default function WorkersTab() {
  const { status, data, error } = useAsync(loadWorkersData, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const pillarBars: BarDatum[] = useMemo(() => {
    if (status !== "ready") return [];
    const row = data.insights.stakeholder_matrix.matrix.workers ?? {};
    return WORKER_THEMES.filter((t) => row[t] !== null && row[t] !== undefined).map((t) => ({
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
      // Scoped to this tab's own panels only, not `.panel` -- DependencyPanel below
      // owns its own entrance animation for its nested panels; targeting both would
      // race two GSAP tweens over the same elements and strand them at autoAlpha:0.
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q(".stakeholder-grid > .panel"), { autoAlpha: 0, y: 22, duration: 0.5, stagger: 0.08 });
    },
    { dependencies: [status, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <>
      {status === "loading" && <Loading label="LOADING WORKER DATA" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && (
        <div ref={rootRef}>
          <p className="stakeholder-intro">
            294 tourism-linked workers surveyed -- guides, boatmen, drivers, hospitality and
            adventure-activity staff. The thinnest-measured group in this project: only economic
            precarity has dedicated survey components, and nothing measures their environmental
            exposure at all. That gap is shown, not hidden.
          </p>

          <div className="stakeholder-grid">
            <div className="panel stakeholder-coxcomb-panel">
              <span className="eyebrow">Workers, on the sustainability triad</span>
              <CoxcombChart
                data={[
                  { key: "economic", label: "Economic", value: data.triads.workers?.economic ?? null },
                  { key: "environmental", label: "Environmental", value: data.triads.workers?.environmental ?? null },
                  { key: "social", label: "Social", value: data.triads.workers?.social ?? null },
                ]}
              />
              <p className="stakeholder-note">
                Environmental is blank -- not zero -- because no survey question asks workers about
                environmental conditions at all.
              </p>
              <ScoreScale />
            </div>
            <div className="panel stakeholder-bars-panel">
              <span className="eyebrow">Where workers show up in the six pillars</span>
              <BarChartGeneric data={pillarBars} />
              {pillarBars.length <= 1 && (
                <p className="component-empty">
                  Workers only carry components in one of the six pillars (Economic Dependency &amp;
                  Precarity) -- Water, Waste, Infrastructure, Socio-Cultural and Visitor Experience
                  simply weren&apos;t asked of this group.
                </p>
              )}
              <div className="stakeholder-subchart">
                <span className="eyebrow">Worker sector</span>
                <BarChartGeneric data={toBars(data.demographics.worker_sector)} max={100} />
              </div>
            </div>
          </div>

          <DependencyPanel
            data={data.attitudes}
            pillars={DEPENDENCY_PILLARS}
            dependentLabel="Tourism-income-dependent workers"
            nonDependentLabel="Less-dependent workers"
            aggregateLabel="Worker Precarity Index"
            theoryNote="Same Social Exchange Theory test as the Residents tab, applied to Workers: does relying on tourism for the majority of annual income (tourism_income_dependency >= 0.5) correlate with a different precarity read? Environmental is omitted -- not measured for this group anywhere in this project."
          />
        </div>
      )}
    </>
  );
}
