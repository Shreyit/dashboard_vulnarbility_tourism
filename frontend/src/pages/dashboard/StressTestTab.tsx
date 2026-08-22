import { useEffect, useRef, useState } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getZones, postStressTest } from "../../api/client";
import { THEME_META, THEME_ORDER, type StressTestOut, type ZoneOut } from "../../api/types";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import RadialGauge from "../../components/IndexViz/RadialGauge";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import Magnetic from "../../components/Magnetic/Magnetic";
import "./StressTestTab.css";

const MIN_MULTIPLIER = 1;
const MAX_MULTIPLIER = 17;

export default function StressTestTab() {
  const [zones, setZones] = useState<ZoneOut[]>([]);
  const [zoneId, setZoneId] = useState<string | null>(null);
  const [multiplier, setMultiplier] = useState(1);
  const [result, setResult] = useState<StressTestOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const resultGridRef = useRef<HTMLDivElement>(null);
  const loadFillRef = useRef<HTMLSpanElement>(null);
  const deltaRef = useRef<HTMLDivElement>(null);
  const introPlayedFor = useRef<StressTestOut | null>(null);
  const deltaShownRef = useRef(0);
  const reducedMotion = useReducedMotion();

  // ---- controls entrance ----
  useGSAP(
    () => {
      if (!controlsRef.current || reducedMotion) return;
      const q = gsap.utils.selector(controlsRef);
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(controlsRef.current, { autoAlpha: 0, y: 20, duration: 0.5 })
        .from(q(".stress-controls-row > *"), { autoAlpha: 0, x: -14, duration: 0.35, stagger: 0.07 }, 0.15)
        .from(q(".stress-slider-row > *"), { autoAlpha: 0, y: 12, duration: 0.35, stagger: 0.07 }, 0.25);
    },
    { dependencies: [reducedMotion], scope: controlsRef, revertOnUpdate: true },
  );

  // ---- the load bar under the slider tracks the multiplier continuously ----
  useGSAP(
    () => {
      const fill = loadFillRef.current;
      if (!fill) return;
      const progress = (multiplier - MIN_MULTIPLIER) / (MAX_MULTIPLIER - MIN_MULTIPLIER);
      if (reducedMotion) {
        gsap.set(fill, { scaleX: progress });
        return;
      }
      gsap.to(fill, { scaleX: progress, duration: 0.35, ease: "power3.out", overwrite: true });
    },
    { dependencies: [multiplier, reducedMotion], scope: controlsRef },
  );

  // ---- results ----
  useGSAP(
    () => {
      if (!result || !resultGridRef.current || reducedMotion) return;
      const q = gsap.utils.selector(resultGridRef);

      if (introPlayedFor.current === null || introPlayedFor.current === result) {
        introPlayedFor.current = result;
        gsap
          .timeline({ defaults: { ease: "power3.out" } })
          .from(q(":scope > .panel"), { autoAlpha: 0, y: 24, scale: 0.98, duration: 0.55, stagger: 0.12 })
          .from(q(".stress-table-row"), { autoAlpha: 0, x: -12, duration: 0.35, stagger: 0.05 }, "-=0.25");
        return;
      }

      gsap.fromTo(
        q(".stress-table-scenario"),
        { backgroundColor: "var(--rust-soft)" },
        { backgroundColor: "rgba(0,0,0,0)", duration: 0.4, ease: "power2.inOut", stagger: 0.02, overwrite: true },
      );
      gsap.fromTo(
        q(".stress-multiplier"),
        { scale: 1.12 },
        { scale: 1, duration: 0.4, ease: "back.out(2.4)", overwrite: true },
      );
    },
    { dependencies: [result, reducedMotion], scope: resultGridRef },
  );

  // ---- the baseline -> scenario delta counts, and colours by direction ----
  const tviDelta =
    result?.baseline.tvi != null && result?.scenario.tvi != null
      ? result.scenario.tvi - result.baseline.tvi
      : null;

  useGSAP(
    () => {
      const el = deltaRef.current;
      if (!el) return;
      const target = tviDelta ?? 0;

      const write = (v: number) => {
        el.textContent = tviDelta === null ? "--" : `${v >= 0 ? "+" : ""}${v.toFixed(1)}`;
      };

      if (reducedMotion) {
        deltaShownRef.current = target;
        write(target);
        gsap.set(el, { color: target > 0 ? "var(--rust)" : "var(--ink-soft)" });
        return;
      }

      const counter = { v: deltaShownRef.current };
      gsap.to(counter, {
        v: target,
        duration: 0.5,
        ease: "power2.out",
        overwrite: true,
        onUpdate: () => {
          deltaShownRef.current = counter.v;
          write(counter.v);
        },
      });
      gsap.to(el, { color: target > 0 ? "var(--rust)" : "var(--ink-soft)", duration: 0.4, overwrite: "auto" });
    },
    { dependencies: [tviDelta, reducedMotion] },
  );

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

  const anchorMarks = result
    ? [
        { at: 1, label: "today" },
        { at: 1.3, label: "" },
        { at: 16.7, label: "extreme" },
      ]
    : [];

  return (
    <>
      <div className="panel stress-controls" ref={controlsRef}>
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
          <div className="stress-slider-stack">
            <input
              type="range"
              min={MIN_MULTIPLIER}
              max={MAX_MULTIPLIER}
              step={0.05}
              value={multiplier}
              onChange={(e) => setMultiplier(Number(e.target.value))}
              className="stress-slider"
              aria-label="Footfall multiplier"
            />
            <span className="stress-load" aria-hidden="true">
              <span className="stress-load-fill" ref={loadFillRef} />
              {anchorMarks.map((mark) => (
                <span
                  className="stress-load-mark"
                  key={mark.at}
                  style={{
                    left: `${((mark.at - MIN_MULTIPLIER) / (MAX_MULTIPLIER - MIN_MULTIPLIER)) * 100}%`,
                  }}
                >
                  <i />
                  {mark.label && <em>{mark.label}</em>}
                </span>
              ))}
            </span>
          </div>
        </div>

        {result && (
          <div className="stress-presets">
            {result.footfall_anchors.presets.map((p) => (
              <Magnetic key={p.label} strength={0.35} radius={70} maxOffset={12}>
                <button
                  type="button"
                  className={`btn stress-preset-btn${Math.abs(multiplier - p.multiplier) < 0.01 ? " is-active" : ""}`}
                  onClick={() => setMultiplier(p.multiplier)}
                  data-cursor
                  data-cursor-label="SET"
                >
                  {p.label}
                </button>
              </Magnetic>
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
        <div className="stress-result-grid" ref={resultGridRef}>
          <div className="panel stress-gauge-panel">
            <div className="stress-gauge-pair">
              <RadialGauge value={result.baseline.tvi} label="Baseline TVI" size={160} />
              <div className="stress-gauge-arrow mono-num" ref={deltaRef}>
                --
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
                    <span className="mono-num stress-table-scenario">
                      {scen === null ? "--" : Math.round(scen * 100)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
