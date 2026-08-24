import CoxcombChart, { type CoxcombSlice } from "./CoxcombChart";
import ScoreScale from "./ScoreScale";
import "./CoxcombGrid.css";

export type CoxcombGridItem = { key: string; label: string; data: CoxcombSlice[] };

type CoxcombGridProps = {
  items: CoxcombGridItem[];
  size?: number;
};

/**
 * Small multiples: one CoxcombChart per stakeholder group, same 3 axes, laid
 * out side by side so the four groups' Economic/Environmental/Social shapes
 * can be compared at a glance -- the capstone view of the dashboard's
 * stakeholder narrative. Reuses CoxcombChart as-is, just repeated.
 */
export default function CoxcombGrid({ items, size = 240 }: CoxcombGridProps) {
  return (
    <div className="coxcomb-grid">
      {items.map((item) => (
        <div className="coxcomb-grid-cell" key={item.key}>
          <span className="coxcomb-grid-label">{item.label}</span>
          <CoxcombChart data={item.data} size={size} />
          <ScoreScale />
        </div>
      ))}
    </div>
  );
}
