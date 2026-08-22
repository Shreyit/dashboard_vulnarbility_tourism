import { useRef } from "react";
import { gsap, useGSAP, ScrollTrigger } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import NainitalArt from "./NainitalArt";
import "./NainitalScene.css";

const STEPS = [
  {
    kicker: "the bowl",
    title: "Seven hills, one basin.",
    body: "Nainital sits in a glacial bowl -- Naina Peak and Deopatha on one shoulder, Ayarpatha on the other, the Himalayan wall behind all of it. The town cannot grow outwards. It only grows denser.",
  },
  {
    kicker: "the lake",
    title: "A lake with a fixed volume.",
    body: "Naini Lake holds what it holds. Every additional visitor draws from the same water, and every extra litre of sewage returns to the same catchment. That is the Water Stress and Waste pillars, in one image.",
  },
  {
    kicker: "the load",
    title: "A road that cannot widen.",
    body: "The Mall traces the east bank between the water and the hillside, and the ropeway lifts the overflow up to Snow View. Both were sized for a hill station, not for a peak-season weekend.",
  },
  {
    kicker: "the reading",
    title: "Pressure, as a number.",
    body: "Everything in this drawing becomes six sub-indices and one composite score -- measured from 1,029 survey responses across nine zones, not estimated from the view.",
  },
];

/** How many viewport-heights of scroll the whole scene takes to play through. */
const RUNWAY_VH = 5;

/** Sticky header height, read from the same CSS token the layout uses. */
const HEADER_H = 56;

/**
 * The scroll-driven Nainital scene.
 *
 * The illustration is drawn onto the page as the section is read: ridgelines
 * and the lake outline stroke themselves in with DrawSVG, boats travel real
 * motion paths across the water, the ropeway car climbs its cable, and a
 * hatched "pressure" band rises through the lake as the copy moves from
 * describing the place to describing its load.
 *
 * The strip stays put with plain `position: sticky` inside a tall wrapper
 * rather than ScrollTrigger's `pin`, matching the decision documented in
 * PhotoStrip.tsx -- pinning forces a document reflow on every scroll tick and
 * was confirmed to resurface an unrelated hover bug elsewhere on this page.
 */
