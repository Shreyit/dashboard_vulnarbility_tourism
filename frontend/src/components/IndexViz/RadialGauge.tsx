import "./IndexViz.css";

type RadialGaugeProps = {
  value: number | null; // 0-100
  label: string;
  size?: number;
};

/** Flat-color arc gauge for the TVI headline number. SVG, hard butt line-caps and a
 * single flat fill (no blur/glow) to match the brutalist "sticker" visual language --
 * see workflow.md SS9.1. */
export default function RadialGauge({ value, label, size = 220 }: RadialGaugeProps) {
  const stroke = Math.round(size * 0.09);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = value === null ? 0 : Math.max(0, Math.min(100, value)) / 100;
  const offset = c * (1 - pct);

  return (
    <div className="radial-gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        {value !== null && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--rust)"
            strokeWidth={stroke}
            strokeLinecap="butt"
            strokeDasharray={c}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <div className="radial-gauge-center">
        <span className="radial-gauge-value mono-num">{value === null ? "--" : value.toFixed(1)}</span>
        <span className="radial-gauge-label">{label}</span>
      </div>
    </div>
  );
}
