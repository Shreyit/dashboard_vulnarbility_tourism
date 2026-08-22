import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap, useGSAP, Flip } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { SplitHeading } from "../components/Reveal/Reveal";
import OverviewTab from "./dashboard/OverviewTab";
import ZoneMapTab from "./dashboard/ZoneMapTab";
import StressTestTab from "./dashboard/StressTestTab";
import "./Dashboard.css";

type TabId = "overview" | "zones" | "stress";

const TABS: { id: TabId; label: string; lede: string }[] = [
  {
    id: "overview",
    label: "Overview",
    lede: "Town-wide TVI and its six pillars, broken down to source questions.",
  },
  {
    id: "zones",
    label: "Zone Map",
    lede: "The ten surveyed sites, each with its own score and breakdown.",
  },
  {
    id: "stress",
    label: "Stress Test",
    lede: "Drag peak-season footfall and watch every sub-index recompute.",
  },
];

const TAB_IDS = TABS.map((t) => t.id);

function isTabId(v: string | null): v is TabId {
  return !!v && (TAB_IDS as string[]).includes(v);
}

/**
 * The Dashboard Dome: one page, one dome-shaped instrument panel, three
 * lenses on the same underlying data. A pill tab bar swaps the content below
 * it rather than routing to a new page, so the index, the map, and the
 * simulator read as one instrument rather than three separate screens.
 */
export default function Dashboard() {
  const [params, setParams] = useSearchParams();
  const initial = params.get("tab");
  const [active, setActive] = useState<TabId>(isTabId(initial) ? initial : "overview");
  const tabsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const shownTab = useRef(active);
  // the thumb's very first placement has no meaningful "previous box" to fly
  // from -- same guard as the header's active-link marker
  const thumbPlaced = useRef(false);
  const reduced = useReducedMotion();

  const select = (id: TabId) => {
    if (id === active) return;
    setActive(id);
    setParams({ tab: id }, { replace: true });
  };

  // ---- the pill thumb slides between tabs, re-parented into whichever
  // button is active -- the same Flip pattern as the header's nav marker ----
  useGSAP(
    () => {
      const bar = tabsRef.current;
      if (!bar) return;
      const thumb = bar.querySelector<HTMLElement>(".dome-tab-thumb");
      const target = bar.querySelector<HTMLElement>(`[data-tab="${active}"]`);
      if (!thumb || !target) return;

      const state = Flip.getState(thumb);
      target.appendChild(thumb);

      if (reduced || !thumbPlaced.current) {
        thumbPlaced.current = true;
        return;
      }
      Flip.from(state, { duration: 0.4, ease: "power3.inOut", absolute: true });
    },
    { dependencies: [active, reduced], scope: tabsRef },
  );

  // ---- content swap: a short settle rather than a full route wipe -- this
  // is a tab flip within one page, not a navigation ----
  useGSAP(
    () => {
      if (active === shownTab.current) return;
      shownTab.current = active;
      const el = contentRef.current;
      if (!el || reduced) return;

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(el, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.32 })
        .from(el.querySelectorAll(".panel"), { autoAlpha: 0, y: 10, duration: 0.3, stagger: 0.06 }, "-=0.18");
    },
    { dependencies: [active, reduced], scope: contentRef },
  );

  const current = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <main>
      <section className="section container dome-section" style={{ borderTop: "none", paddingTop: "var(--sp-6)" }}>
        <div className="section-head">
          <span className="eyebrow">The dashboard dome</span>
          <SplitHeading as="h1" className="page-title">
            Nainital tourism vulnerability
          </SplitHeading>
          <p className="section-lede">
            One instrument panel: the composite index, the zone-by-zone map, and the peak-season
            stress simulator, read together instead of as separate screens.
          </p>
        </div>

        <div className="dome-tabs" ref={tabsRef} role="tablist" aria-label="Dashboard view">
          <span className="dome-tab-thumb" aria-hidden="true" />
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              data-tab={tab.id}
              aria-selected={active === tab.id}
              className={`dome-tab${active === tab.id ? " is-active" : ""}`}
              onClick={() => select(tab.id)}
              data-cursor
              data-cursor-label="VIEW"
            >
              <span className="dome-tab-label">{tab.label}</span>
            </button>
          ))}
        </div>

        <p className="dome-tab-lede">{current.lede}</p>

        <div className="dome-content" ref={contentRef}>
          {active === "overview" && <OverviewTab />}
          {active === "zones" && <ZoneMapTab />}
          {active === "stress" && <StressTestTab />}
        </div>
      </section>
    </main>
  );
}
