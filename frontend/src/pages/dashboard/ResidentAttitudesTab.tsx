import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getResidentAttitudes } from "../../api/client";
import type { GroupComparison } from "../../api/types";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./ResidentAttitudesTab.css";

const PILLARS: { key: "economic" | "social" | "environmental"; label: string }[] = [
  { key: "economic", label: "Economic" },
  { key: "social", label: "Social" },
  { key: "environmental", label: "Environmental" },
];

function BandTag({ band }: { band: GroupComparison["band"] }) {
  return <span className={`attitude-band attitude-band-${band.replace(/\s+/g, "-")}`}>{band}</span>;
}

function PillarRow({ label, cmp }: { label: string; cmp: GroupComparison | null }) {
  if (!cmp) {
    return (
      <div className="attitude-row">
        <span className="attitude-row-label">{label}</span>
        <span className="attitude-row-empty">Not enough respondents in one group to test.</span>
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
 * Does tourism dependence correlate with less "irritation" at tourism's pressure,
 * per Social Exchange Theory? Every number here is computed fresh, this session,
 * from the real 239 residents (backend/app/resident_attitudes.py) -- this
 * project's own pillar definitions and a real Mann-Whitney U test, not a
 * reproduction of any externally reported figure.
 */
export default function ResidentAttitudesTab() {
  const { status, data, error } = useAsync(getResidentAttitudes, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const signal = useMemo(() => {
    if (status !== "ready") return null;
    const withGap = PILLARS.map((p) => ({ ...p, cmp: data.pillars[p.key] }))
      .filter((p): p is { key: typeof p.key; label: string; cmp: GroupComparison } => p.cmp !== null)
      .map((p) => ({ ...p, gap: Math.abs(p.cmp.mean_dependent - p.cmp.mean_non_dependent) }));
    if (withGap.length < 2) return null;
    const strongest = withGap.reduce((a, b) => (b.gap > a.gap ? b : a));
    const weakest = withGap.reduce((a, b) => (b.gap < a.gap ? b : a));
    const direction = strongest.cmp.mean_dependent < strongest.cmp.mean_non_dependent ? "less" : "more";
    return { strongest, weakest, direction };
  }, [status, data]);

  useGSAP(
    () => {
      if (status !== "ready" || !rootRef.current || reducedMotion) return;
      const q = gsap.utils.selector(rootRef);
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q(".panel"), { autoAlpha: 0, y: 24, duration: 0.55, stagger: 0.12 })
        .from(q(".attitude-row"), { autoAlpha: 0, x: -14, duration: 0.35, stagger: 0.07 }, "-=0.3");
    },
    { dependencies: [status, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <>
      {status === "loading" && <Loading label="RUNNING GROUP TEST" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && (
        <div ref={rootRef}>
          <p className="attitude-disclosure">
            Social Exchange Theory predicts residents who benefit materially from tourism report
            less irritation at its pressure than those who don&apos;t. Every number below is this
            project&apos;s own pillar definitions (the same components the Socio-Cultural Pressure
            Index already uses, split three ways) and a fresh Mann-Whitney U test on the real 239
            residents -- not a reproduction of any external report.
          </p>

          <div className="panel attitude-groups-panel">
            <span className="eyebrow">Groups</span>
            <div className="attitude-groups">
              <div>
                <span className="num mono-num">{data.group_sizes.dependent}</span>
                <span className="label">Tourism-dependent residents</span>
              </div>
              <div>
                <span className="num mono-num">{data.group_sizes.non_dependent}</span>
                <span className="label">Non-dependent residents</span>
              </div>
            </div>
          </div>

          <div className="panel attitude-table-panel">
            <span className="eyebrow">Resident Irritation Index (RII), aggregate and by pillar</span>
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
              <PillarRow label="RII (aggregate)" cmp={data.aggregate} />
              {PILLARS.map((p) => (
                <PillarRow key={p.key} label={p.label} cmp={data.pillars[p.key]} />
              ))}
            </div>
          </div>

          {signal && (
            <div className="panel attitude-signal-panel">
              <span className="eyebrow">Policy signal</span>
              <p>
                The <strong>{signal.strongest.label}</strong> pillar shows the largest gap:
                tourism-dependent residents report {signal.direction} irritation than non-dependent
                residents ({signal.strongest.cmp.mean_dependent.toFixed(2)} vs{" "}
                {signal.strongest.cmp.mean_non_dependent.toFixed(2)}, {signal.strongest.cmp.band}).{" "}
                {signal.direction === "less"
                  ? "That is the direction Social Exchange Theory predicts -- direct economic benefit offsetting some of tourism's felt pressure."
                  : "That runs counter to the direction Social Exchange Theory predicts."}{" "}
                The <strong>{signal.weakest.label}</strong> pillar shows almost no gap (
                {signal.weakest.cmp.mean_dependent.toFixed(2)} vs{" "}
                {signal.weakest.cmp.mean_non_dependent.toFixed(2)}), suggesting that concern is
                shared broadly across the resident population regardless of tourism dependence -- an
                intervention framed around it would likely find support on both sides of the
                dependency line.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
