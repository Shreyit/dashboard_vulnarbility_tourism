import { useRef } from "react";
import gsap from "gsap";
import "./FlowingMenu.css";

export type FlowingMenuItem = {
  label: string;
  href: string;
  image: string;
};

type FlowingMenuProps = {
  items: FlowingMenuItem[];
  onNavigate?: (href: string) => void;
};

/**
 * Row-per-item nav. On hover, a dark marquee row slides in from whichever
 * edge (top/bottom) the cursor entered from, scrolling a repeated
 * label + Nainital thumbnail strip; it skews slightly with vertical mouse
 * velocity, which is what gives it the "flowing" liquid feel.
 */
export default function FlowingMenu({ items, onNavigate }: FlowingMenuProps) {
  return (
    <nav className="flowing-menu" aria-label="Dashboard sections">
      {items.map((item, i) => (
        <MenuRow key={item.href} item={item} index={i} onNavigate={onNavigate} />
      ))}
    </nav>
  );
}

function MenuRow({
  item,
  index,
  onNavigate,
}: {
  item: FlowingMenuItem;
  index: number;
  onNavigate?: (href: string) => void;
}) {
  const itemRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const lastY = useRef<number | null>(null);
  const tween = useRef<gsap.core.Tween | null>(null);
  const slideTween = useRef<gsap.core.Tween | null>(null);

  const edge = (e: React.MouseEvent): "top" | "bottom" => {
    const rect = itemRef.current!.getBoundingClientRect();
    return e.clientY - rect.top < rect.height / 2 ? "top" : "bottom";
  };

  const onEnter = (e: React.MouseEvent) => {
    // Chromium fires a synthetic mouseenter (movementX/Y both 0) when the layout
    // shifts a row under a stationary cursor -- scrolling, or a route change
    // right after load. That's not a real hover; ignore it so the marquee can't
    // get stuck open on a row nobody's pointer ever actually touched.
    if (e.movementX === 0 && e.movementY === 0) return;

    const from = edge(e);
    lastY.current = e.clientY;
    itemRef.current?.classList.add("is-active");
    slideTween.current?.kill();
    gsap.set(marqueeRef.current, { yPercent: from === "top" ? -101 : 101 });
    slideTween.current = gsap.to(marqueeRef.current, { yPercent: 0, duration: 0.5, ease: "power3.out" });
    tween.current?.kill();
    tween.current = gsap.to(innerRef.current, {
      xPercent: -50,
      duration: 8,
      ease: "none",
      repeat: -1,
    });
  };

  const onMove = (e: React.MouseEvent) => {
    if (lastY.current === null) return;
    const delta = e.clientY - lastY.current;
    lastY.current = e.clientY;
    const skew = gsap.utils.clamp(-8, 8, delta * 0.9);
    gsap.to(marqueeRef.current, { skewY: skew, duration: 0.2, ease: "power2.out" });
    gsap.to(marqueeRef.current, { skewY: 0, duration: 0.6, ease: "power3.out", delay: 0.05 });
  };

  const onLeave = (e: React.MouseEvent) => {
    const from = edge(e);
    itemRef.current?.classList.remove("is-active");
    tween.current?.kill();
    slideTween.current?.kill();
    slideTween.current = gsap.to(marqueeRef.current, {
      yPercent: from === "top" ? -101 : 101,
      duration: 0.45,
      ease: "power3.in",
    });
    lastY.current = null;
  };

  const chunk = (key: number) => (
    <div className="chunk" key={key}>
      <span>{item.label}</span>
      <img src={item.image} alt="" />
    </div>
  );

  return (
    <div
      ref={itemRef}
      className="flowing-menu-item"
      onMouseEnter={onEnter}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      <a
        href={item.href}
        className="flowing-menu-link"
        data-cursor
        data-cursor-label="VIEW"
        onClick={(e) => {
          if (onNavigate) {
            e.preventDefault();
            onNavigate(item.href);
          }
        }}
      >
        {item.label}
        <span className="flowing-menu-index mono-num">{String(index + 1).padStart(2, "0")}</span>
      </a>
      <div ref={marqueeRef} className="flowing-menu-marquee" aria-hidden="true">
        <div ref={innerRef} className="flowing-menu-marquee-inner">
          {[0, 1, 2, 3].map(chunk)}
        </div>
      </div>
    </div>
  );
}
