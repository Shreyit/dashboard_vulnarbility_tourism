import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { gsap, useGSAP, EASE } from "../lib/gsap";
import { useReducedMotion } from "../hooks/useReducedMotion";

import PixelTransition from "../components/PixelTransition/PixelTransition";
import FlowingMenu, { type FlowingMenuItem } from "../components/FlowingMenu/FlowingMenu";
import PhotoStrip from "../components/PhotoStrip/PhotoStrip";
import NainitalScene from "../components/NainitalScene/NainitalScene";
import Magnetic from "../components/Magnetic/Magnetic";
import { Reveal, SplitHeading, CountUp } from "../components/Reveal/Reveal";

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
  {
    label: "Overview",
    href: "/overview",
    image: navLake,
    blurb: "The town-wide index and its six pillars, broken down to source questions.",
  },
  {
    label: "Zone Map",
    href: "/zones",
    image: navHimalaya,
    blurb: "Ten surveyed sites, each with its own score and breakdown.",
  },
  {
    label: "Stress Test",
    href: "/stress-test",
    image: navTown,
    blurb: "Drag peak-season footfall and watch every sub-index recompute.",
  },
  {
    label: "Data & Methodology",
    href: "#data",
    image: navNight,
    blurb: "Every threshold, and the cited source it came from.",
  },
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

const GALLERY_CAPTIONS = [
  "naini lake, from the mall",
  "the himalayan wall, from snow view",
  "boat stands, mallital end",
  "the ring of hills",
  "the lake at tallital",
  "town, stacked up the slope",
  "after the day trippers leave",
];

