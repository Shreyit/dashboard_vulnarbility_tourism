import type { ReactNode } from "react";
import { useMagnetic, type MagneticOptions } from "./useMagnetic";
import "./Magnetic.css";

type MagneticProps = MagneticOptions & {
  children: ReactNode;
  className?: string;
};

/**
 * Wraps any button or link in the pointer-attraction behaviour. The wrapper
 * carries the magnetic transform and the child keeps its own hover styling,
 * so the two never fight over the same `transform`.
 */
export default function Magnetic({ children, className = "", ...options }: MagneticProps) {
  const { ref, innerRef } = useMagnetic<HTMLSpanElement>(options);

  return (
    <span className={`magnetic ${className}`} ref={ref}>
      <span className="magnetic-inner" ref={innerRef as React.RefObject<HTMLSpanElement>}>
        {children}
      </span>
    </span>
  );
}
