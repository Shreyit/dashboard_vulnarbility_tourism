import "./Loading.css";

type LoadingProps = {
  label?: string;
};

/** Terminal-style loading indicator. Used everywhere instead of skeleton loaders.
 * The step bar lights up one hard-edged cell at a time (steps() timing, not a
 * smooth sweep) per the design system's "pixelated / stepped progress" spec. */
export default function Loading({ label = "FETCHING" }: LoadingProps) {
  return (
    <span className="loading-text" role="status" aria-live="polite">
      {label}
      <span className="loading-steps" aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    </span>
  );
}
