import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import "./Cursor.css";

/**
 * Minimal crosshair cursor (Arch-Linux-Xcursor-style: thin, precise, no lag).
 * Interactive elements opt in with `data-cursor` (bracket/viewfinder state) and
 * an optional `data-cursor-label` (e.g. "VIEW", "OPEN") shown beside it.
 */
export default function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [label, setLabel] = useState("");

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const xTo = gsap.quickTo(root, "x", { duration: 0.12, ease: "power3.out" });
    const yTo = gsap.quickTo(root, "y", { duration: 0.12, ease: "power3.out" });

    const onMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest<HTMLElement>("[data-cursor]");
      if (target) {
        setHover(true);
        setLabel(target.dataset.cursorLabel ?? "");
      } else {
        setHover(false);
        setLabel("");
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseover", onOver);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`cursor${hover ? " is-hover" : ""}${label ? " has-label" : ""}`}
      aria-hidden="true"
    >
      <span className="cursor-tick cursor-tick--n" />
      <span className="cursor-tick cursor-tick--s" />
      <span className="cursor-tick cursor-tick--e" />
      <span className="cursor-tick cursor-tick--w" />
      <span className="cursor-dot" />
      <span className="cursor-label">{label}</span>
    </div>
  );
}