export default function NainitalScene() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const wrapper = wrapperRef.current;
      const sticky = stickyRef.current;
      if (!wrapper || !sticky) return;

      const q = gsap.utils.selector(sticky);
      const boats = q(".boat");
      const birds = q(".bird");
      const captions = q(".nainital-step");

      // Everything that gets drawn or placed starts from a known state, so a
      // reload part-way down the page can't leave half the scene stranded.
      const seed = () => {
        gsap.set(q(".peak-line, .snow-hatch path, .ridge, .mist-line, .ripple, .reflection path, #ropeway-cable, #mall-road"), {
          drawSVG: 0,
        });
        gsap.set(q("#lake-shape"), { drawSVG: 0, fillOpacity: 0 });
        gsap.set(q(".hill-body"), { autoAlpha: 0 });
        gsap.set(q(".pine"), { scale: 0, transformOrigin: "center bottom", autoAlpha: 0 });
        gsap.set(q(".building"), { scaleY: 0, transformOrigin: "center bottom", autoAlpha: 0 });
        gsap.set(q("#temple"), { scale: 0, transformOrigin: "center bottom", autoAlpha: 0 });
        gsap.set(q(".peak-label"), { autoAlpha: 0 });
        gsap.set(q("#pressure-band"), { y: 130, autoAlpha: 0 });
        gsap.set(q(".contour"), { drawSVG: 0 });
        gsap.set(q(".pylon path"), { autoAlpha: 0 });

        // Park the movers at the head of their own paths instead of at the
        // SVG origin -- a motionPath tween only positions its target once it
        // starts, and until then an unset boat sits in the top-left corner.
        gsap.set(q("#sun"), {
          motionPath: { path: "#sun-path", align: "#sun-path", alignOrigin: [0.5, 0.5], start: 0.04, end: 0.04 },
          autoAlpha: 0,
        });
        gsap.set(q("#cable-car"), {
          motionPath: { path: "#ropeway-cable", align: "#ropeway-cable", alignOrigin: [0.5, 0.5], start: 0, end: 0 },
          autoAlpha: 0,
        });
        boats.forEach((boat, i) => {
          gsap.set(boat, {
            motionPath: {
              path: `#boat-path-${["a", "b", "c"][i]}`,
              align: `#boat-path-${["a", "b", "c"][i]}`,
              alignOrigin: [0.5, 0.5],
              start: 0,
              end: 0,
            },
            autoAlpha: 0,
            scale: 0.9,
          });
        });
        birds.forEach((bird, i) => {
          gsap.set(bird, {
            motionPath: { path: "#bird-path", align: "#bird-path", alignOrigin: [0.5, 0.5], start: 0, end: 0 },
            autoAlpha: 0,
            scale: 0.7 + i * 0.12,
          });
        });
      };

      seed();

      if (reduced) {
        // Reduced motion still gets the finished drawing -- it is content, not
        // decoration -- just delivered whole instead of stroke by stroke.
        gsap.set(q(".peak-line, .snow-hatch path, .ridge, .mist-line, .ripple, .reflection path, #ropeway-cable, #mall-road, .contour"), {
          drawSVG: "100%",
        });
        gsap.set(q("#lake-shape"), { drawSVG: "100%", fillOpacity: 1 });
        gsap.set(q(".hill-body"), { autoAlpha: 1 });
        gsap.set(q(".pine, .building, #temple"), { scale: 1, scaleY: 1, autoAlpha: 1 });
        gsap.set(q(".peak-label, .pylon path"), { autoAlpha: 1 });
        gsap.set(q("#pressure-band"), { y: 42, autoAlpha: 1 });
        gsap.set(q("#sun"), {
          motionPath: { path: "#sun-path", align: "#sun-path", alignOrigin: [0.5, 0.5], start: 0.5, end: 0.5 },
          autoAlpha: 1,
        });
        gsap.set(q("#cable-car"), {
          motionPath: { path: "#ropeway-cable", align: "#ropeway-cable", alignOrigin: [0.5, 0.5], start: 0.6, end: 0.6 },
          autoAlpha: 1,
        });
        boats.forEach((boat, i) => {
          gsap.set(boat, {
            motionPath: {
              path: `#boat-path-${["a", "b", "c"][i]}`,
              align: `#boat-path-${["a", "b", "c"][i]}`,
              alignOrigin: [0.5, 0.5],
              start: 0.3 + i * 0.2,
              end: 0.3 + i * 0.2,
            },
            autoAlpha: 1,
            scale: 1,
          });
        });
        gsap.set(captions, { autoAlpha: 0 });
        gsap.set(captions[0], { autoAlpha: 1 });
        gsap.set(q(".nainital-progress-bar"), { scaleX: 1 });
        return;
      }

      // ---------------------------------------------------------------
      // The scene's own timeline, scrubbed by the wrapper's scroll runway.
      // ---------------------------------------------------------------
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: wrapper,
          start: () => `top top+=${HEADER_H}`,
          end: () => `+=${window.innerHeight * RUNWAY_VH}`,
          scrub: 0.9,
        },
      });

      // -- sky and the far wall --
      tl.to(q("#sun"), { autoAlpha: 1, duration: 0.4 }, 0)
        .to(
          q("#sun"),
          {
            motionPath: { path: "#sun-path", align: "#sun-path", alignOrigin: [0.5, 0.5], start: 0.04, end: 0.96 },
            duration: 10,
          },
          0,
        )
        .to(q("#sun circle"), { stroke: "var(--rust-deep)", duration: 10 }, 0)
        .to(q(".sky-wash"), { fill: "var(--paper-deep)", duration: 10, ease: "power1.in" }, 0)
        .fromTo(q(".peak-line"), { drawSVG: 0 }, { drawSVG: "100%", duration: 1.4, ease: "power1.inOut" }, 0)
        .fromTo(q(".snow-hatch path"), { drawSVG: 0 }, { drawSVG: "100%", duration: 0.5, stagger: 0.12 }, 0.7);

      // -- the ring of hills draws itself, ridge by ridge --
      tl.fromTo(
        q(".ridge"),
        { drawSVG: 0 },
        { drawSVG: "100%", duration: 1.3, stagger: 0.28, ease: "power1.inOut" },
        0.7,
      )
        // the landmass fills in just behind its own ridgeline, so each range
        // starts hiding what is behind it as soon as it has an edge to do it with
        .to(q(".hill-body"), { autoAlpha: 1, duration: 0.9, stagger: 0.28, ease: "power1.out" }, 1.0)
        .fromTo(q(".mist-line"), { drawSVG: 0 }, { drawSVG: "100%", duration: 0.8, stagger: 0.1 }, 1.3)
        .to(q(".mist-line"), { x: 46, duration: 8, ease: "sine.inOut", stagger: 0.4 }, 1.3)
        .to(q(".peak-label"), { autoAlpha: 1, duration: 0.5, stagger: 0.2 }, 1.9);

      // -- deodars come up out of the ridgeline --
      tl.to(
        q(".pine"),
        {
          scale: 1,
          autoAlpha: 1,
          duration: 0.5,
          ease: "back.out(2)",
          stagger: { each: 0.045, from: "center" },
        },
        1.8,
      );

      // -- ropeway --
      tl.fromTo(q("#ropeway-cable"), { drawSVG: 0 }, { drawSVG: "100%", duration: 0.7 }, 2.4)
        .to(q(".pylon path"), { autoAlpha: 1, duration: 0.3 }, 2.8)
        .to(q("#cable-car"), { autoAlpha: 1, duration: 0.3 }, 2.9)
        .to(
          q("#cable-car"),
          {
            motionPath: { path: "#ropeway-cable", align: "#ropeway-cable", alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            duration: 4.5,
            ease: "power1.inOut",
          },
          2.9,
        );

      // -- the lake fills in --
      tl.fromTo(q("#lake-shape"), { drawSVG: 0 }, { drawSVG: "100%", duration: 1.6, ease: "power1.inOut" }, 2.6)
        .to(q("#lake-shape"), { fillOpacity: 1, duration: 0.8 }, 3.4)
        .fromTo(q(".ripple"), { drawSVG: 0 }, { drawSVG: "100%", duration: 0.7, stagger: 0.09 }, 3.6)
        .fromTo(q(".reflection path"), { drawSVG: 0 }, { drawSVG: "100%", duration: 0.9, stagger: 0.12 }, 3.8)
        // the surface never settles: ripples drift for the rest of the scene
        .to(q(".ripple"), { x: (i) => (i % 2 ? -22 : 26), duration: 6, ease: "sine.inOut", stagger: 0.15 }, 4.2);

      // -- boats put out onto the water --
      boats.forEach((boat, i) => {
        const path = `#boat-path-${["a", "b", "c"][i]}`;
        tl.to(boat, { autoAlpha: 1, scale: 1, duration: 0.4 }, 3.9 + i * 0.25).to(
          boat,
          {
            motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: 0, end: 1, autoRotate: false },
            duration: 6 + i,
            ease: "sine.inOut",
          },
          3.9 + i * 0.25,
        );
        // a boat on a lake is never level -- a slow independent rock, on top of
        // whatever the motion path is doing to its position
        tl.to(boat, { rotation: i % 2 ? 4 : -4, duration: 1.6, yoyo: true, repeat: 3, ease: "sine.inOut" }, 4.1 + i * 0.25);
      });

      // -- the town and the temple --
      tl.to(q("#temple"), { scale: 1, autoAlpha: 1, duration: 0.6, ease: "back.out(1.6)" }, 4.4)
        .to(
          q(".building"),
          { scaleY: 1, autoAlpha: 1, duration: 0.45, ease: "power2.out", stagger: { each: 0.055, from: "start" } },
          4.7,
        )
        .fromTo(q("#mall-road"), { drawSVG: 0 }, { drawSVG: "100%", duration: 1.1, ease: "power1.inOut" }, 5.1);

      // -- birds cross, wings flapping --
      birds.forEach((bird, i) => {
        tl.to(bird, { autoAlpha: 1, duration: 0.3 }, 5.4 + i * 0.3).to(
          bird,
          {
            motionPath: { path: "#bird-path", align: "#bird-path", alignOrigin: [0.5, 0.5], start: 0, end: 1 },
            duration: 5,
            ease: "none",
          },
          5.4 + i * 0.3,
        );
        // wing-beat lives outside the scrubbed timeline: it should keep its own
        // rhythm rather than run at whatever speed the reader scrolls
        gsap.to(bird, { scaleY: 0.45, duration: 0.28, yoyo: true, repeat: -1, ease: "sine.inOut", delay: i * 0.08 });
      });

      // -- and the load finally shows up in the water --
      tl.to(q("#pressure-band"), { autoAlpha: 1, duration: 0.6 }, 6.4)
        .to(q("#pressure-band"), { y: 30, duration: 3, ease: "power1.in" }, 6.4)
        .to(q("#lake-shape"), { stroke: "var(--rust)", strokeWidth: 3, duration: 1.6 }, 7.4)
        .fromTo(q(".contour"), { drawSVG: 0 }, { drawSVG: "100%", duration: 1.2, stagger: 0.2 }, 7.0);

      // ---------------------------------------------------------------
      // Captions: one legible statement at a time, cross-faded on the same
      // scrub so scrolling back reads the scene backwards correctly.
      // ---------------------------------------------------------------
      const slot = 10 / STEPS.length;
      captions.forEach((caption, i) => {
        const at = i * slot;
        gsap.set(caption, { autoAlpha: i === 0 ? 1 : 0, y: i === 0 ? 0 : 18 });
        if (i > 0) {
          tl.to(caption, { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" }, at);
        }
        if (i < captions.length - 1) {
          tl.to(caption, { autoAlpha: 0, y: -18, duration: 0.5, ease: "power2.in" }, at + slot - 0.5);
        }
      });

      // ---------------------------------------------------------------
      // Parallax. Separate scrubbed tweens rather than timeline entries: these
      // track raw scroll position, not the story's beats.
      // ---------------------------------------------------------------
      const parallax: [string, number][] = [
        ['[data-layer="himalaya"]', 34],
        ['[data-layer="mist"]', 24],
        ['[data-layer="hills"]', 12],
        ['[data-layer="pines"]', 4],
        ['[data-layer="lake"]', -14],
        ['[data-layer="town"]', -6],
        ['[data-layer="contours"]', -40],
      ];
      parallax.forEach(([selector, distance]) => {
        gsap.to(q(selector), {
          y: distance,
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: () => `top top+=${HEADER_H}`,
            end: () => `+=${window.innerHeight * RUNWAY_VH}`,
            scrub: 1.4,
          },
        });
      });

      // progress readout along the bottom of the frame
      gsap.fromTo(
        q(".nainital-progress-bar"),
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: {
            trigger: wrapper,
            start: () => `top top+=${HEADER_H}`,
            end: () => `+=${window.innerHeight * RUNWAY_VH}`,
            scrub: 0.4,
          },
        },
      );

      // The art is inline SVG, so it is laid out before paint -- but the
      // surrounding page still has images that can resize this section.
      ScrollTrigger.refresh();
    },
    { scope: stickyRef, dependencies: [reduced], revertOnUpdate: true },
  );

  return (
    <section
      id="the-place"
      className="nainital-wrapper"
      ref={wrapperRef}
      style={{ height: `${RUNWAY_VH * 100}vh` }}
      aria-label="Nainital, drawn"
    >
      <div className="nainital-sticky" ref={stickyRef}>
        <div className="nainital-frame">
          <NainitalArt />

          <div className="nainital-captions">
            {STEPS.map((step) => (
              <article className="nainital-step" key={step.kicker}>
                <span className="eyebrow">{step.kicker}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>

          <div className="nainital-progress" aria-hidden="true">
            <span className="nainital-progress-bar" />
          </div>
          <span className="nainital-credit">Naini Lake &amp; the seven hills · drawn to scale of the survey, not the map</span>
        </div>
      </div>
    </section>
  );
}
