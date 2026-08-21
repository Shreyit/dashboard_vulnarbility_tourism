import { useRef, useState } from "react";
import { gsap, useGSAP } from "../lib/gsap";
import { getTownIndices } from "../api/client";
import { THEME_ORDER, type ThemeKey } from "../api/types";
import { useAsync } from "../hooks/useAsync";
import { useReducedMotion } from "../hooks/useReducedMotion";
import RadialGauge from "../components/IndexViz/RadialGauge";
import SubIndexBar from "../components/IndexViz/SubIndexBar";
import ErrorPanel from "../components/ErrorPanel";
import Loading from "../components/Loading";
import { SplitHeading } from "../components/Reveal/Reveal";
import "./Overview.css";

export default function Overview() {
  const { status, data, error } = useAsync(getTownIndices, []);
  const [expanded, setExpanded] = useState<ThemeKey | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const detailRefs = useRef<Partial<Record<ThemeKey, HTMLDivElement | null>>>({});
  const reducedMotion = useReducedMotion();

  // ---- entrance: the panels get stamped down rather than faded up ----
  // A short overshoot on scale plus a fraction of a degree of rotation reads
  // like a sticker being pressed onto the page, which is the visual language
  // the panels themselves use (hard border, hard offset shadow, no blur).
  useGSAP(
    () => {
      if (status !== "ready" || !gridRef.current || reducedMotion) return;
      const q = gsap.utils.selector(gridRef);

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q(":scope > .panel"), {
          autoAlpha: 0,
          y: 26,
          scale: 0.97,
          rotation: -0.5,
          duration: 0.6,
          ease: "back.out(1.5)",
          stagger: 0.12,
        })
        .from(q(".subindex-bar"), { autoAlpha: 0, x: -14, duration: 0.4, stagger: 0.06 }, "-=0.3")
        .from(q(".eyebrow"), { autoAlpha: 0, duration: 0.3 }, 0.2);
    },
    { dependencies: [status, reducedMotion], scope: gridRef, revertOnUpdate: true },
  );

  // ---- pillar breakdown opens and closes as a height animation ----
  // The lists stay mounted so closing can animate too; rendering them
  // conditionally meant the panel could only ever animate open.
  useGSAP(
    () => {
      if (status !== "ready") return;
      THEME_ORDER.forEach((theme) => {
        const el = detailRefs.current[theme];
        if (!el) return;
        const open = expanded === theme;

        if (reducedMotion) {
          gsap.set(el, { height: open ? "auto" : 0, autoAlpha: open ? 1 : 0 });
          return;
        }

        gsap.to(el, {
          height: open ? "auto" : 0,
          autoAlpha: open ? 1 : 0,
          duration: 0.42,
          ease: "power3.inOut",
          overwrite: true,
        });
        if (open) {
          gsap.from(el.querySelectorAll(".component-row"), {
            autoAlpha: 0,
            x: -12,
            duration: 0.32,
            stagger: 0.035,
            ease: "power2.out",
            overwrite: true,
          });
        }
      });
    },
    { dependencies: [expanded, status, reducedMotion], scope: gridRef },
  );

  return (
    <main>
      <section className="section container" style={{ borderTop: "none", paddingTop: "var(--sp-6)" }}>
        <div className="section-head">
          <span className="eyebrow">Town-wide</span>
          <SplitHeading as="h1" className="page-title">
            Tourism Vulnerability Index
          </SplitHeading>
          <p className="section-lede">
            0-100, higher = more vulnerable. A weighted blend of six pillars -- water stress,
            waste &amp; sanitation, infrastructure adequacy (inverted), economic precarity,
            socio-cultural pressure, and visitor experience (inverted), weighted equally for now.
          </p>
        </div>

        {status === "loading" && <Loading label="COMPUTING INDEX" />}
        {status === "error" && <ErrorPanel message={error} />}

        {status === "ready" && (
          <div className="overview-grid" ref={gridRef}>
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
                    <div
                      className="component-list-shell"
                      ref={(el) => {
                        detailRefs.current[theme] = el;
                      }}
                    >
                      <div className="component-list">
                        {(data.details[theme] ?? []).map((c) => (
                          <div className="component-row" key={c.component}>
                            <span className="name">{c.component.replace(/_/g, " ")}</span>
                            <span className="value mono-num">{Math.round(c.value * 100)}</span>
                            {c.town_wide_proxy && <span className="proxy-flag">town proxy</span>}
                          </div>
                        ))}
                        {(data.details[theme] ?? []).length === 0 && (
                          <p className="component-empty">No components with usable data for this view.</p>
                        )}
                      </div>
                    </div>
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
