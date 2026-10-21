import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getDependencyModel, getSensitivity, getZoneClusters } from "../../api/client";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import ScatterChart, { type ScatterGroup, type ScatterPoint } from "../../components/IndexViz/ScatterChart";
import BarChartGeneric, { type BarDatum } from "../../components/IndexViz/BarChartGeneric";
import RangeBarChart, { type RangeDatum } from "../../components/IndexViz/RangeBarChart";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./StakeholderTab.css";
import "./ModelInsightsTab.css";

async function loadModelInsightsData() {
  const [clusters, dependencyModel, sensitivity] = await Promise.all([
    getZoneClusters(),
    getDependencyModel(),
    getSensitivity(),
  ]);
  return { clusters, dependencyModel, sensitivity };
}

const THEME_SHORT: Record<string, string> = {
  wsi: "Water",
  wspi: "Waste & Sanitation",
  iai: "Infrastructure",
  edpi: "Economic Precarity",
  scpi: "Socio-Cultural",
  vei: "Visitor Experience",
};

/**
 * Three independent checks on the composite-index approach the rest of the
 * dashboard is built on: do the 9 zones actually cluster into distinct
 * archetypes, does a resident's living-condition profile predict anything
 * real, and how much would the TVI ranking move if the pillar weights
 * themselves were off. Each panel is a different technique (unsupervised,
 * supervised, Monte Carlo) applied to data the rest of the dashboard already
 * computes -- no new raw aggregation happens here.
 */
