import { useRef } from "react";
import { gsap, useGSAP, SplitText, EASE } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./FlowingMenu.css";

export type FlowingMenuItem = {
  label: string;
  href: string;
  image: string;
  blurb: string;
};

type FlowingMenuProps = {
  items: FlowingMenuItem[];
  onNavigate?: (href: string) => void;
};

const SLAT_COUNT = 14;

/** Scoped querySelectorAll, as an array. */
const q = (root: HTMLElement, selector: string) =>
  gsap.utils.toArray<HTMLElement>(selector, root);

/**
 * Row-per-view nav for the "Five views, one dashboard" section.
 *
 * Replaces the earlier sliding-marquee treatment, which had two defects. It
 * gated hover on `e.movementX === 0 && e.movementY === 0` to filter the
 * synthetic mouseenter Chromium fires when a row scrolls under a stationary
 * cursor -- but that test also discards the first genuine enter whenever the
 * pointer arrives without an intervening move, so rows would silently refuse
 * to open. And it drove skew from raw mousemove, creating two competing
 * `skewY` tweens per event, hundreds a second, which fought each other.
 *
 * The rebuild fixes both properly:
 *  - No enter is second-guessed. The real defect was never that a row opened;
 *    it was that a row could get *stuck* open. So every hover state lives on
 *    ONE paused timeline that is played on enter and reversed on leave, and
 *    the slats are driven with `overwrite: true`. Neither can strand itself
 *    half-open the way independent enter/leave tweens could, so a row always
 *    resolves to exactly open or closed -- including when a row scrolls under
 *    a stationary cursor, which is a genuine hover and should look like one.
 *  - Pointer velocity drives the preview tilt through a single reusable
 *    `quickTo`, instead of allocating two fighting tweens per mousemove.
 *
 * The motion itself is now a louvre: vertical slats flip the row's fill in,
 * starting from the column the cursor crossed, the label rolls over
 * character by character, and a preview plate tracks the pointer with lag.
 */
export default function FlowingMenu({ items, onNavigate }: FlowingMenuProps) {
  const rootRef = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // ---- the preview plate that trails the cursor across the whole menu ----
  useGSAP(
    () => {
      const plate = previewRef.current;
      const root = rootRef.current;
      if (!plate || !root || reduced) return;

      // Same gate as the rows: a plate that trails the cursor is meaningless
      // without a cursor, and matchMedia reverts its inline styles if the
      // device stops matching.
      const mm = gsap.matchMedia();
      mm.add("(hover: hover) and (pointer: fine)", () => {
      // Resting state, so the first hover actually has something to grow from.
      gsap.set(plate, { autoAlpha: 0, scale: 0.82 });

      const xTo = gsap.quickTo(plate, "x", { duration: 0.55, ease: "power3.out" });
      const yTo = gsap.quickTo(plate, "y", { duration: 0.55, ease: "power3.out" });
      // Tilt is driven by horizontal velocity through a single reusable tween,
      // not a fresh one per event -- the old implementation's actual bug.
      const rotTo = gsap.quickTo(plate, "rotation", { duration: 0.8, ease: "power3.out" });

      let lastX = 0;
      let lastT = 0;

      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== "mouse") return;
        const rect = root.getBoundingClientRect();
        xTo(e.clientX - rect.left);
        yTo(e.clientY - rect.top);

        const now = e.timeStamp;
        const dt = now - lastT;
        if (dt > 0 && lastT !== 0) {
          const velocity = (e.clientX - lastX) / dt; // px per ms
          rotTo(gsap.utils.clamp(-9, 9, velocity * 18));
        }
        lastX = e.clientX;
        lastT = now;
      };

        root.addEventListener("pointermove", onMove, { passive: true });
        return () => root.removeEventListener("pointermove", onMove);
      });

      return () => mm.revert();
    },
    { dependencies: [reduced], scope: rootRef },
  );

  return (
    <nav className="flowing-menu" aria-label="Dashboard sections" ref={rootRef}>
      {items.map((item, i) => (
        <MenuRow
          key={item.href}
          item={item}
          index={i}
          onNavigate={onNavigate}
          previewRef={previewRef}
          reduced={reduced}
        />
      ))}

      {/* one plate, shared by every row -- the image inside it swaps on hover */}
      <div className="fm-preview" ref={previewRef} aria-hidden="true">
        <div className="fm-preview-inner">
          {items.map((item) => (
            <img src={item.image} alt="" key={item.href} data-preview={item.href} />
          ))}
        </div>
      </div>
    </nav>
  );
}

