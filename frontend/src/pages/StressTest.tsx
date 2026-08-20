import { useEffect, useRef, useState } from "react";
import { getZones, postStressTest } from "../api/client";
import { THEME_META, THEME_ORDER, type StressTestOut, type ZoneOut } from "../api/types";
import RadialGauge from "../components/IndexViz/RadialGauge";
import ErrorPanel from "../components/ErrorPanel";
import Loading from "../components/Loading";
import "./StressTest.css";

export default function StressTest() {
  const [zones, setZones] = useState<ZoneOut[]>([]);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [result, setResult] = useState<StressTestOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    getZones().then(setZones).catch(() => {});
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setLoading(true);
      setError(null);
      postStressTest(multiplier, zoneId)
        .then((r) => setResult(r))
        .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
        .finally(() => setLoading(false));
    }, 200);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [multiplier, zoneId]);

  const tviDelta = result?.baseline.tvi != null && result?.scenario.tvi != null
    ? result.scenario.tvi - result.baseline.tvi
    : null;

  return (
    <main>
      <section className="section container" style={{ borderTop: "none", paddingTop: "var(--sp-6)" }}>
        <div className="section-head">
          <span className="eyebrow">Peak-season simulator</span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Stress test</h1>
          <p className="section-lede">
            A scenario calculator, not a forecast: drag the footfall multiplier and every
            sub-index recomputes from documented elasticity assumptions -- water and waste
            pressure scale up, infrastructure and visitor experience erode, and economic
            dependency stays fixed in the short run.
          </p>
        </div>

        <div className="panel stress-controls">
          <div className="stress-controls-row">
            <label className="eyebrow" htmlFor="zone-select">
              scope
            </label>
            <select
              id="zone-select"
              value={zoneId ?? ""}
              onChange={(e) => setZoneId(e.target.value || null)}
              className="stress-select"
            >
              <option value="">Town-wide</option>
              {zones.map((z) => (
                <option key={z.zone_id} value={z.zone_id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <div className="stress-slider-row">
            <span className="mono-num stress-multiplier">{multiplier.toFixed(2)}x</span>
            <input
              type="range"
              min={1}
              max={17}
              step={0.05}
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="stress-slider"
              aria-label="Footfall multiplier"
            />
          </div>

          {result && (
            <div className="stress-presets">
              {result.footfall_anchors.presets.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  className={`btn stress-preset-btn${Math.abs(multiplier - p.multiplier) < 0.01 ? " is-active" : ""}`}
                  onClick={() => setMultiplier(p.multiplier)}
                  data-cursor
                  data-cursor-label="SET"
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}

          {result && (
            <p className="stress-anchor-note">
              Road capacity: {result.footfall_anchors.road_capacity_vehicles.toLocaleString()} vehicles ·
              current peak inflow: {result.footfall_anchors.baseline_peak_vehicles_low.toLocaleString()}-
              {result.footfall_anchors.baseline_peak_vehicles_high.toLocaleString()}/day (~1.0-1.3x) ·
              extreme weekend: {result.footfall_anchors.extreme_weekend_vehicles.toLocaleString()} (~16.7x)
            </p>
          )}
        </div>

        {error && <ErrorPanel message={error} />}
        {loading && !result && <Loading label="RUNNING SCENARIO" />}

        {result && (
          <div className="stress-result-grid">
            <div className="panel stress-gauge-panel">
              <div className="stress-gauge-pair">
                <RadialGauge value={result.baseline.tvi} label="Baseline TVI" size={160} />
                <div className="stress-gauge-arrow mono-num">
                  {tviDelta === null ? "--" : `${tviDelta >= 0 ? "+" : ""}${tviDelta.toFixed(1)}`}
                </div>
                <RadialGauge value={result.scenario.tvi} label={`Scenario @ ${multiplier.toFixed(2)}x`} size={160} />
              </div>
              <p className="stress-note">{result.note}</p>
            </div>

            <div className="panel stress-table-panel">
              <span className="eyebrow">Sub-indices, baseline → scenario</span>
              <div className="stress-table">
                {THEME_ORDER.map((theme) => {
                  const base = result.baseline.sub_indices[theme] ?? null;
                  const scen = result.scenario.sub_indices[theme] ?? null;
                  const meta = THEME_META[theme];
                  const elasticity = result.elasticities[theme] ?? 0;
                  return (
                    <div className="stress-table-row" key={theme}>
                      <span className="stress-table-label">
                        {meta.short}
                        <small>elasticity {elasticity.toFixed(1)}</small>
                      </span>
                      <span className="mono-num">{base === null ? "--" : Math.round(base * 100)}</span>
                      <span className="stress-table-sep">→</span>
                      <span className="mono-num" style={{ color: "var(--rust)" }}>
                        {scen === null ? "--" : Math.round(scen * 100)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
