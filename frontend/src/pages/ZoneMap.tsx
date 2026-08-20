import { useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import * as L from "leaflet";
import "leaflet/dist/leaflet.css";

import { getZones, getZoneIndices } from "../api/client";
import { THEME_ORDER, type IndexBundle, type ZoneOut } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import RadialGauge from "../components/IndexViz/RadialGauge";
import SubIndexBar from "../components/IndexViz/SubIndexBar";
import ErrorPanel from "../components/ErrorPanel";
import Loading from "../components/Loading";
import "./ZoneMap.css";

const NAINITAL_CENTER: [number, number] = [29.3865, 79.459];

async function loadZonesWithIndices(): Promise<{ zone: ZoneOut; bundle: IndexBundle }[]> {
  const zones = await getZones();
  const bundles = await Promise.all(zones.map((z) => getZoneIndices(z.zone_id)));
  return zones.map((zone, i) => ({ zone, bundle: bundles[i] }));
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

export default function ZoneMap() {
  const { status, data, error } = useAsync(loadZonesWithIndices, []);
  const [selected, setSelected] = useState<string | null>(null);

  const selectedEntry = useMemo(
    () => data?.find((d) => d.zone.zone_id === selected) ?? null,
    [data, selected],
  );

  return (
    <main>
      <section className="section container" style={{ borderTop: "none", paddingTop: "var(--sp-6)" }}>
        <div className="section-head">
          <span className="eyebrow">10 surveyed sites</span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Zone map</h1>
          <p className="section-lede">
            Marker fill shows each zone&apos;s TVI (darker = more vulnerable). Site names are
            placeholders for now, pending local confirmation.
          </p>
        </div>

        {status === "loading" && <Loading label="LOADING ZONES" />}
        {status === "error" && <ErrorPanel message={error} />}

        {status === "ready" && (
          <div className="zonemap-grid">
            <div className="panel zonemap-panel">
              <MapContainer center={NAINITAL_CENTER} zoom={15} style={{ height: "520px", width: "100%" }}>
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {data.map(({ zone, bundle }) => (
                  zone.latitude !== null && zone.longitude !== null && (
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
                  )
                ))}
              </MapContainer>
            </div>

            <div className="panel zonemap-detail-panel">
              {!selectedEntry && (
                <div className="zonemap-empty">
                  <span className="eyebrow">select a zone</span>
                  <p>Click a marker on the map to see that zone&apos;s full breakdown.</p>
                </div>
              )}
              {selectedEntry && (
                <>
                  <span className="eyebrow">{selectedEntry.zone.zone_id}</span>
                  <h3 style={{ marginTop: "0.25rem" }}>{selectedEntry.zone.name}</h3>
                  <div style={{ display: "flex", justifyContent: "center", margin: "var(--sp-4) 0" }}>
                    <RadialGauge value={selectedEntry.bundle.tvi} label="TVI" size={150} />
                  </div>
                  {THEME_ORDER.map((theme) => (
                    <SubIndexBar key={theme} theme={theme} value={selectedEntry.bundle.sub_indices[theme] ?? null} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