function MenuRow({
  item,
  index,
  onNavigate,
  previewRef,
  reduced,
}: {
  item: FlowingMenuItem;
  index: number;
  onNavigate?: (href: string) => void;
  previewRef: React.RefObject<HTMLDivElement | null>;
  reduced: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const hoverTl = useRef<gsap.core.Timeline | null>(null);
  const openRef = useRef(false);

  useGSAP(
    () => {
      const row = rowRef.current;
      if (!row) return;

      // Everything below only makes sense on a device that can hover. Gating it
      // with matchMedia rather than an `if` is deliberate: when the query stops
      // matching, GSAP reverts every inline style set inside it. Without that,
      // the inline `visibility: hidden` this used to leave on the blurb
      // survived onto touch devices and hid copy the CSS fallback meant to show.
      const mm = gsap.matchMedia();

      mm.add("(hover: hover) and (pointer: fine)", () => {
        if (reduced) {
          // No hover choreography; the CSS `.is-active` rules still give a flat
          // colour change, which is feedback enough.
          gsap.set(q(row, ".fm-slat"), { scaleY: 0 });
          gsap.set(q(row, ".fm-label-over"), { autoAlpha: 0 });
          return;
        }

        const base = q(row, ".fm-label-base")[0];
        const over = q(row, ".fm-label-over")[0];
        const blurb = q(row, ".fm-blurb")[0];
        const arrow = q(row, ".fm-arrow")[0];
        const idx = q(row, ".fm-index")[0];

        // Character-level split, reverted automatically when the matchMedia
        // context tears down (SplitText is context-aware).
        const splitBase = SplitText.create(base, { type: "chars" });
        const splitOver = SplitText.create(over, { type: "chars" });

        gsap.set(q(row, ".fm-slat"), { scaleY: 0, transformOrigin: "center bottom" });
        gsap.set(over, { autoAlpha: 1 });
        gsap.set(splitOver.chars, { yPercent: 105 });
        gsap.set(blurb, { x: -14 });
        gsap.set(arrow, { x: -10 });

        // ONE timeline for the whole hover state. Played forward on enter,
        // reversed on leave -- it can interrupt itself safely and always lands
        // on a defined state.
        //
        // Note what is NOT in here: every colour change is a CSS transition on
        // `.fm-row.is-active`. Colour is a state, not a motion, and leaving it
        // to CSS means a row can never be stranded mid-palette by an
        // interrupted tween.
        const tl = gsap.timeline({ paused: true, defaults: { ease: EASE.brut } });
        tl.to(splitBase.chars, { yPercent: -105, duration: 0.34, stagger: 0.016 }, 0)
          .to(splitOver.chars, { yPercent: 0, duration: 0.4, stagger: 0.016 }, 0.05)
          .to(blurb, { x: 0, duration: 0.35, ease: "power2.out" }, 0.16)
          .to(arrow, { x: 6, duration: 0.35, ease: "power3.out" }, 0.1)
          .to(
            idx,
            { scrambleText: { text: String(index + 1).padStart(2, "0"), chars: "0123456789", speed: 0.6 }, duration: 0.4 },
            0.05,
          );
        hoverTl.current = tl;

        return () => {
          hoverTl.current = null;
        };
      });

      return () => mm.revert();
    },
    { dependencies: [reduced, index], scope: rowRef, revertOnUpdate: true },
  );

  /** Vertical position of the pointer relative to this row: which way the slats open. */
  const enterEdge = (clientY: number, rect: DOMRect) =>
    clientY - rect.top < rect.height / 2 ? "top" : "bottom";

  /** Which slat column the pointer crossed, so the flip starts where the cursor is. */
  const enterColumn = (clientX: number, rect: DOMRect) =>
    gsap.utils.clamp(0, SLAT_COUNT - 1, Math.floor(((clientX - rect.left) / rect.width) * SLAT_COUNT));

  const runSlats = (open: boolean, clientX: number, clientY: number, rect: DOMRect) => {
    const row = rowRef.current;
    if (!row) return;
    const slats = gsap.utils.toArray<HTMLElement>(".fm-slat", row);
    // `overwrite: true` is what makes this safe to fire on every enter and
    // leave: the previous slat tween is killed outright, so the slats can
    // never be left part-open by an interrupted transition.
    gsap.to(slats, {
      scaleY: open ? 1 : 0,
      transformOrigin: `center ${enterEdge(clientY, rect)}`,
      duration: open ? 0.45 : 0.34,
      ease: open ? "power3.out" : "power3.in",
      overwrite: true,
      stagger: { each: 0.022, from: enterColumn(clientX, rect), grid: [1, SLAT_COUNT] },
    });
  };

  const open = (clientX: number, clientY: number) => {
    const row = rowRef.current;
    if (!row || openRef.current || reduced) return;
    const rect = row.getBoundingClientRect();
    openRef.current = true;
    row.classList.add("is-active");
    runSlats(true, clientX, clientY, rect);
    hoverTl.current?.play();

    // bring this row's plate image forward
    const plate = previewRef.current;
    if (plate) {
      const images = gsap.utils.toArray<HTMLImageElement>("img", plate);
      images.forEach((img) => {
        gsap.to(img, { autoAlpha: img.dataset.preview === item.href ? 1 : 0, duration: 0.25, overwrite: "auto" });
      });
      gsap.to(plate, { autoAlpha: 1, scale: 1, duration: 0.5, ease: "power3.out", overwrite: "auto" });
      gsap.fromTo(
        plate.querySelector(".fm-preview-inner"),
        { scale: 1.25 },
        { scale: 1, duration: 0.7, ease: "power3.out", overwrite: "auto" },
      );
    }
  };

  const close = (clientX: number, clientY: number) => {
    const row = rowRef.current;
    if (!row || !openRef.current) return;
    const rect = row.getBoundingClientRect();
    openRef.current = false;
    row.classList.remove("is-active");
    runSlats(false, clientX, clientY, rect);
    hoverTl.current?.reverse();

    const plate = previewRef.current;
    if (plate) {
      gsap.to(plate, { autoAlpha: 0, scale: 0.82, duration: 0.35, ease: "power3.in", overwrite: "auto" });
    }
  };

  // The enter event's own coordinates are the right ones to read: they are
  // where the cursor actually is, which is what decides the edge the louvre
  // opens from and the column the stagger starts at. Reading a separately
  // tracked pointer position instead is wrong -- pointerenter fires *before*
  // the pointermove at the new position, so that value is always one move stale
  // and a fast entry would be rejected as "not really over the row".
  const onPointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    open(e.clientX, e.clientY);
  };

  const onPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    close(e.clientX, e.clientY);
  };

  return (
    <div
      ref={rowRef}
      className="fm-row"
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      <span className="fm-slats" aria-hidden="true">
        {Array.from({ length: SLAT_COUNT }, (_, i) => (
          <span className="fm-slat" key={i} />
        ))}
      </span>

      <a
        href={item.href}
        className="fm-link"
        data-cursor
        data-cursor-label="VIEW"
        onFocus={() => {
          const rect = rowRef.current?.getBoundingClientRect();
          if (rect) open(rect.left + rect.width / 2, rect.top);
        }}
        onBlur={() => {
          const rect = rowRef.current?.getBoundingClientRect();
          if (rect) close(rect.left + rect.width / 2, rect.top);
        }}
        onClick={(e) => {
          if (onNavigate) {
            e.preventDefault();
            onNavigate(item.href);
          }
        }}
      >
        <span className="fm-label">
          <span className="fm-label-base">{item.label}</span>
          <span className="fm-label-over" aria-hidden="true">
            {item.label}
          </span>
        </span>

        <span className="fm-meta">
          <span className="fm-blurb">{item.blurb}</span>
          <span className="fm-index mono-num">{String(index + 1).padStart(2, "0")}</span>
          <svg className="fm-arrow" width="26" height="12" viewBox="0 0 26 12" aria-hidden="true">
            <path d="M0 6 H23" stroke="currentColor" strokeWidth="1.6" />
            <path d="M18 1 L24 6 L18 11" stroke="currentColor" strokeWidth="1.6" fill="none" />
          </svg>
        </span>
      </a>
    </div>
  );
}
