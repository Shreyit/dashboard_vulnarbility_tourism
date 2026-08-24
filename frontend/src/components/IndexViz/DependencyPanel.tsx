import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import type { GroupComparison, ResidentAttitudesOut } from "../../api/types";
import CoxcombChart from "./CoxcombChart";
import "./DependencyPanel.css";

export type DependencyPillar = { key: "economic" | "social" | "environmental"; label: string };

type DependencyPanelProps = {
  data: ResidentAttitudesOut;
  pillars: DependencyPillar[];
  dependentLabel: string;
  nonDependentLabel: string;
  aggregateLabel: string;
  theoryNote: string;
};

function BandTag({ band }: { band: GroupComparison["band"] }) {
  return <span className={`attitude-band attitude-band-${band.replace(/\s+/g, "-")}`}>{band}</span>;
}

function PillarRow({ label, cmp }: { label: string; cmp: GroupComparison | null }) {
  if (!cmp) {
    return (
      <div className="attitude-row">
        <span className="attitude-row-label">{label}</span>
        <span className="attitude-row-empty">Not measured, or too few respondents in one group to test.</span>
      </div>
    );
  }
  return (
    <div className="attitude-row">
      <span className="attitude-row-label">{label}</span>
      <span className="mono-num">{cmp.mean_dependent.toFixed(2)}</span>
      <span className="attitude-row-sep">vs</span>
      <span className="mono-num">{cmp.mean_non_dependent.toFixed(2)}</span>
      <span className="mono-num attitude-row-stat">p={cmp.p_value.toFixed(3)}</span>
      <span className="mono-num attitude-row-stat">r={cmp.rank_biserial.toFixed(3)}</span>
      <BandTag band={cmp.band} />
    </div>
  );
}

/**
 * Tourism-dependent vs. non-dependent respondents, compared pillar by pillar:
 * the group-size split, a stat table (mean/significance/effect size), a coxcomb
 * pair for the visual read, and an auto-generated policy-signal sentence.
 * Generalized out of what was Residents-only (the old ResidentAttitudesTab) so Workers
 * gets the identical treatment -- same component, different data/labels.
 */
export default function DependencyPanel({
  data,
  pillars,
  dependentLabel,
  nonDependentLabel,
  aggregateLabel,
  theoryNote,
}: DependencyPanelProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const signal = useMemo(() => {
    const withGap = pillars
      .map((p) => ({ ...p, cmp: data.pillars[p.key] }))
      .filter((p): p is DependencyPillar & { cmp: GroupComparison } => p.cmp !== null)
      .map((p) => ({ ...p, gap: Math.abs(p.cmp.mean_dependent - p.cmp.mean_non_dependent) }));
    if (withGap.length < 2) return null;
    const strongest = withGap.reduce((a, b) => (b.gap > a.gap ? b : a));
    const weakest = withGap.reduce((a, b) => (b.gap < a.gap ? b : a));
    const direction = strongest.cmp.mean_dependent < strongest.cmp.mean_non_dependent ? "less" : "more";
    return { strongest, weakest, direction };
  }, [data, pillars]);

  const coxcombDependent = pillars.map((p) => ({
    key: p.key,
    label: p.label,
    value: data.pillars[p.key] ? data.pillars[p.key]!.mean_dependent * 100 : null,
  }));
  const coxcombNonDependent = pillars.map((p) => ({
    key: p.key,
    label: p.label,
    value: data.pillars[p.key] ? data.pillars[p.key]!.mean_non_dependent * 100 : null,
  }));

  useGSAP(
    () => {
      if (!rootRef.current || reducedMotion) return;
      const q = gsap.utils.selector(rootRef);
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q(".panel"), { autoAlpha: 0, y: 24, duration: 0.55, stagger: 0.1 })
        .from(q(".attitude-row"), { autoAlpha: 0, x: -14, duration: 0.35, stagger: 0.06 }, "-=0.3");
    },
    { dependencies: [data, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div ref={rootRef}>
      <p className="attitude-disclosure">{theoryNote}</p>

      <div className="panel attitude-groups-panel">
        <span className="eyebrow">Groups</span>
        <div className="attitude-groups">
          <div>
            <span className="num mono-num">{data.group_sizes.dependent}</span>
            <span className="label">{dependentLabel}</span>
          </div>
          <div>
            <span className="num mono-num">{data.group_sizes.non_dependent}</span>
            <span className="label">{nonDependentLabel}</span>
          </div>
        </div>
      </div>

      <div className="dependency-coxcomb-row">
        <div className="panel dependency-coxcomb-panel">
          <span className="eyebrow">{dependentLabel}</span>
          <CoxcombChart data={coxcombDependent} size={260} />
        </div>
        <div className="panel dependency-coxcomb-panel">
          <span className="eyebrow">{nonDependentLabel}</span>
          <CoxcombChart data={coxcombNonDependent} size={260} />
        </div>
      </div>

      <div className="panel attitude-table-panel">
        <span className="eyebrow">{aggregateLabel}, aggregate and by pillar</span>
        <div className="attitude-table">
          <div className="attitude-row attitude-row-head">
            <span className="attitude-row-label">Pillar</span>
            <span>Dependent</span>
            <span />
            <span>Non-dependent</span>
            <span>Sig.</span>
            <span>Effect</span>
            <span />
          </div>
          <PillarRow label={`${aggregateLabel} (aggregate)`} cmp={data.aggregate} />
          {pillars.map((p) => (
            <PillarRow key={p.key} label={p.label} cmp={data.pillars[p.key]} />
          ))}
        </div>
      </div>

      {signal && (
        <div className="panel attitude-signal-panel">
          <span className="eyebrow">Policy signal</span>
          <p>
            The <strong>{signal.strongest.label}</strong> pillar shows the largest gap: the dependent group
            reports {signal.direction} pressure than the non-dependent group (
            {signal.strongest.cmp.mean_dependent.toFixed(2)} vs {signal.strongest.cmp.mean_non_dependent.toFixed(2)},{" "}
            {signal.strongest.cmp.band}).{" "}
            {signal.direction === "less"
              ? "That is the direction Social Exchange Theory predicts -- direct economic benefit offsetting some of tourism's felt pressure."
              : "That runs counter to the direction Social Exchange Theory predicts."}{" "}
            The <strong>{signal.weakest.label}</strong> pillar shows almost no gap (
            {signal.weakest.cmp.mean_dependent.toFixed(2)} vs {signal.weakest.cmp.mean_non_dependent.toFixed(2)}),
            suggesting that concern is shared broadly regardless of tourism dependence.
          </p>
        </div>
      )}
    </div>
  );
}