export default function ModelInsightsTab() {
  const { status, data, error } = useAsync(loadModelInsightsData, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const scatterPoints: ScatterPoint[] = useMemo(() => {
    if (status !== "ready") return [];
    return data.clusters.zones.map((z) => ({ key: z.zone_id, label: z.name, x: z.pca_x, y: z.pca_y, group: z.cluster }));
  }, [status, data]);

  const scatterGroups: ScatterGroup[] = useMemo(() => {
    if (status !== "ready") return [];
    return data.clusters.profiles.map((p) => ({ group: p.cluster, label: `${p.label} (n=${p.size})` }));
  }, [status, data]);

  const featureBars: BarDatum[] = useMemo(() => {
    if (status !== "ready") return [];
    return data.dependencyModel.features.map((f) => ({ key: f.key, label: f.label, value: f.importance }));
  }, [status, data]);
  const maxImportance = featureBars.length ? Math.max(...featureBars.map((f) => f.value ?? 0)) : 1;

  const sensitivityRows: RangeDatum[] = useMemo(() => {
    if (status !== "ready") return [];
    return data.sensitivity.zones.map((z) => ({
      key: z.zone_id,
      label: z.name,
      low: z.p5_tvi,
      high: z.p95_tvi,
      baseline: z.baseline_tvi,
      hint: `Most-vulnerable in ${z.pct_most_vulnerable}% of re-weightings`,
    }));
  }, [status, data]);

  // The whole point of this chart is the spread between p5 and p95 -- against a
  // fixed 0-100 axis a real TVI range (e.g. 40-52) reads as an invisible sliver,
  // so the track is scaled to the data's own range instead, with that range
  // called out explicitly (see ScoreScale elsewhere) so it doesn't read as 0-100.
  const sensitivityDomain = useMemo(() => {
    if (status !== "ready" || sensitivityRows.length === 0) return { min: 0, max: 100 };
    const lows = sensitivityRows.map((r) => r.low);
    const highs = sensitivityRows.map((r) => r.high);
    const pad = 2;
    return { min: Math.max(0, Math.floor(Math.min(...lows) - pad)), max: Math.ceil(Math.max(...highs) + pad) };
  }, [status, sensitivityRows]);

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
      {status === "loading" && <Loading label="TRAINING MODELS" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && (
        <div ref={rootRef}>
          <p className="stakeholder-intro">
            Three more angles on the same composite-index approach: do the 9 zones actually fall into
            distinct archetypes, does a resident&apos;s living-condition profile predict anything real, and
            how much would the ranking move if the pillar weights themselves were different.
          </p>

          <div className="panel model-panel">
            <span className="eyebrow">Zone archetypes (unsupervised)</span>
            <p className="stakeholder-note" style={{ maxWidth: "60ch", marginInline: 0 }}>
              K-means on each zone&apos;s own 6 sub-index scores, projected to 2D with PCA
              ({Math.round(data.clusters.explained_variance[0] * 100)}% + {Math.round(data.clusters.explained_variance[1] * 100)}%
              of variance captured). Cluster told apart by fill pattern, not colour -- same convention as
              the coxcomb charts elsewhere in this dashboard.
            </p>
            <div className="model-scatter-row">
              <ScatterChart
                points={scatterPoints}
                groups={scatterGroups}
                xCaption={`PC1 (${Math.round(data.clusters.explained_variance[0] * 100)}% of variance)`}
                yCaption={`PC2 (${Math.round(data.clusters.explained_variance[1] * 100)}% of variance)`}
              />
              <div className="model-cluster-profiles">
                {data.clusters.profiles.map((p) => (
                  <div className="model-cluster-profile" key={p.cluster}>
                    <span className="model-cluster-profile-label">
                      {p.label} <small>n={p.size}</small>
                    </span>
                    <BarChartGeneric
                      data={Object.entries(p.sub_indices).map(([theme, v]) => ({
                        key: theme,
                        label: THEME_SHORT[theme] ?? theme,
                        value: v,
                      }))}
                      max={1}
                    />
                  </div>
                ))}
              </div>
            </div>
            <p className="stakeholder-note" style={{ maxWidth: "70ch", marginInline: 0 }}>
              {data.clusters.note} (k={data.clusters.k}, silhouette={data.clusters.silhouette}.)
            </p>
          </div>

          <div className="panel model-panel">
            <span className="eyebrow">Predicting socio-cultural pressure (supervised)</span>
            <p className="stakeholder-note" style={{ maxWidth: "60ch", marginInline: 0 }}>
              Does a household&apos;s water-access and tourism-economic profile predict whether that
              resident reports above-median socio-cultural pressure? Random Forest + Logistic
              Regression, cross-validated.
            </p>
            <div className="stakeholder-kpi-row">
              <div className="panel stat-panel">
                <span className="num mono-num">{Math.round(data.dependencyModel.cv_accuracy * 100)}%</span>
                <span className="label">CV accuracy</span>
                <p>vs. {Math.round(data.dependencyModel.baseline_accuracy * 100)}% majority-class baseline</p>
              </div>
              <div className="panel stat-panel">
                <span className="num mono-num">{data.dependencyModel.cv_roc_auc.toFixed(2)}</span>
                <span className="label">CV ROC-AUC</span>
                <p>0.5 = chance, 1.0 = perfect</p>
              </div>
              <div className="panel stat-panel">
                <span className="num mono-num">{data.dependencyModel.n_samples}</span>
                <span className="label">Respondents</span>
                <p>{data.dependencyModel.n_features} features, 5-fold CV</p>
              </div>
            </div>
            <span className="eyebrow">Feature importance</span>
            <BarChartGeneric data={featureBars} max={maxImportance} />
            <p className="stakeholder-note" style={{ maxWidth: "70ch", marginInline: 0 }}>{data.dependencyModel.note}</p>
          </div>

          <div className="panel model-panel">
            <span className="eyebrow">Index robustness (Monte Carlo)</span>
            <p className="stakeholder-note" style={{ maxWidth: "60ch", marginInline: 0 }}>
              Each zone&apos;s TVI, re-weighted {data.sensitivity.n_iterations} times with the six pillar
              weights perturbed +/-{data.sensitivity.perturbation_pct}% and renormalized. The shaded band
              is the resulting 5th-95th percentile range; the tick is the baseline (equal-weight) TVI.
              Track is zoomed to {sensitivityDomain.min}-{sensitivityDomain.max} (not the full 0-100 index
              scale) so the spread is actually visible.
            </p>
            <RangeBarChart data={sensitivityRows} min={sensitivityDomain.min} max={sensitivityDomain.max} />
            <p className="stakeholder-note" style={{ maxWidth: "70ch", marginInline: 0 }}>
              {data.sensitivity.rank_stability_note} {data.sensitivity.note}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
