import { useRef } from "react";
import { gsap, useGSAP } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import "./IndexViz.css";

type RadialGaugeProps = {
  value: number | null; // 0-100
  label: string;
  size?: number;
};

const TICKS = 40;

/**
 * Flat-colour arc gauge for the TVI headline number.
 *
 * SVG, hard butt line-caps and a single flat fill (no blur, no glow) to match
 * the brutalist "sticker" visual language -- see workflow.md SS9.1.
 *
 * The dial is instrument-like rather than decorative: a ring of tick marks
 * lights up one at a time as the arc sweeps, and the mono readout counts with
 * it. All three are driven from a single tween on one plain object, so the
 * number, the arc and the ticks can never disagree about what they are showing
 * -- which is exactly what happens when each gets its own tween.
 *
 * The sweep runs on mount, not on a ScrollTrigger. The readout is a number, so
 * a gauge that had not been scrolled to yet would sit showing 0.0, which is
 * not a placeholder -- it is a wrong reading. The markup renders the true
 * value and the tween only animates up to it.
 */
export default function RadialGauge({ value, label, size = 220 }: RadialGaugeProps) {
  const stroke = Math.round(size * 0.09);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const tickOuter = size / 2 - stroke - 3;
  const tickInner = tickOuter - Math.max(4, size * 0.035);

  const rootRef = useRef<HTMLDivElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const valueTextRef = useRef<HTMLSpanElement>(null);
  const displayedRef = useRef(0);
  const reducedMotion = useReducedMotion();

  useGSAP(
    () => {
      const target = value === null ? 0 : gsap.utils.clamp(0, 100, value);
      const ticks = gsap.utils.toArray<SVGLineElement>(".gauge-tick", rootRef.current!);

      const apply = (v: number) => {
        displayedRef.current = v;
        if (arcRef.current) {
          arcRef.current.style.strokeDashoffset = String(c * (1 - v / 100));
          arcRef.current.style.opacity = value === null ? "0" : "1";
        }
        if (valueTextRef.current) {
          valueTextRef.current.textContent = value === null ? "--" : v.toFixed(1);
        }
        // ticks light up to whichever one the arc has reached
        const lit = Math.round((v / 100) * TICKS);
        for (let i = 0; i < ticks.length; i++) {
          ticks[i].setAttribute("stroke", i < lit ? "var(--rust)" : "var(--line)");
        }
      };

      if (reducedMotion) {
        apply(target);
        return;
      }

      const counter = { v: displayedRef.current };
      const tween = gsap.to(counter, {
        v: target,
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: () => apply(counter.v),
      });

      return () => tween.kill();
    },
    { dependencies: [value, c, reducedMotion], scope: rootRef, revertOnUpdate: true },
  );

  return (
    <div className="radial-gauge" style={{ width: size, height: size }} ref={rootRef}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* tick ring */}
        <g className="gauge-ticks">
          {Array.from({ length: TICKS }, (_, i) => {
            const angle = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
            const cx = size / 2;
            const cy = size / 2;
            return (
              <line
                className="gauge-tick"
                key={i}
                x1={cx + Math.cos(angle) * tickInner}
                y1={cy + Math.sin(angle) * tickInner}
                x2={cx + Math.cos(angle) * tickOuter}
                y2={cy + Math.sin(angle) * tickOuter}
                stroke="var(--line)"
                strokeWidth={1.4}
              />
            );
          })}
        </g>

        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth={stroke} />
        <circle
          ref={arcRef}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--rust)"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={c}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ opacity: 0 }}
        />
      </svg>
      <div className="radial-gauge-center">
        <span ref={valueTextRef} className="radial-gauge-value mono-num">
          {value === null ? "--" : value.toFixed(1)}
        </span>
        <span className="radial-gauge-label">{label}</span>
      </div>
    </div>
  );
}