function scrollToId(id: string) {
  const el = document.querySelector(id);
  el?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  const handleNavigate = (href: string) => {
    if (href.startsWith("#")) {
      scrollToId(href);
    } else {
      navigate(href);
    }
  };

  // ---- hero: one entrance timeline, plus scrubbed depth on the panorama ----
  useGSAP(
    () => {
      const hero = heroRef.current;
      if (!hero || reduced) return;
      const q = gsap.utils.selector(hero);

      // A single timeline rather than four tweens with hand-tuned delays --
      // the ordering stays readable and the whole entrance can be reversed or
      // killed as one unit.
      gsap
        .timeline({ defaults: { ease: EASE.out } })
        .from(q(".eyebrow"), { autoAlpha: 0, x: -16, duration: 0.5 }, 0)
        .from(q(".hero-lede"), { autoAlpha: 0, y: 18, duration: 0.7 }, 0.35)
        .from(q(".hero-actions .magnetic"), { autoAlpha: 0, y: 16, duration: 0.5, stagger: 0.09 }, 0.5)
        .from(
          q(".hero-stat"),
          { autoAlpha: 0, y: 22, duration: 0.5, stagger: { each: 0.07, from: "start" } },
          0.6,
        )
        .from(q(".hero-caption span"), { autoAlpha: 0, duration: 0.4, stagger: 0.1 }, 0.9);

      // the panorama drifts inside its frame as the hero scrolls away
      gsap.to(q(".hero-image-frame img"), {
        yPercent: -12,
        scale: 1.1,
        ease: "none",
        scrollTrigger: { trigger: q(".hero-image-frame"), start: "top bottom", end: "bottom top", scrub: 1 },
      });

      // and the stats row lags behind the copy, a touch
      gsap.to(q(".hero-stats"), {
        y: -26,
        ease: "none",
        scrollTrigger: { trigger: hero, start: "top top", end: "bottom top", scrub: 1.2 },
      });
    },
    { dependencies: [reduced], scope: heroRef, revertOnUpdate: true },
  );

  return (
    <main>
      <section id="hero" className="hero container" ref={heroRef}>
        <div className="hero-grid">
          <div>
            <span className="eyebrow">Nainital, Uttarakhand · carrying capacity &amp; overtourism</span>
            <SplitHeading as="h1" type="lines">
              Measuring the weight tourism puts on a lake town.
            </SplitHeading>
            <p className="hero-lede">
              Five field surveys, ten zones, one composite vulnerability index. Built from real
              data collected across Nainital&apos;s hotels, households, workers, visitors, and
              streets, so pressure on water, waste, infrastructure, and livelihoods stops being
              anecdotal.
            </p>
            <div className="hero-actions">
              <Magnetic strength={0.42} radius={100} maxOffset={22}>
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
              </Magnetic>
              <Magnetic strength={0.42} radius={100} maxOffset={22}>
                <a href="#data" className="btn" data-cursor data-cursor-label="GO">
                  How it&apos;s measured
                </a>
              </Magnetic>
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <span className="num mono-num">
                <CountUp value={1029} group />
              </span>
              <span className="label">Survey responses</span>
            </div>
            <div className="hero-stat">
              <span className="num mono-num">
                <CountUp value={5} />
              </span>
              <span className="label">Respondent groups</span>
            </div>
            <div className="hero-stat">
              <span className="num mono-num">
                <CountUp value={10} />
              </span>
              <span className="label">Surveyed zones</span>
            </div>
            <div className="hero-stat">
              <span className="num mono-num">
                <CountUp value={6} />
              </span>
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

      {/* the town, drawn on scroll */}
      <NainitalScene />

      <section className="section container">
        <div className="section-head">
          <span className="eyebrow">The dashboard</span>
          <SplitHeading as="h2">Five views, one dashboard.</SplitHeading>
          <Reveal as="p" className="section-lede">
            The town-wide index, a zone-by-zone map, and a peak-season stress-test simulator you
            can play with yourself.
          </Reveal>
        </div>
        <FlowingMenu items={MENU_ITEMS} onNavigate={handleNavigate} />
      </section>

      <section id="gallery" className="section gallery-section container">
        <div className="section-head">
          <span className="eyebrow">The ground truth</span>
          <SplitHeading as="h2">Ten zones. Five voices. One lake.</SplitHeading>
          <Reveal as="p" className="section-lede">
            Field photography from the surveyed area, processed into this dashboard&apos;s
            visual language. Keep scrolling to browse.
          </Reveal>
        </div>
        <PhotoStrip images={GALLERY_IMAGES} captions={GALLERY_CAPTIONS} />
      </section>

      <section id="data" className="section container">
        <div className="section-head">
          <span className="eyebrow">How it&apos;s built</span>
          <SplitHeading as="h2">Real data, cited methodology.</SplitHeading>
          <Reveal as="p" className="section-lede">
            No synthetic numbers. Every pillar below traces back to a specific survey question,
            and every threshold traces back to a cited source -- UNWTO, Sphere, GSTC, and more.
          </Reveal>
        </div>
        <Reveal className="panel-grid" stagger>
          <div className="panel stat-panel">
            <span className="num mono-num">157 / 320 / 239 / 303 / 10</span>
            <span className="label">Enterprise / Tourist / Residents / Workers / Zones</span>
            <p>Respondent counts per survey, after cleaning.</p>
          </div>
          <div className="panel stat-panel">
            <span className="num mono-num">
              <CountUp value={72} />
            </span>
            <span className="label">Columns dropped</span>
            <p>Dead, never-answered survey fields, logged and removed.</p>
          </div>
          <div className="panel stat-panel">
            <span className="num mono-num">204 / 61</span>
            <span className="label">GPS points assigned to a zone</span>
            <p>143 residents + 61 enterprises matched within 500m of a surveyed site.</p>
          </div>
          <div className="panel stat-panel">
            <span className="num mono-num">
              <CountUp value={9} />
            </span>
            <span className="label">Cited external benchmarks</span>
            <p>UNWTO, Sphere, GSTC, Doxey&apos;s Irridex, OECD/JRC, Nainital&apos;s own NGT carrying-capacity study, and more.</p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
