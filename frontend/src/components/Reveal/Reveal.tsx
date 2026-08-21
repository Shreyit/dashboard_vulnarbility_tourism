import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP, SplitText } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./Reveal.css";

type RevealProps = {
  children: ReactNode;
  /** Stagger direct children instead of moving the block as one. */
  stagger?: boolean;
  /** Extra delay in the entrance, seconds. */
  delay?: number;
  y?: number;
  className?: string;
  as?: ElementType;
};

/**
 * Scroll entrance for a block of content. One ScrollTrigger per block, fired
 * once, `toggleActions` rather than scrub -- reading copy should not animate
 * backwards when the reader scrolls up past it.
 */
export function Reveal({
  children,
  stagger = false,
  delay = 0,
  y = 26,
  className = "",
  as: Tag = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      if (reduced) {
        gsap.set(stagger ? Array.from(el.children) : el, { autoAlpha: 1, y: 0 });
        return;
      }
      const targets = stagger ? gsap.utils.toArray<HTMLElement>(el.children) : [el];
      gsap.from(targets, {
        autoAlpha: 0,
        y,
        duration: 0.7,
        delay,
        ease: "power3.out",
        stagger: stagger ? 0.08 : 0,
        scrollTrigger: { trigger: el, start: "top bottom-=90", once: true },
      });
    },
    { dependencies: [reduced, stagger, delay, y], scope: ref, revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

type SplitHeadingProps = {
  children: string;
  as?: ElementType;
  className?: string;
  /** "lines" reads calmer for long headings; "chars" is punchier for short ones. */
  type?: "lines" | "chars";
};

/**
 * A heading that assembles itself when it scrolls into view.
 *
 * `autoSplit` + `onSplit` is what makes this safe with a fluid `clamp()` type
 * scale: when a resize re-wraps the heading, SplitText re-splits and re-runs
 * the animation from `onSplit`, and because the tween is returned it also
 * cleans up the previous one instead of leaving orphaned line wrappers behind.
 */
export function SplitHeading({ children, as: Tag = "h2", className = "", type = "lines" }: SplitHeadingProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || reduced) return;

      SplitText.create(el, {
        type: type === "lines" ? "lines" : "chars",
        mask: type === "lines" ? "lines" : undefined,
        autoSplit: true,
        linesClass: "reveal-line",
        onSplit(self) {
          const targets = type === "lines" ? self.lines : self.chars;
          return gsap.from(targets, {
            yPercent: 110,
            autoAlpha: 0,
            duration: 0.85,
            ease: "power4.out",
            stagger: type === "lines" ? 0.09 : 0.022,
            scrollTrigger: { trigger: el, start: "top bottom-=80", once: true },
          });
        },
      });
    },
    { dependencies: [reduced, type], scope: ref, revertOnUpdate: true },
  );

  return (
    <Tag ref={ref} className={`split-heading ${className}`}>
      {children}
    </Tag>
  );
}

type CountUpProps = {
  value: number;
  /** Decimal places in the readout. */
  decimals?: number;
  /** Thousands separators, e.g. 1,029. */
  group?: boolean;
  suffix?: string;
  className?: string;
};

/**
 * A statistic that counts up the first time it is scrolled into view.
 *
 * The tween drives a plain object and writes `textContent`, rather than
 * animating a React state value -- a re-render per frame for a number that
 * nothing else depends on is pure waste.
 */
export function CountUp({ value, decimals = 0, group = false, suffix = "", className = "" }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const format = (v: number) => {
        const fixed = v.toFixed(decimals);
        return (group ? Number(fixed).toLocaleString("en-IN", { minimumFractionDigits: decimals }) : fixed) + suffix;
      };

      if (reduced) {
        el.textContent = format(value);
        return;
      }

      const counter = { v: 0 };
      el.textContent = format(0);
      gsap.to(counter, {
        v: value,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: () => {
          el.textContent = format(counter.v);
        },
        scrollTrigger: { trigger: el, start: "top bottom-=60", once: true },
      });
    },
    { dependencies: [value, decimals, group, suffix, reduced], scope: ref, revertOnUpdate: true },
  );

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
