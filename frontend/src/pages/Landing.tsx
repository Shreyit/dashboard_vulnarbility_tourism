import { useRef } from "react";
import { useNavigate } from "react-router-dom";

import PixelTransition from "../components/PixelTransition/PixelTransition";
import FlowingMenu, { type FlowingMenuItem } from "../components/FlowingMenu/FlowingMenu";
import PhotoStrip from "../components/PhotoStrip/PhotoStrip";

import heroPanorama from "../assets/art/hero-panorama.webp";
import navLake from "../assets/art/nav-lake.webp";
import navHimalaya from "../assets/art/nav-himalaya.webp";
import navTown from "../assets/art/nav-town.webp";
import navNight from "../assets/art/nav-night.webp";

import galleryLake1 from "../assets/art/gallery-lake-1.webp";
import galleryLake2 from "../assets/art/gallery-lake-2.webp";
import galleryLake3 from "../assets/art/gallery-lake-3.webp";
import galleryHimalaya from "../assets/art/gallery-himalaya.webp";
import galleryMountains from "../assets/art/gallery-mountains.webp";
import galleryTown from "../assets/art/gallery-town.webp";
import galleryNight from "../assets/art/gallery-night.webp";

const MENU_ITEMS: FlowingMenuItem[] = [
  { label: "Overview", href: "/overview", image: navLake },
  { label: "Zone Map", href: "/zones", image: navHimalaya },
  { label: "Stress Test", href: "/stress-test", image: navTown },
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

function scrollToId(id: string) {
  const el = document.querySelector(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleNavigate = (href: string) => {
    if (href.startsWith("#")) {
      scrollToId(href);
    } else {
      navigate(href);
    }
  };

  return (
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
              <a
                href="/overview"
                className="btn btn-solid"
                data-cursor
                data-cursor-label="GO"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/overview");
                }}
              >
                See the live index
              </a>
              <a href="#data" className="btn" data-cursor data-cursor-label="GO">
                How it&apos;s measured
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
          <span className="eyebrow">The dashboard</span>
          <h2>Five views, one dashboard.</h2>
          <p className="section-lede">
            The town-wide index, a zone-by-zone map, and a peak-season stress-test simulator you
            can play with yourself.
          </p>
        </div>
        <FlowingMenu items={MENU_ITEMS} onNavigate={handleNavigate} />
      </section>

      <section id="gallery" className="section gallery-section container">
        <div className="section-head">
          <span className="eyebrow">The ground truth</span>
          <h2>Ten zones. Five voices. One lake.</h2>
          <p className="section-lede">
            Field photography from the surveyed area, processed into this dashboard&apos;s
            visual language. Keep scrolling to browse.
          </p>
        </div>
        <PhotoStrip images={GALLERY_IMAGES} />
      </section>

      <section id="data" className="section container">
        <div className="section-head">
          <span className="eyebrow">How it&apos;s built</span>
          <h2>Real data, cited methodology.</h2>
          <p className="section-lede">
            No synthetic numbers. Every pillar below traces back to a specific survey question,
            and every threshold traces back to a cited source -- UNWTO, Sphere, GSTC, and more.
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
            <p>Dead, never-answered survey fields, logged and removed.</p>
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
    </main>
  );
}
