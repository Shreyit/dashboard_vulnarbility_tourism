import "./Decor.css";

type PrayerFlagsProps = {
  width?: number;
  className?: string;
};

// Traditional Tibetan Lungta order: blue (sky), white (air), red (fire),
// green (water), yellow (earth). The one deliberately colorful element on an
// otherwise warm-white/grey/rust site -- explicit user request, not a palette
// break for UI chrome (workflow.md SS9.1's "no rainbow" rule governs
// interface color, not a cited cultural motif placed as a corner accent).
const FLAG_COLORS = ["#4472a8", "#f4f1ea", "#b3402a", "#3f7a4e", "#d9a531"];
const FLAG_COUNT = 7;

/**
 * A small string of prayer flags fluttering in one corner, nodding to
 * Uttarakhand's Himalayan hill-station setting. Pure CSS keyframe animation
 * (not SMIL) so it correctly stops under prefers-reduced-motion (global.css).
 */
export default function PrayerFlags({ width = 200, className = "" }: PrayerFlagsProps) {
  const height = 56;
  const flagW = 22;
  const gap = (width - FLAG_COUNT * flagW) / (FLAG_COUNT + 1);

  return (
    <svg
      className={`decor-flags ${className}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <path
        d={`M0 6 Q ${width / 2} 18 ${width} 6`}
        stroke="var(--ink-faint)"
        strokeWidth="1.5"
        fill="none"
      />
      {Array.from({ length: FLAG_COUNT }).map((_, i) => {
        const cx = gap + i * (flagW + gap) + flagW / 2;
        // ropeY approximates the same quadratic curve as the path above, so each flag hangs from it
        const t = cx / width;
        const ropeY = 6 + (18 - 6) * 4 * t * (1 - t);
        return (
          <g
            key={i}
            className="decor-flag"
            style={{ animationDelay: `${i * 0.18}s`, transformOrigin: `${cx}px ${ropeY}px` }}
          >
            <path
              d={`M${cx - flagW / 2} ${ropeY} L${cx + flagW / 2} ${ropeY} L${cx} ${ropeY + 26} Z`}
              fill={FLAG_COLORS[i % FLAG_COLORS.length]}
              stroke="var(--ink)"
              strokeWidth="0.75"
            />
          </g>
        );
      })}
    </svg>
  );
}
