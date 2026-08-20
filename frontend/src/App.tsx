import { useRef } from "react";
import "./styles/global.css";
import "./styles/layout.css";

import Cursor from "./components/Cursor/Cursor";
import PixelTransition from "./components/PixelTransition/PixelTransition";
import FlowingMenu, { type FlowingMenuItem } from "./components/FlowingMenu/FlowingMenu";
import DomeGallery from "./components/DomeGallery/DomeGallery";
import PahadiBotLauncher from "./components/PahadiBot/PahadiBotLauncher";

import heroPanorama from "./assets/art/hero-panorama.webp";
import navLake from "./assets/art/nav-lake.webp";
import navHimalaya from "./assets/art/nav-himalaya.webp";
import navTown from "./assets/art/nav-town.webp";
import navNight from "./assets/art/nav-night.webp";

import galleryLake1 from "./assets/art/gallery-lake-1.webp";
import galleryLake2 from "./assets/art/gallery-lake-2.webp";
import galleryLake3 from "./assets/art/gallery-lake-3.webp";
import galleryHimalaya from "./assets/art/gallery-himalaya.webp";
import galleryMountains from "./assets/art/gallery-mountains.webp";
import galleryTown from "./assets/art/gallery-town.webp";
import galleryNight from "./assets/art/gallery-night.webp";

const MENU_ITEMS: FlowingMenuItem[] = [
  { label: "Overview", href: "#hero", image: navLake },
  { label: "Zone Map", href: "#gallery", image: navHimalaya },
  { label: "Stress Test", href: "#roadmap", image: navTown },
  { label: "Data & Methodology", href: "#data", image: navNight },
];

const GALLERY_IMAGES = [
  galleryLake1,
  galleryHimalaya,
  galleryLake2,
  galleryMountains,
  galleryLake3,
  galleryTown,
  galleryNight,
];

const ROADMAP = [
  {
    label: "Data pipeline",
    detail: "Cleaning, harmonization, GPS-to-zone join (notebooks/01_data_cleaning_eda.ipynb)",
    status: "done" as const,
  },
  {
    label: "Design system + landing page",
    detail: "This page: tokens, cursor, pixel transitions, flowing menu, dome gallery",
    status: "done" as const,
  },
  {
    label: "FastAPI backend",
    detail: "Serve processed indices, zones, and the stress-test scenario endpoint",
    status: "next" as const,
  },
  {
    label: "Overview + zone map views",
    detail: "Wire the Tourism Vulnerability Index and per-zone scores to real data",
    status: "planned" as const,
  },
  {
    label: "Stress-test simulator",
    detail: "Footfall slider against the Nainital road-capacity anchor",
    status: "planned" as const,
  },
  {
    label: "PahadiBot",
    detail: "Groq-backed chat, grounded in this dashboard's own computed numbers",
    status: "planned" as const,
  },
];

const STATUS_LABEL = { done: "Done", next: "Next", planned: "Planned" };

