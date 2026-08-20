import { useState } from "react";
import "./PahadiBot.css";

/**
 * Stub launcher for PahadiBot, the dashboard's AI assistant. The backend
 * chat route (workflow.md #8) isn't wired up yet, so this just states that
 * plainly instead of pretending to answer.
 */
export default function PahadiBotLauncher() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="pahadibot-launcher"
        onClick={() => setOpen((v) => !v)}
        data-cursor
        data-cursor-label={open ? "CLOSE" : "ASK"}
      >
        <span className="dot" />
        PahadiBot
      </button>

      {open && (
        <div className="pahadibot-panel">
          <header>
            <h4>PahadiBot</h4>
            <button type="button" onClick={() => setOpen(false)} data-cursor>
              close
            </button>
          </header>
          <div className="body">
            <p>
              <strong>PahadiBot</strong> will answer questions grounded in this dashboard&apos;s
              own numbers: zone scores, the vulnerability index, and the stress-test scenarios.
            </p>
            <p style={{ marginTop: "0.75rem" }}>
              Not connected yet. The chat route runs on Groq once a key is added and the backend
              is live (see workflow.md, section 8).
            </p>
            <div className="status-row">
              <span className="eyebrow">status</span>
              <span className="eyebrow" style={{ color: "var(--rust)" }}>
                not connected
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
