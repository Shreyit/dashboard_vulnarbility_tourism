import "./Decor.css";

type PrayerFlagsProps = {
  width?: number;
  /** Total SVG height. Pennant depth is derived from it, so the string always
   *  fits its rail instead of being clipped by an `overflow: hidden` parent. */
  height?: number;
  count?: number;
  className?: string;
};

// Traditional Tibetan Lungta order: blue (sky), white (air), red (fire),
// green (water), yellow (earth). The one deliberately colorful element on an
// otherwise warm-white/grey/rust site -- explicit user request, not a palette
// break for UI chrome (workflow.md SS9.1's "no rainbow" rule governs
// interface color, not a cited cultural motif placed as a corner accent).
const FLAG_COLORS = ["#4472a8", "#f4f1ea", "#b3402a", "#3f7a4e", "#d9a531"];

/**
 * A small string of prayer flags fluttering in one corner, nodding to
 * Uttarakhand's Himalayan hill-station setting. Pure CSS keyframe animation
 * (not SMIL) so it correctly stops under the site's motion switch -- see the
 * `[data-motion="reduced"]` gate in global.css.
 */
export default function PrayerFlags({
  width = 200,
  height = 40,
  count = 7,
  className = "",
}: PrayerFlagsProps) {
  const flagW = Math.min(22, (width / count) * 0.66);
  const gap = (width - count * flagW) / (count + 1);
  // The rope sags a little; the pennants hang from wherever it happens to be.
  const ropeTop = height * 0.12;
  const ropeSag = height * 0.2;
  const pennantDepth = height - ropeTop - ropeSag - 2;

  return (
    <svg
      className={`decor-flags ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path
        d={`M0 ${ropeTop} Q ${width / 2} ${ropeTop + ropeSag * 2} ${width} ${ropeTop}`}
        stroke="var(--ink-faint)"
        strokeWidth="1.2"
        fill="none"
      />
      {Array.from({ length: count }).map((_, i) => {
        const cx = gap + i * (flagW + gap) + flagW / 2;
        // ropeY approximates the same quadratic curve as the path above, so each flag hangs from it
        const t = cx / width;
        const ropeY = ropeTop + ropeSag * 2 * t * (1 - t);
        return (
          <g
            key={i}
            className="decor-flag"
            style={{ animationDelay: `${i * 0.18}s`, transformOrigin: `${cx}px ${ropeY}px` }}
          >
            <path
              d={`M${cx - flagW / 2} ${ropeY} L${cx + flagW / 2} ${ropeY} L${cx} ${ropeY + pennantDepth} Z`}
              fill={FLAG_COLORS[i % FLAG_COLORS.length]}
              stroke="var(--ink)"
              strokeWidth="0.6"
            />
          </g>
        );
      })}
    </svg>
  );
}
