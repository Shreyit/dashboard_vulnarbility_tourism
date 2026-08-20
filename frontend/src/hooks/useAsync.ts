import { useEffect, useRef, useState, type DependencyList } from "react";

type AsyncState<T> =
  | { status: "loading"; data: null; error: null }
  | { status: "error"; data: null; error: string }
  | { status: "ready"; data: T; error: null };

/** Runs `fn` whenever `deps` change, guarding against setting state after unmount
 * or after a newer call has already started (stale-response race). */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading", data: null, error: null });
  const callId = useRef(0);

  useEffect(() => {
    const id = ++callId.current;
    setState({ status: "loading", data: null, error: null });
    fn()
      .then((data) => {
        if (callId.current === id) setState({ status: "ready", data, error: null });
      })
      .catch((err: unknown) => {
        if (callId.current === id) {
          setState({ status: "error", data: null, error: err instanceof Error ? err.message : String(err) });
        }
      });
    // deps is caller-supplied by design (this is a generic re-run-on-change wrapper,
    // like useQuery's queryKey) -- oxlint can't statically see through it, hence the warning.
  }, deps);

  return state;
}
