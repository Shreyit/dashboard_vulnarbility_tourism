import { useMemo, useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { getEsacFramework } from "../../api/client";
import { useAsync } from "../../hooks/useAsync";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import RadialGauge from "../../components/IndexViz/RadialGauge";
import ErrorPanel from "../../components/ErrorPanel";
import Loading from "../../components/Loading";
import "./EsacTab.css";

const BAND_CLASS: Record<string, string> = {
  Lower: "esac-band esac-band-lower",
  Moderate: "esac-band esac-band-moderate",
  Higher: "esac-band esac-band-higher",
};

function BandTag({ band }: { band: string | null }) {
  if (!band) return <span className="esac-band">--</span>;
  return <span className={BAND_CLASS[band] ?? "esac-band"}>{band}</span>;
}

function Bar({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  const pct = value === null ? 0 : Math.round(value * 100);
  return (
    <div className="subindex-bar">
      <span className="subindex-bar-label">
        {label}
        <small>{hint}</small>
      </span>
      <span className="subindex-bar-track">
        <span className="subindex-bar-fill" style={{ transform: `scaleX(${pct / 100})` }} />
      </span>
      <span className="subindex-bar-value mono-num">{value === null ? "--" : pct}</span>
    </div>
  );
}

/**
 * A second, complementary vulnerability lens: Exposure / Sensitivity / Adaptive
 * Capacity (E-S-AC), the IPCC-style structure RESEARCH_BENCHMARKS.md SS4 flagged
 * as a possible v2 restructuring -- built here alongside the OECD/JRC 6-pillar
 * TVI, not in place of it. See the Methodology picker (landing page) for the
 * exact formulas and every substitution this reimplementation makes.
 */
export default function EsacTab() {
  const { status, data, error } = useAsync(getEsacFramework, []);
  const rootRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const sortedZones = useMemo(() => {
    if (status !== "ready") return [];
    return [...data.zones].sort((a, b) => (b.composite ?? -1) - (a.composite ?? -1));
  }, [status, data]);

  useGSAP(
    () => {
      if (status !== "ready" || !rootRef.current || reducedMotion) return;
      const q = gsap.utils.selector(rootRef);
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q(".panel"), { autoAlpha: 0, y: 24, duration: 0.55, stagger: 0.12 })
        .from(q(".subindex-bar"), { autoAlpha: 0, x: -14, duration: 0.4, stagger: 0.06 }, "-=0.3")
        .from(q(".esac-zone-row"), { autoAlpha: 0, x: -10, duration: 0.3, stagger: 0.03 }, "-=0.2");
    },
    { dependencies: [status, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <>
      {status === "loading" && <Loading label="COMPUTING E-S-AC" />}
      {status === "error" && <ErrorPanel message={error} />}

      {status === "ready" && (
        <div ref={rootRef}>
          <p className="esac-disclosure">
            A second, complementary lens on vulnerability, not a replacement for the town-wide TVI:
            an IPCC-style Exposure / Sensitivity / Adaptive Capacity structure. Several of its inputs
            substitute this project&apos;s nearest existing derived variable for one the original
            framework named -- see the Methodology picker on the home page for every substitution.
          </p>

          <div className="esac-grid">
            <div className="panel esac-gauge-panel">
              <RadialGauge value={data.composite} label="E-S-AC composite" size={220} />
              <div className="esac-gauge-band">
                <span className="eyebrow">Band</span>
                <BandTag band={data.band} />
              </div>
            </div>

            <div className="panel esac-bars-panel">
              <span className="eyebrow">Three components</span>
              <div style={{ marginTop: "var(--sp-3)" }}>
                <Bar label="Exposure" value={data.exposure} hint="higher = more exposed" />
                <Bar label="Sensitivity" value={data.sensitivity} hint="higher = more sensitive" />
                <Bar label="Adaptive capacity" value={data.adaptive_capacity} hint="higher = better" />
              </div>
            </div>
          </div>

          <div className="panel esac-zones-panel">
            <span className="eyebrow">By zone, most to least vulnerable</span>
            <div className="esac-zone-list">
              {sortedZones.map((z) => (
                <div className="esac-zone-row" key={z.zone_id}>
                  <span className="mono-num esac-zone-id">{z.zone_id}</span>
                  <span className="mono-num esac-zone-composite">
                    {z.composite === null ? "--" : z.composite.toFixed(1)}
                  </span>
                  <BandTag band={z.band} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
