import "./Decor.css";

type BoatIconProps = {
  size?: number;
  className?: string;
};

/**
 * A small line-art paddleboat, referencing Naini Lake's boating trade (the
 * livelihood the Enterprise/Worker surveys track). Duotone ink/rust to stay in
 * the site's palette -- decorative brand chrome, not standalone cultural
 * imagery, so it follows workflow.md SS9.1's palette rule rather than the
 * flags' explicit color exception.
 */
export default function BoatIcon({ size = 40, className = "" }: BoatIconProps) {
  return (
    <svg
      className={`decor-boat ${className}`}
      width={size}
      height={size * 0.8}
      viewBox="0 0 50 40"
      fill="none"
      aria-hidden="true"
    >
      {/* waterline */}
      <path d="M2 30 Q 12 27 25 30 T 48 30" stroke="var(--line-strong)" strokeWidth="1.5" />
      {/* hull */}
      <path
        d="M8 26 L42 26 L36 33 L14 33 Z"
        fill="var(--paper)"
        stroke="var(--ink)"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* mast */}
      <path d="M25 26 L25 6" stroke="var(--ink)" strokeWidth="1.4" />
      {/* sail */}
      <path d="M25.5 7 L38 22 L25.5 22 Z" fill="var(--rust)" stroke="var(--rust-deep)" strokeWidth="1" />
    </svg>
  );
}
