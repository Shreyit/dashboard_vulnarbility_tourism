import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getResidentAttitudes, getSustainabilityByStakeholder, getWorkerDependency } from "../../api/client";
import { STAKEHOLDER_META, type GroupComparison, type ResidentAttitudesOut, type StakeholderTriad } from "../../api/types";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import CoxcombGrid, { type CoxcombGridItem } from "../../components/IndexViz/CoxcombGrid";
import CoxcombChart, { type CoxcombSlice } from "../../components/IndexViz/CoxcombChart";
import RadarChart, { type RadarSeries } from "../../components/IndexViz/RadarChart";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "../../components/IndexViz/DependencyPanel.css";
import "./StakeholderTab.css";
import "./SynthesisTab.css";

const DEP_PILLAR_LABELS: { key: "economic" | "social" | "environmental"; label: string }[] = [
  { key: "economic", label: "Economic" },
  { key: "social", label: "Social" },
  { key: "environmental", label: "Environmental" },
];

/** One dependent/non-dependent coxcomb-pair's data, read off a ResidentAttitudesOut-shaped
 * comparison for whichever `side` -- shared by the Residents and Workers columns below. */
function dependencySlices(
  attitudes: ResidentAttitudesOut,
  side: "mean_dependent" | "mean_non_dependent",
  pillars: readonly { key: "economic" | "social" | "environmental"; label: string }[] = DEP_PILLAR_LABELS,
): CoxcombSlice[] {
  return pillars.map(({ key, label }) => {
    const cmp: GroupComparison | null = attitudes.pillars[key];
    return { key, label, value: cmp ? cmp[side] * 100 : null };
  });
}

const GROUP_ORDER = ["tourist", "enterprise", "residents", "workers"];
const RADAR_AXES = [
  { key: "economic", label: "Economic" },
  { key: "social", label: "Social" },
  { key: "environmental", label: "Environmental" },
];

async function loadSynthesisData() {
  const [triads, residentAttitudes, workerAttitudes] = await Promise.all([
    getSustainabilityByStakeholder(),
    getResidentAttitudes(),
    getWorkerDependency(),
  ]);
  return { triads, residentAttitudes, workerAttitudes };
}

/**
 * The payoff: every stakeholder's own pillar profile, side by side, then
 * overlaid, then split by tourism-dependence for the two groups where that
 * split is real (Residents, Workers). Everything here is a different read of
 * data already computed by the individual stakeholder tabs -- no new
 * aggregation happens on this screen.
 */
export default function SynthesisTab() {
  const { status, data, error } = useAsync(loadSynthesisData, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const coxcombItems: CoxcombGridItem[] = useMemo(() => {
    if (status !== "ready") return [];
    return GROUP_ORDER.filter((g) => data.triads[g]).map((g) => {
      const triad = data.triads[g] as StakeholderTriad;
      return {
        key: g,
        label: STAKEHOLDER_META[g] ?? g,
        data: [
          { key: "economic", label: "Economic", value: triad.economic },
          { key: "environmental", label: "Environmental", value: triad.environmental },
          { key: "social", label: "Social", value: triad.social },
        ],
      };
    });
  }, [status, data]);

  const radarSeries: RadarSeries[] = useMemo(() => {
    if (status !== "ready") return [];
    return GROUP_ORDER.filter((g) => {
      const t = data.triads[g];
      return t && t.economic !== null && t.social !== null && t.environmental !== null;
    }).map((g, i) => ({
      key: g,
      label: STAKEHOLDER_META[g] ?? g,
      values: { economic: data.triads[g].economic, social: data.triads[g].social, environmental: data.triads[g].environmental },
      dashed: i % 2 === 1,
    }));
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
      {status === "loading" && <Loading label="BUILDING SYNTHESIS" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && (
        <div ref={rootRef}>
          <p className="stakeholder-intro">
            Four groups, one triad. Each shape is that group&apos;s own Economic / Environmental /
            Social pressure -- the same triad each stakeholder tab already showed, here read
            together for the first time.
          </p>

          <div className="panel synthesis-grid-panel">
            <span className="eyebrow">Sustainability triad, by stakeholder</span>
            <CoxcombGrid items={coxcombItems} />
          </div>

          <div className="panel synthesis-radar-panel">
            <span className="eyebrow">Overlaid for direct comparison</span>
            <p className="stakeholder-note" style={{ maxWidth: "52ch" }}>
              Workers are missing here (not shown as zero) -- their Environmental pillar has no
              survey data at all, and this overlay only plots groups with all three pillars
              present. See the coxcomb grid above, or the Workers tab, for their partial profile.
            </p>
            {radarSeries.length > 0 ? (
              <RadarChart axes={RADAR_AXES} series={radarSeries} size={360} />
            ) : (
              <p className="component-empty">Not enough populated groups to compare yet.</p>
            )}
          </div>

          <div className="panel synthesis-dependency-panel">
            <span className="eyebrow">Tourism-dependent vs. non-dependent, by group</span>
            <p className="stakeholder-note" style={{ maxWidth: "60ch", marginInline: 0 }}>
              The two groups where a clean tourism-dependence split exists in the survey data.
              Enterprise is excluded -- every enterprise respondent already runs a tourism
              business, so there&apos;s no non-dependent comparison group to draw against.
            </p>
            <div className="synthesis-dependency-grid">
              <div className="synthesis-dependency-col">
                <span className="synthesis-dependency-label">Residents</span>
                <div className="dependency-coxcomb-row">
                  <div className="panel dependency-coxcomb-panel">
                    <span className="eyebrow">Dependent</span>
                    <CoxcombChart size={200} data={dependencySlices(data.residentAttitudes, "mean_dependent")} />
                  </div>
                  <div className="panel dependency-coxcomb-panel">
                    <span className="eyebrow">Non-dependent</span>
                    <CoxcombChart size={200} data={dependencySlices(data.residentAttitudes, "mean_non_dependent")} />
                  </div>
                </div>
              </div>

              <div className="synthesis-dependency-col">
                <span className="synthesis-dependency-label">Workers</span>
                <div className="dependency-coxcomb-row">
                  <div className="panel dependency-coxcomb-panel">
                    <span className="eyebrow">Dependent</span>
                    <CoxcombChart size={200} data={dependencySlices(data.workerAttitudes, "mean_dependent")} />
                  </div>
                  <div className="panel dependency-coxcomb-panel">
                    <span className="eyebrow">Non-dependent</span>
                    <CoxcombChart size={200} data={dependencySlices(data.workerAttitudes, "mean_non_dependent")} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
