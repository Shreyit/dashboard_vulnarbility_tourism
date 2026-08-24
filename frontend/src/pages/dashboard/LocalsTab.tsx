import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, CircleMarker, Popup } from "react-leaflet";
import * as L from "leaflet";
import { gsap, useGSAP } from "../../lib/gsap";
import "leaflet/dist/leaflet.css";

import { getInsights, getResidentAttitudes, getResidentLocations, getSustainabilityByStakeholder } from "../../api/client";
import { loadZonesWithIndices } from "../../api/loadZonesWithIndices";
import { THEME_META, type ThemeKey } from "../../api/types";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import CoxcombChart from "../../components/IndexViz/CoxcombChart";
import ScoreScale from "../../components/IndexViz/ScoreScale";
import BarChartGeneric, { type BarDatum } from "../../components/IndexViz/BarChartGeneric";
import RadialGauge from "../../components/IndexViz/RadialGauge";
import SubIndexBar from "../../components/IndexViz/SubIndexBar";
import DependencyPanel from "../../components/IndexViz/DependencyPanel";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./LocalsTab.css";
import "./StakeholderTab.css";

const NAINITAL_CENTER: [number, number] = [29.3865, 79.459];
const RESIDENT_THEMES: ThemeKey[] = ["wsi", "wspi", "edpi", "scpi"];
const DEPENDENCY_PILLARS = [
  { key: "economic" as const, label: "Economic" },
  { key: "social" as const, label: "Social" },
  { key: "environmental" as const, label: "Environmental" },
];

type TriFilter = "all" | "yes" | "no";

function matchesFilter(value: boolean | null, filter: TriFilter): boolean {
  if (filter === "all") return true;
  return filter === "yes" ? value === true : value === false;
}

