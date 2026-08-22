export type KpiRowProps = {
  tvi: number | null;
  mostStressed: { label: string; value: number } | null;
  leastStressed: { label: string; value: number } | null;
  mostVulnerableZone: { name: string; tvi: number } | null;
  seasonality: number | null;
  hostVisitorGap: number | null;
};

/**
 * The KPI strip: reuses the exact `.panel-grid`/`.stat-panel` pattern already
 * built for the landing page's methodology stats (layout.css), just with
 * computed rather than hardcoded numbers -- no new CSS needed.
 */
export default function KpiRow({
  tvi,
  mostStressed,
  leastStressed,
  mostVulnerableZone,
  seasonality,
  hostVisitorGap,
}: KpiRowProps) {
  return (
    <div className="panel-grid kpi-row">
      <div className="panel stat-panel">
        <span className="num mono-num">{tvi === null ? "--" : tvi.toFixed(1)}</span>
        <span className="label">Town-wide TVI</span>
        <p>0-100, higher = more vulnerable.</p>
      </div>
      <div className="panel stat-panel">
        <span className="num mono-num">{mostStressed ? Math.round(mostStressed.value * 100) : "--"}</span>
        <span className="label">Most-stressed pillar</span>
        <p>{mostStressed?.label ?? "No data yet"}</p>
      </div>
      <div className="panel stat-panel">
        <span className="num mono-num">{leastStressed ? Math.round(leastStressed.value * 100) : "--"}</span>
        <span className="label">Least-stressed pillar</span>
        <p>{leastStressed?.label ?? "No data yet"}</p>
      </div>
      <div className="panel stat-panel">
        <span className="num mono-num">{mostVulnerableZone ? mostVulnerableZone.tvi.toFixed(1) : "--"}</span>
        <span className="label">Most vulnerable site</span>
        <p>{mostVulnerableZone?.name ?? "No data yet"}</p>
      </div>
      <div className="panel stat-panel">
        <span className="num mono-num">{seasonality === null ? "--" : seasonality.toFixed(1)}</span>
        <span className="label">Seasonality amplification</span>
        <p>How much worse peak season gets, from respondents&apos; own answers.</p>
      </div>
      <div className="panel stat-panel">
        <span className="num mono-num">
          {hostVisitorGap === null ? "--" : `${hostVisitorGap >= 0 ? "+" : ""}${hostVisitorGap.toFixed(2)}`}
        </span>
        <span className="label">Host-visitor perception gap</span>
        <p>Tourist satisfaction minus host sentiment (Doxey&apos;s Irridex).</p>
      </div>
    </div>
  );
}
