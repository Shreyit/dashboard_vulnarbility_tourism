type ErrorPanelProps = {
  message: string;
};

/** Flat error state -- no red/green semantic colors (palette stays warm white / grey /
 * terracotta only, workflow.md SS9.1), the rust accent + explicit copy carries it instead. */
export default function ErrorPanel({ message }: ErrorPanelProps) {
  return (
    <div className="panel" style={{ padding: "var(--sp-4)" }}>
      <span className="eyebrow" style={{ color: "var(--rust)" }}>
        request failed
      </span>
      <p style={{ marginTop: "var(--sp-2)", color: "var(--ink-soft)" }}>{message}</p>
      <p style={{ marginTop: "var(--sp-2)", fontSize: "0.85rem", color: "var(--ink-faint)" }}>
        Is the backend running? <code>cd backend &amp;&amp; uvicorn app.main:app --port 8010</code>
      </p>
    </div>
  );
}