function scrollToId(id: string) {
  const el = document.querySelector(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function App() {
  const heroRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <Cursor />

      <header className="site-header">
        <div className="brand">
          <strong>Nainital</strong>
          <span>/ tourism vulnerability</span>
        </div>
        <nav className="header-links">
          <a href="#data">data</a>
          <a href="#roadmap">roadmap</a>
          <a
            href="https://github.com"
            onClick={(e) => e.preventDefault()}
            data-cursor
            data-cursor-label="SOON"
          >
            repo
          </a>
        </nav>
      </header>

      <main>
        <section id="hero" className="hero container" ref={heroRef}>
          <div className="hero-grid">
            <div>
              <span className="eyebrow">Nainital, Uttarakhand · carrying capacity &amp; overtourism</span>
              <h1>Measuring the weight tourism puts on a lake town.</h1>
              <p className="hero-lede">
                Five field surveys, ten zones, one composite vulnerability index. Built from real
                data collected across Nainital&apos;s hotels, households, workers, visitors, and
                streets, so pressure on water, waste, infrastructure, and livelihoods stops being
                anecdotal.
              </p>
              <div className="hero-actions">
                <a href="#gallery" className="btn btn-solid" data-cursor data-cursor-label="GO">
                  See the ground truth
                </a>
                <a href="#roadmap" className="btn" data-cursor data-cursor-label="GO">
                  Build status
                </a>
              </div>
            </div>

            <div className="hero-stats">
              <div className="hero-stat">
                <span className="num mono-num">1,029</span>
                <span className="label">Survey responses</span>
              </div>
              <div className="hero-stat">
                <span className="num mono-num">5</span>
                <span className="label">Respondent groups</span>
              </div>
              <div className="hero-stat">
                <span className="num mono-num">10</span>
                <span className="label">Surveyed zones</span>
              </div>
              <div className="hero-stat">
                <span className="num mono-num">6</span>
                <span className="label">Vulnerability pillars</span>
              </div>
            </div>
          </div>

          <div className="hero-image-frame">
            <PixelTransition
              firstContent={<img src={heroPanorama} alt="Panoramic view of Nainital town and Naini Lake" />}
              columns={14}
              rows={5}
              color="var(--paper-deep)"
            />
          </div>
          <div className="hero-caption">
            <span>Nainital town &amp; Naini Lake, aerial view</span>
            <span>duotone treatment · original: wikimedia commons, cc by-sa 4.0</span>
          </div>
        </section>

        <section className="section container">
          <div className="section-head">
            <span className="eyebrow">Where this is headed</span>
            <h2>Five views, one dashboard.</h2>
            <p className="section-lede">
              The full dashboard is still being built (see the roadmap below). These are its
              planned sections.
            </p>
          </div>
          <FlowingMenu items={MENU_ITEMS} onNavigate={(href) => scrollToId(href)} />
        </section>

        <section id="gallery" className="section gallery-section container">
          <div className="section-head">
            <span className="eyebrow">The ground truth</span>
            <h2>Ten zones. Five voices. One lake.</h2>
            <p className="section-lede">
              Field photography from the surveyed area, processed into this dashboard&apos;s
              visual language. Drag to look around.
            </p>
          </div>
          <DomeGallery images={GALLERY_IMAGES} />
        </section>

        <section id="data" className="section container">
          <div className="section-head">
            <span className="eyebrow">How it&apos;s built</span>
            <h2>Real data, cited methodology.</h2>
            <p className="section-lede">
              No synthetic numbers. Every pillar below traces back to a specific survey question,
              and every threshold traces back to a cited source, documented in
              <code> RESEARCH_BENCHMARKS.md</code>.
            </p>
          </div>
          <div className="panel-grid">
            <div className="panel stat-panel">
              <span className="num mono-num">157 / 320 / 239 / 303 / 10</span>
              <span className="label">Enterprise / Tourist / Residents / Workers / Zones</span>
              <p>Respondent counts per survey, after cleaning.</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">72</span>
              <span className="label">Columns dropped</span>
              <p>Dead, never-answered KoBo form-revision fields, logged and removed.</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">204 / 61</span>
              <span className="label">GPS points assigned to a zone</span>
              <p>143 residents + 61 enterprises matched within 500m of a surveyed site.</p>
            </div>
            <div className="panel stat-panel">
              <span className="num mono-num">9</span>
              <span className="label">Cited external benchmarks</span>
              <p>UNWTO, Sphere, GSTC, Doxey&apos;s Irridex, OECD/JRC, Nainital&apos;s own NGT carrying-capacity study, and more.</p>
            </div>
          </div>
        </section>

        <section id="roadmap" className="section container">
          <div className="section-head">
            <span className="eyebrow">Build status</span>
            <h2>What&apos;s done, what&apos;s next.</h2>
          </div>
          <div className="roadmap-list">
            {ROADMAP.map((r, i) => (
              <div className="roadmap-row" key={r.label}>
                <span className="idx mono-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="desc">
                  {r.label}
                  <small>{r.detail}</small>
                </span>
                <span className={`tag tag-${r.status}`}>{STATUS_LABEL[r.status]}</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>Nainital Tourism Vulnerability Dashboard · TISS Urban Immersion, 2024-28 batch</span>
        <span>Photography: Wikimedia Commons, CC BY-SA 4.0 (see src/assets/art/ATTRIBUTIONS.md)</span>
      </footer>

      <PahadiBotLauncher />
    </>
  );
}
