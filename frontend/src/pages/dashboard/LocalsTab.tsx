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
  const gridRef = useRef<HTMLDivElement>(null);
  const detailContentRef = useRef<HTMLDivElement>(null);
  const shownZone = useRef(selected);
  const reducedMotion = useReducedMotion();

  const selectedEntry = useMemo(
    () => (status === "ready" ? data.zones.find((d) => d.zone.zone_id === selected) ?? null : null),
    [status, data, selected],
  );

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
              onClick={() => setMapView("zones")}
            >
              Zone scores
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mapView === "residents"}
              className={`map-view-toggle-btn${mapView === "residents" ? " is-active" : ""}`}
              onClick={() => setMapView("residents")}
            >
              Resident locations
            </button>
          </div>

          {mapView === "residents" && (
            <p className="map-view-note">
              Every geotagged resident&apos;s own household point (155 of 239 -- the rest had no
              usable GPS fix), not the 9 zone-aggregate markers. Filled = tourism-dependent
              household, outline = non-dependent, faint dashed = dependency not reported.
            </p>
          )}

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
                  data.residentLocations.map((r, i) => (
                    <CircleMarker
                      key={i}
                      center={[r.latitude, r.longitude]}
                      radius={6}
                      pathOptions={{
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
                  <div className="zonemap-empty">
                    <span className="eyebrow">individual households</span>
                    <p>
                      Each dot is one surveyed resident&apos;s own GPS point. Tap a dot for its
                      zone and dependency status, or switch back to &quot;Zone scores&quot; for the
                      full per-zone breakdown.
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
