import { useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import * as L from "leaflet";
import { gsap, useGSAP } from "../../lib/gsap";
import "leaflet/dist/leaflet.css";

import { getZones, getZoneIndices } from "../../api/client";
import { THEME_ORDER, type IndexBundle, type ZoneOut } from "../../api/types";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import RadialGauge from "../../components/IndexViz/RadialGauge";
import SubIndexBar from "../../components/IndexViz/SubIndexBar";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./ZoneMapTab.css";

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

export default function ZoneMapTab() {
  const { status, data, error } = useAsync(loadZonesWithIndices, []);
  const [selected, setSelected] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const detailContentRef = useRef<HTMLDivElement>(null);
  const shownZone = useRef(selected);
  const reducedMotion = useReducedMotion();

  const selectedEntry = useMemo(
    () => data?.find((d) => d.zone.zone_id === selected) ?? null,
    [data, selected],
  );

  // ---- entrance: the map panel opens like a shutter, markers drop in ----
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

  // ---- selecting a zone swaps the detail column ----
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
      {status === "loading" && <Loading label="LOADING ZONES" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && (
        <div className="zonemap-grid" ref={gridRef}>
          <div className="panel zonemap-panel">
            <span className="zonemap-shutter" aria-hidden="true">
              {Array.from({ length: 14 }, (_, i) => (
                <i key={i} />
              ))}
            </span>
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
            <div ref={detailContentRef}>
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
                  <div className="zonemap-gauge-row">
                    <RadialGauge value={selectedEntry.bundle.tvi} label="TVI" size={150} />
                  </div>
                  {THEME_ORDER.map((theme) => (
                    <SubIndexBar key={theme} theme={theme} value={selectedEntry.bundle.sub_indices[theme] ?? null} />
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
