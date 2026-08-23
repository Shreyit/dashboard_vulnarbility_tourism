import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap, useGSAP } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { SplitHeading } from "../components/Reveal/Reveal";
import PillTabs from "../components/PillTabs/PillTabs";
import OverviewTab from "./dashboard/OverviewTab";
import ZoneMapTab from "./dashboard/ZoneMapTab";
import EsacTab from "./dashboard/EsacTab";
import ResidentAttitudesTab from "./dashboard/ResidentAttitudesTab";
import StressTestTab from "./dashboard/StressTestTab";
import "./Dashboard.css";

type TabId = "overview" | "zones" | "esac" | "attitudes" | "stress";

const TABS: { id: TabId; label: string; lede: string }[] = [
  {
    id: "overview",
    label: "Overview",
    lede: "Town-wide TVI, its six pillars, the sustainability triad, and who feels the pressure.",
  },
  {
    id: "zones",
    label: "Zone Map",
    lede: "The nine surveyed sites, each with its own score and breakdown.",
  },
  {
    id: "esac",
    label: "E-S-AC",
    lede: "A second vulnerability lens: Exposure, Sensitivity, and Adaptive Capacity, by zone.",
  },
  {
    id: "attitudes",
    label: "Attitudes",
    lede: "Do tourism-dependent residents feel less irritation? A Social Exchange Theory test.",
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
  const contentRef = useRef<HTMLDivElement>(null);
  const shownTab = useRef(active);
  const reduced = useReducedMotion();

  const select = (id: string) => {
    if (id === active || !isTabId(id)) return;
    setActive(id);
    setParams({ tab: id }, { replace: true });
  };

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
            One instrument panel: the composite index, the zone-by-zone map, a second vulnerability
            lens, a resident-attitudes test, and the peak-season stress simulator, read together
            instead of as separate screens. Exact methodology for every number lives on the home
            page's Data &amp; Methodology section.
          </p>
        </div>

        <PillTabs
          tabs={TABS.map((t) => ({ id: t.id, label: t.label }))}
          active={active}
          onSelect={select}
          ariaLabel="Dashboard view"
        />

        <p className="dome-tab-lede">{current.lede}</p>

        <div className="dome-content" ref={contentRef}>
          {active === "overview" && <OverviewTab />}
          {active === "zones" && <ZoneMapTab />}
          {active === "esac" && <EsacTab />}
          {active === "attitudes" && <ResidentAttitudesTab />}
          {active === "stress" && <StressTestTab />}
        </div>
      </section>
    </main>
  );
}
