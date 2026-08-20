import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { horizontalLoop } from "./horizontalLoop";
import "./PhotoStrip.css";

gsap.registerPlugin(ScrollTrigger);

type PhotoStripProps = {
  images: string[];
};

const REPEATS = 3; // duplicate the source photos so the loop has some length before repeating
const SCROLL_RUNWAY_VH = 3; // how many viewport-heights of scroll it takes to browse the whole strip

/**
 * A horizontal photo strip, flat 2D, seamlessly looping (GreenSock's own
 * horizontalLoop() helper -- see horizontalLoop.ts for why). The strip
 * itself is a plain `position: sticky` element inside a tall wrapper, so
 * scrolling through that wrapper's height drives the loop's playhead while
 * the strip stays put on screen -- deliberately NOT using GSAP's
 * ScrollTrigger `pin` option, which forces a document reflow on every
 * scroll tick and was confirmed (while debugging an earlier version of this
 * component) to resurface an unrelated hover bug elsewhere on the page.
 * Native `position: sticky` achieves the same "scroll a while, stay in
 * place" feel without touching any other element's layout.
 */
export default function PhotoStrip({ images }: PhotoStripProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const items = useMemo(() => Array.from({ length: images.length * REPEATS }, (_, i) => images[i % images.length]), [images]);

  useEffect(() => {
    if (!trackRef.current || !wrapperRef.current) return;
    const els = gsap.utils.toArray<HTMLElement>(trackRef.current.children);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loop = horizontalLoop(els, { paused: true, repeat: -1, paddingRight: 24 });

    const trigger = ScrollTrigger.create({
      trigger: wrapperRef.current,
      start: "top top+=72",
      end: () => `+=${window.innerHeight * SCROLL_RUNWAY_VH}`,
      scrub: 1.2,
      onUpdate: (self) => {
        if (reduceMotion) return;
        loop.time(self.progress * loop.duration());
      },
    });

    return () => {
      trigger.kill();
      loop.kill();
    };
  }, [items]);

  return (
    <div className="photostrip-wrapper" ref={wrapperRef} style={{ height: `${SCROLL_RUNWAY_VH * 100}vh` }}>
      <div className="photostrip-sticky">
        <div className="photostrip-viewport">
          <div className="photostrip-track" ref={trackRef}>
            {items.map((src, i) => (
              <div className="photostrip-item" key={i}>
                <img src={src} alt="" draggable={false} />
              </div>
            ))}
          </div>
        </div>
        <span className="photostrip-hint">scroll to browse · nainital, uttarakhand</span>
      </div>
    </div>
  );
}
