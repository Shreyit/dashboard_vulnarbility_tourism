type LoadingProps = {
  label?: string;
};

/** Terminal-style loading indicator. Used everywhere instead of skeleton loaders. */
export default function Loading({ label = "FETCHING" }: LoadingProps) {
  return (
    <span className="loading-text" role="status" aria-live="polite">
      {label}
      <i />
      <i />
      <i />
    </span>
  );
}
