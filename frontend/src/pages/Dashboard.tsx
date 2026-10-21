import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { gsap, useGSAP } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { SplitHeading } from "../components/Reveal/Reveal";
import PillTabs from "../components/PillTabs/PillTabs";
import OverviewTab from "./dashboard/OverviewTab";
import TouristsTab from "./dashboard/TouristsTab";
import EnterprisesTab from "./dashboard/EnterprisesTab";
import LocalsTab from "./dashboard/LocalsTab";
import WorkersTab from "./dashboard/WorkersTab";
import SynthesisTab from "./dashboard/SynthesisTab";
import ModelInsightsTab from "./dashboard/ModelInsightsTab";
import "./Dashboard.css";

type TabId = "overview" | "tourists" | "enterprises" | "locals" | "workers" | "synthesis" | "model";

const TABS: { id: TabId; label: string; lede: string }[] = [
  {
    id: "overview",
    label: "Big Picture",
    lede: "Town-wide TVI, its six pillars, and who was surveyed.",
  },
  {
    id: "tourists",
    label: "Tourists",
    lede: "The demand side: the pressure tourists feel, and the pressure they create.",
  },
  {
    id: "enterprises",
    label: "Enterprises",
    lede: "The supply side: water, waste, and how much of the benefit stays local.",
  },
  {
    id: "locals",
    label: "Locals",
    lede: "Residents, geotagged by zone -- where tourism's pressure actually lands.",
  },
  {
    id: "workers",
    label: "Workers",
    lede: "Tourism-linked labour: the thinnest-measured group in this project.",
  },
  {
    id: "synthesis",
    label: "Synthesis",
    lede: "All four groups, one triad each -- side by side, overlaid, and split by tourism-dependence.",
  },
  {
    id: "model",
    label: "Model Insights",
    lede: "The composite-index approach, checked three more ways: unsupervised zone clustering, a predictive model, and a robustness test on the weights themselves.",
  },
];

const TAB_IDS = TABS.map((t) => t.id);

function isTabId(v: string | null): v is TabId {
  return !!v && (TAB_IDS as string[]).includes(v);
}

/**
 * The Dashboard: a narrative, not a set of parallel lenses. A pill tab bar
 * swaps the content below it rather than routing to a new page, walking
 * through how tourism affects each stakeholder group in turn (Tourists,
 * Enterprises, Locals, Workers) before landing on the Synthesis tab, where
 * all four groups' pillar profiles are read together for the first time.
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
          <span className="eyebrow">The dashboard</span>
          <SplitHeading as="h1" className="page-title">
            Nainital tourism vulnerability
          </SplitHeading>
          <p className="section-lede">
            One story: how tourism affects each of the four groups it touches -- Tourists,
            Enterprises, Locals, Workers -- read one at a time, then together on the Synthesis
            tab. Exact methodology for every number lives on the home page's Data &amp; Methodology
            section.
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
          {active === "tourists" && <TouristsTab />}
          {active === "enterprises" && <EnterprisesTab />}
          {active === "locals" && <LocalsTab />}
          {active === "workers" && <WorkersTab />}
          {active === "synthesis" && <SynthesisTab />}
          {active === "model" && <ModelInsightsTab />}
        </div>
      </section>
    </main>
  );
}
