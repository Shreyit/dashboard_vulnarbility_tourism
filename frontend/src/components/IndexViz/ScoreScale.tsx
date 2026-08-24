import "./IndexViz.css";

/**
 * One-line callout explaining the shared reading rule for every coxcomb/radar
 * score on the dashboard, boxed so it reads as its own small unit rather than
 * trailing off as body text. Placed once per chart context, not once per
 * individual chart.
 */
export default function ScoreScale() {
  return (
    <div className="score-scale">
      <p>Higher score means more pressure felt by that group.</p>
    </div>
  );
}