function FilterPillGroup({
  label,
  value,
  onChange,
  yesLabel,
  noLabel,
}: {
  label: string;
  value: TriFilter;
  onChange: (v: TriFilter) => void;
  yesLabel: string;
  noLabel: string;
}) {
  const options: [TriFilter, string][] = [
    ["all", "All"],
    ["yes", yesLabel],
    ["no", noLabel],
  ];
  return (
    <div className="resident-filter-group">
      <span className="resident-filter-label">{label}</span>
      <div className="resident-filter-pills" role="group" aria-label={label}>
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            className={`resident-filter-pill${value === v ? " is-active" : ""}`}
            onClick={() => onChange(v)}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function markerIcon(tvi: number | null, isSelected: boolean) {
  const pct = tvi === null ? 0 : Math.max(0, Math.min(100, tvi));
  const size = isSelected ? 30 : 22;
  const html = `
    <div class="zone-marker${isSelected ? " is-selected" : ""}"
         style="width:${size}px;height:${size}px;background:color-mix(in srgb, var(--rust) ${pct}%, var(--paper-deep));">
      <span>${tvi === null ? "?" : Math.round(tvi)}</span>
    </div>`;
  return L.divIcon({ html, className: "zone-marker-wrap", iconSize: [size, size], iconAnchor: [size / 2, size / 2] });
}

async function loadLocalsData() {
  const [zones, insights, triads, attitudes, residentLocations] = await Promise.all([
    loadZonesWithIndices(),
    getInsights(),
    getSustainabilityByStakeholder(),
    getResidentAttitudes(),
    getResidentLocations(),
  ]);
  return { zones, insights, triads, attitudes, residentLocations };
}

/**
 * Locals: the only group most of the town's other pillars are physically
 * anchored to (Residents/Enterprise/Location carry zone_id -- Tourist/Worker
 * don't). The zone map lives here rather than as its own tab, since "where do
 * locals feel this" is the natural next beat after "how much do they feel it."
 */
type MapView = "zones" | "residents";

export default function LocalsTab() {
  const { status, data, error } = useAsync(loadLocalsData, []);
  const [selected, setSelected] = useState<string | null>(null);
  const [mapView, setMapView] = useState<MapView>("zones");
  const [depFilter, setDepFilter] = useState<TriFilter>("all");
  const [waterFilter, setWaterFilter] = useState<TriFilter>("all");
  const [incomeFilter, setIncomeFilter] = useState<TriFilter>("all");
  const gridRef = useRef<HTMLDivElement>(null);
  const detailContentRef = useRef<HTMLDivElement>(null);
  const shownZone = useRef(selected);
  const shownMapView = useRef(mapView);
  const reducedMotion = useReducedMotion();

  // Cross-fade rather than an instant pop: fade whichever marker set is
  // currently on the map out first, then swap state (which unmounts it and
  // mounts the other set), letting the entrance effect below fade the new
  // one in. The two marker kinds render as different DOM node types (a
  // divIcon vs. an SVG path), so this fades by opacity only -- the one
  // transform every element here can share safely.
  const switchMapView = (view: MapView) => {
    if (view === mapView) return;
    if (reducedMotion || !gridRef.current) {
      setMapView(view);
      return;
    }
    const outgoing = gsap.utils.toArray<HTMLElement>(
      mapView === "zones" ? ".zone-marker" : ".resident-dot",
      gridRef.current,
    );
    if (!outgoing.length) {
      setMapView(view);
      return;
    }
    gsap.to(outgoing, {
      autoAlpha: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => setMapView(view),
    });
  };

  const selectedEntry = useMemo(
    () => (status === "ready" ? data.zones.find((d) => d.zone.zone_id === selected) ?? null : null),
    [status, data, selected],
  );

  const filteredResidentLocations = useMemo(() => {
    if (status !== "ready") return [];
    return data.residentLocations.filter(
      (r) =>
        matchesFilter(r.tourism_dependent, depFilter) &&
        matchesFilter(r.water_stressed, waterFilter) &&
        matchesFilter(r.no_other_income, incomeFilter),
    );
  }, [status, data, depFilter, waterFilter, incomeFilter]);

  const pillarBars: BarDatum[] = useMemo(() => {
    if (status !== "ready") return [];
    const row = data.insights.stakeholder_matrix.matrix.residents ?? {};
    return RESIDENT_THEMES.filter((t) => row[t] !== null && row[t] !== undefined).map((t) => ({
      key: t,
      label: THEME_META[t].short,
      value: row[t] ?? null,
      hint: THEME_META[t].higherIsBetter ? "higher = better" : "higher = more pressure",
    }));
  }, [status, data]);

  useGSAP(
    () => {
      if (status !== "ready" || !gridRef.current) return;
      const q = gsap.utils.selector(gridRef);

      if (reducedMotion) {
        gsap.set(q(".zonemap-shutter"), { display: "none" });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(q(":scope > .panel"), { autoAlpha: 0, y: 24, duration: 0.5, stagger: 0.12 })
        .to(q(".zonemap-shutter i"), { scaleY: 0, duration: 0.5, stagger: { each: 0.035, from: "edges" }, ease: "power3.inOut" }, 0.15)
        .set(q(".zonemap-shutter"), { display: "none" });

      const drop = gsap.delayedCall(0.35, () => {
        const markers = gsap.utils.toArray<HTMLElement>(".zone-marker", gridRef.current!);
        if (!markers.length) return;
        gsap.from(markers, {
          y: -26,
          autoAlpha: 0,
          scale: 0.4,
          duration: 0.55,
          ease: "back.out(2.2)",
          stagger: { each: 0.05, from: "random" },
        });
      });

      return () => {
        drop.kill();
        tl.kill();
      };
    },
    { dependencies: [status, reducedMotion], scope: gridRef, revertOnUpdate: true },
  );

  useGSAP(
    () => {
      if (selected === shownZone.current) return;
      shownZone.current = selected;
      const el = detailContentRef.current;
      if (!el || reducedMotion) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(el, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.3 })
        .from(
          el.querySelectorAll(".subindex-bar, h3, .eyebrow, .radial-gauge"),
          { autoAlpha: 0, x: -12, duration: 0.32, stagger: 0.045 },
          0.05,
        );
    },
    { dependencies: [selected, reducedMotion], scope: detailContentRef },
  );

  // The other half of the cross-fade: whichever marker set just mounted (after
  // switchMapView's fade-out swapped state) fades/drops back in. Guarded by
  // shownMapView so this never doubles up with the shutter-reveal effect's own
  // initial `.zone-marker` drop-in on first load.
  useGSAP(
    () => {
      if (status !== "ready" || mapView === shownMapView.current) return;
      shownMapView.current = mapView;
      if (reducedMotion || !gridRef.current) return;

      if (mapView === "zones") {
        const markers = gsap.utils.toArray<HTMLElement>(".zone-marker", gridRef.current);
        gsap.from(markers, {
          autoAlpha: 0,
          scale: 0.4,
          duration: 0.45,
          ease: "back.out(2.2)",
          stagger: { each: 0.03, from: "random" },
        });
      } else {
        // an SVG path's default transform-origin is the viewport's, not its own
        // centre, so a scale tween here would fly in from a corner -- opacity
        // only keeps every dot cross-fading in place.
        const dots = gsap.utils.toArray<SVGPathElement>(".resident-dot", gridRef.current);
        gsap.from(dots, { autoAlpha: 0, duration: 0.4, ease: "power2.out", stagger: { each: 0.006, from: "random" } });
      }
    },
    { dependencies: [mapView, status, reducedMotion], scope: gridRef },
  );

  return (
    <>
      {status === "loading" && <Loading label="LOADING RESIDENT DATA" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && (
        <div>
          <p className="stakeholder-intro">
            239 residents surveyed, geotagged across 9 zones. Locals absorb tourism&apos;s pressure
            in place -- where they live decides how much of it reaches them, which is why this is
            the one tab with a map.
          </p>

          <div className="map-view-toggle" role="tablist" aria-label="Map view">
            <button
              type="button"
              role="tab"
              aria-selected={mapView === "zones"}
              className={`map-view-toggle-btn${mapView === "zones" ? " is-active" : ""}`}
              onClick={() => switchMapView("zones")}
            >
              Zone scores
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mapView === "residents"}
              className={`map-view-toggle-btn${mapView === "residents" ? " is-active" : ""}`}
              onClick={() => switchMapView("residents")}
            >
              Resident locations
            </button>
          </div>

          <div className="zonemap-grid" ref={gridRef} style={{ marginBottom: "var(--sp-5)" }}>
            <div className="panel zonemap-panel">
              <span className="zonemap-shutter" aria-hidden="true">
                {Array.from({ length: 14 }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
              <MapContainer center={NAINITAL_CENTER} zoom={15} style={{ height: "480px", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapView === "zones" &&
                  data.zones.map(({ zone, bundle }) =>
                    zone.latitude !== null && zone.longitude !== null ? (
                      <Marker
                        key={zone.zone_id}
                        position={[zone.latitude, zone.longitude]}
                        icon={markerIcon(bundle.tvi, zone.zone_id === selected)}
                        eventHandlers={{ click: () => setSelected(zone.zone_id) }}
                      >
                        <Popup>
                          <strong>{zone.name}</strong>
                          <br />
                          TVI: {bundle.tvi ?? "--"}
                        </Popup>
                      </Marker>
                    ) : null,
                  )}
                {mapView === "residents" &&
                  filteredResidentLocations.map((r, i) => (
                    <CircleMarker
                      key={i}
                      center={[r.latitude, r.longitude]}
                      radius={6}
                      pathOptions={{
                        className: "resident-dot",
                        color: "var(--rust)",
                        weight: r.tourism_dependent === null ? 1 : 1.5,
                        fillColor: r.tourism_dependent === false ? "var(--paper)" : "var(--rust)",
                        fillOpacity: r.tourism_dependent === null ? 0.15 : 1,
                        dashArray: r.tourism_dependent === null ? "2 2" : undefined,
                      }}
                    >
                      <Popup>
                        {r.zone_id ?? "Zone unknown"}
                        <br />
                        {r.tourism_dependent === null
                          ? "Tourism dependency not reported"
                          : r.tourism_dependent
                            ? "Tourism-dependent household"
                            : "Non-dependent household"}
                      </Popup>
                    </CircleMarker>
                  ))}
              </MapContainer>
            </div>

            <div className="panel zonemap-detail-panel">
              <div ref={detailContentRef}>
                {!selectedEntry && mapView === "zones" && (
                  <div className="zonemap-empty">
                    <span className="eyebrow">select a zone</span>
                    <p>Click a marker on the map to see that zone&apos;s full breakdown.</p>
                  </div>
                )}
                {mapView === "residents" && (
                  <div className="resident-filter-panel">
                    <span className="eyebrow">Filter households</span>
                    <p className="resident-filter-note">
                      Each dot is one surveyed resident&apos;s own GPS point. Narrow the map down
                      by any combination below, or tap a dot for its details.
                    </p>
                    <FilterPillGroup
                      label="Tourism dependency"
                      value={depFilter}
                      onChange={setDepFilter}
                      yesLabel="Dependent"
                      noLabel="Non-dependent"
                    />
                    <FilterPillGroup
                      label="Water stress"
                      value={waterFilter}
                      onChange={setWaterFilter}
                      yesLabel="High"
                      noLabel="Low"
                    />
                    <FilterPillGroup
                      label="Other income source"
                      value={incomeFilter}
                      onChange={setIncomeFilter}
                      yesLabel="None"
                      noLabel="Has other"
                    />
                    <p className="resident-filter-count">
                      <strong className="mono-num">{filteredResidentLocations.length}</strong> of{" "}
                      {data.residentLocations.length} households shown
                    </p>
                  </div>
                )}
                {mapView === "zones" && selectedEntry && (
                  <>
                    <span className="eyebrow">{selectedEntry.zone.zone_id}</span>
                    <h3 style={{ marginTop: "0.25rem" }}>{selectedEntry.zone.name}</h3>
                    <div className="zonemap-gauge-row">
                      <RadialGauge value={selectedEntry.bundle.tvi} label="TVI" size={150} />
                    </div>
                    {RESIDENT_THEMES.map((theme) => (
                      <SubIndexBar key={theme} theme={theme} value={selectedEntry.bundle.sub_indices[theme] ?? null} />
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="stakeholder-grid">
            <div className="panel stakeholder-coxcomb-panel">
              <span className="eyebrow">Residents, on the sustainability triad</span>
              <CoxcombChart
                data={[
                  { key: "economic", label: "Economic", value: data.triads.residents?.economic ?? null },
                  { key: "environmental", label: "Environmental", value: data.triads.residents?.environmental ?? null },
                  { key: "social", label: "Social", value: data.triads.residents?.social ?? null },
                ]}
              />
              <ScoreScale />
            </div>
            <div className="panel stakeholder-bars-panel">
              <span className="eyebrow">Where residents show up in the six pillars</span>
              <BarChartGeneric data={pillarBars} />
            </div>
          </div>

          <DependencyPanel
            data={data.attitudes}
            pillars={DEPENDENCY_PILLARS}
            dependentLabel="Tourism-dependent residents"
            nonDependentLabel="Non-dependent residents"
            aggregateLabel="Resident Irritation Index (RII)"
            theoryNote="Social Exchange Theory predicts residents who benefit materially from tourism report less irritation at its pressure than those who don't. Every number below is this project's own pillar definitions (the same components the Socio-Cultural Pressure Index already uses, split three ways) and a fresh Mann-Whitney U test on the real 239 residents."
          />
        </div>
      )}
    </>
  );
}
