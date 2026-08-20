import { useState } from "react";
import { getTownIndices } from "../api/client";
import { THEME_ORDER, type ThemeKey } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import RadialGauge from "../components/IndexViz/RadialGauge";
import SubIndexBar from "../components/IndexViz/SubIndexBar";
import ErrorPanel from "../components/ErrorPanel";
import Loading from "../components/Loading";
import "./Overview.css";

export default function Overview() {
  const { status, data, error } = useAsync(getTownIndices, []);
  const [expanded, setExpanded] = useState<ThemeKey | null>(null);

  return (
    <main>
      <section className="section container" style={{ borderTop: "none", paddingTop: "var(--sp-6)" }}>
        <div className="section-head">
          <span className="eyebrow">Town-wide</span>
          <h1 style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Tourism Vulnerability Index</h1>
          <p className="section-lede">
            0-100, higher = more vulnerable. A weighted blend of six pillars -- water stress,
            waste &amp; sanitation, infrastructure adequacy (inverted), economic precarity,
            socio-cultural pressure, and visitor experience (inverted), weighted equally for now.
          </p>
        </div>

        {status === "loading" && <Loading label="COMPUTING INDEX" />}
        {status === "error" && <ErrorPanel message={error} />}

        {status === "ready" && (
          <div className="overview-grid">
            <div className="panel overview-gauge-panel">
              <RadialGauge value={data.tvi} label="TVI" size={240} />
            </div>

            <div className="panel overview-bars-panel">
              <span className="eyebrow">Six pillars</span>
              <div style={{ marginTop: "var(--sp-3)" }}>
                {THEME_ORDER.map((theme) => (
                  <div key={theme}>
                    <SubIndexBar
                      theme={theme}
                      value={data.sub_indices[theme] ?? null}
                      active={expanded === theme}
                      onClick={() => setExpanded(expanded === theme ? null : theme)}
                    />
                    {expanded === theme && (
                      <div className="component-list">
                        {(data.details[theme] ?? []).map((c) => (
                          <div className="component-row" key={c.component}>
                            <span className="name">{c.component.replace(/_/g, " ")}</span>
                            <span className="value mono-num">{Math.round(c.value * 100)}</span>
                            {c.town_wide_proxy && <span className="proxy-flag">town proxy</span>}
                          </div>
                        ))}
                        {(data.details[theme] ?? []).length === 0 && (
                          <p style={{ padding: "0.5rem 0", color: "var(--ink-faint)", fontSize: "0.8rem" }}>
                            No components with usable data for this view.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
