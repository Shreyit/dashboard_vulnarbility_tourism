import { useMemo, useRef, useState } from "react";
import { gsap, useGSAP, ScrollTrigger } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { horizontalLoop } from "./horizontalLoop";
import "./PhotoStrip.css";

type PhotoStripProps = {
  images: string[];
  captions?: string[];
};

const REPEATS = 3; // duplicate the source photos so the loop has some length before repeating
const SCROLL_RUNWAY_VH = 3; // how many viewport-heights of scroll it takes to browse the whole strip
const GAP = 24; // must match .photostrip-track's `gap`

/** Sticky header height, read from the same CSS token the layout uses. */
const HEADER_H = 56;

/**
 * A horizontal photo strip, flat 2D, seamlessly looping (GreenSock's own
 * horizontalLoop() helper -- see horizontalLoop.ts for why). The strip itself
 * is a plain `position: sticky` element inside a tall wrapper, so scrolling
 * through that wrapper's height drives the loop's playhead while the strip
 * stays put on screen -- deliberately NOT using GSAP's ScrollTrigger `pin`
 * option, which forces a document reflow on every scroll tick and was
 * confirmed (while debugging an earlier version of this component) to
 * resurface an unrelated hover bug elsewhere on the page. Native
 * `position: sticky` achieves the same "scroll a while, stay in place" feel
 * without touching any other element's layout.
 *
 * On top of the loop, the strip behaves like a viewfinder: whichever print is
 * closest to the centre of the frame is presented square-on and full size,
 * and its neighbours fall back, tilt away and dim by distance. That focus pass
 * runs every scroll tick, so it is written to do zero layout reads --
 * each item's geometry is measured once, its live offset comes from GSAP's own
 * transform cache, and the result is written through a quickSetter.
 */
export default function PhotoStrip({ images, captions }: PhotoStripProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(0);
  const reduced = useReducedMotion();

  const items = useMemo(
    () => Array.from({ length: images.length * REPEATS }, (_, i) => images[i % images.length]),
    [images],
  );

  useGSAP(
    () => {
      const track = trackRef.current;
      const wrapper = wrapperRef.current;
      const viewport = viewportRef.current;
      if (!track || !wrapper || !viewport) return;

      const els = gsap.utils.toArray<HTMLElement>(track.children);
      const loop = horizontalLoop(els, { paused: true, repeat: -1, paddingRight: GAP });

      // ---- measured once; the focus pass never touches layout again ----
      const metrics = els.map((el) => ({ left: el.offsetLeft, width: el.offsetWidth }));
      const setFrame = els.map((el) => gsap.quickSetter(el, "css") as (v: object) => void);
      const plates = els.map((el) => el.querySelector<HTMLElement>(".photostrip-plate"));
      const inners = els.map((el) => el.querySelector<HTMLElement>("img"));
      const setInner = inners.map((img) => (img ? (gsap.quickSetter(img, "css") as (v: object) => void) : null));

      const mapScale = gsap.utils.mapRange(0, 1, 1.14, 0.84);
      const mapDim = gsap.utils.mapRange(0, 1, 1, 0.42);
      const clampNorm = gsap.utils.clamp(-1, 1);

      let lastFocused = -1;

      /** Present whichever print is nearest the centre of the frame. */
      const focusPass = () => {
        const half = viewport.clientWidth / 2;
        let bestIndex = 0;
        let bestDistance = Infinity;

        for (let i = 0; i < els.length; i++) {
          const { left, width } = metrics[i];
          // xPercent comes out of GSAP's transform cache -- a property read,
          // not a getBoundingClientRect, so this loop forces no layout.
          const xPercent = Number(gsap.getProperty(els[i], "xPercent"));
          const centre = left + (xPercent / 100) * width + width / 2;
          const delta = centre - half;
          const norm = clampNorm(delta / half);
          const away = Math.abs(norm);

          setFrame[i]({
            scale: mapScale(away),
            rotation: norm * 4.5,
            y: away * away * 26,
            opacity: mapDim(away),
            zIndex: Math.round((1 - away) * 100),
          });
          // the photograph drifts inside its own frame: parallax depth without
          // a single 3D transform, which this component deliberately avoids
          setInner[i]?.({ xPercent: -norm * 7, scale: 1.14 });

          if (away < bestDistance) {
            bestDistance = away;
            bestIndex = i;
          }
        }

        if (bestIndex !== lastFocused) {
          lastFocused = bestIndex;
          setFocused(bestIndex % images.length);
        }
      };

      if (reduced) {
        // No scroll-driven playhead. Lay the strip out once, mid-loop, so the
        // gallery is still browsable by its own horizontal scrollbar.
        loop.time(loop.duration() * 0.5);
        focusPass();
        return;
      }

      // ---- velocity skew: the strip leans into fast scrolling, then settles ----
      const skewTo = gsap.quickTo(track, "skewX", { duration: 0.55, ease: "power3.out" });
      const settle = gsap.delayedCall(0.16, () => skewTo(0)).pause();

      const trigger = ScrollTrigger.create({
        trigger: wrapper,
        start: () => `top top+=${HEADER_H}`,
        end: () => `+=${window.innerHeight * SCROLL_RUNWAY_VH}`,
        scrub: 1.2,
        onUpdate: (self) => {
          loop.time(self.progress * loop.duration());
          focusPass();
          skewTo(gsap.utils.clamp(-7, 7, self.getVelocity() / -420));
          settle.restart(true);
        },
      });

      // ---- entrance: the prints drop into the frame as the section arrives ----
      // Driven on the inner plate, never on the item itself: the focus pass
      // owns the item's transform every tick, and two writers on one transform
      // is exactly how an entrance ends up stranded half-transparent.
      const intro = gsap.from(plates.filter(Boolean) as HTMLElement[], {
        y: 90,
        autoAlpha: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: { each: 0.035, from: "center" },
        scrollTrigger: { trigger: wrapper, start: "top bottom-=120", once: true },
        // the focus pass owns y/opacity from here on; hand them over cleanly
        onComplete: focusPass,
      });

      focusPass();

      return () => {
        settle.kill();
        intro.kill();
        trigger.kill();
        loop.kill();
      };
    },
    { dependencies: [items, reduced], scope: stickyRef, revertOnUpdate: true },
  );

  const caption = captions?.[focused];

  return (
    <div className="photostrip-wrapper" ref={wrapperRef} style={{ height: `${SCROLL_RUNWAY_VH * 100}vh` }}>
      <div className="photostrip-sticky" ref={stickyRef}>
        <div className="photostrip-viewport" ref={viewportRef}>
          {/* Focus line, in the crosshair cursor's vocabulary. Deliberately two
              ticks rather than a bracketed frame: the loop runs continuously and
              never snaps a print into a box, so a frame would sit straddling two
              photos most of the time and imply a snap that isn't there. */}
          <span className="photostrip-focus" aria-hidden="true">
            <i />
            <i />
          </span>

          <div className="photostrip-track" ref={trackRef}>
            {items.map((src, i) => (
              <div className="photostrip-item" key={i}>
                <div className="photostrip-plate">
                  <img src={src} alt="" draggable={false} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="photostrip-readout">
          <span className="photostrip-counter mono-num">
            {String(focused + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </span>
          <span className="photostrip-caption">{caption ?? "nainital, uttarakhand"}</span>
          <span className="photostrip-hint">scroll to browse</span>
        </div>
      </div>
    </div>
  );
}
