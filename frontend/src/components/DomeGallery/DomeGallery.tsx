import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import "./DomeGallery.css";

type DomeGalleryProps = {
  images: string[];
  radius?: number;
};

type TileSpec = {
  theta: number;
  phi: number;
  img: string;
};

const ROWS = [-16, 10, 36]; // phi (vertical angle, degrees) -- biased upward, dome not full sphere
const COLS = 7;
const SPREAD = 120; // theta spread in degrees, per row

function buildTiles(images: string[]): TileSpec[] {
  const tiles: TileSpec[] = [];
  let i = 0;
  ROWS.forEach((phi, rowIndex) => {
    const offset = rowIndex % 2 === 0 ? 0 : SPREAD / COLS / 2;
    for (let c = 0; c < COLS; c++) {
      const theta = -SPREAD / 2 + offset + (SPREAD / (COLS - 1)) * c;
      tiles.push({ theta, phi, img: images[i % images.length] });
      i++;
    }
  });
  return tiles;
}

/**
 * Photo dome: tiles arranged on the inside of a hemisphere via 3D CSS
 * transforms. Drag horizontally/vertically to rotate; idles with a slow
 * auto-spin when untouched.
 */
export default function DomeGallery({ images, radius = 620 }: DomeGalleryProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const rot = useRef({ x: -6, y: 0 });
  const dragging = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const idleTween = useRef<gsap.core.Tween | null>(null);

  const tiles = useMemo(() => buildTiles(images), [images]);

  const apply = () => {
    if (!stageRef.current) return;
    gsap.set(stageRef.current, {
      rotateX: rot.current.x,
      rotateY: rot.current.y,
    });
  };

  const startIdle = () => {
    idleTween.current?.kill();
    const state = { y: rot.current.y };
    idleTween.current = gsap.to(state, {
      y: rot.current.y + 360,
      duration: 60,
      ease: "none",
      repeat: -1,
      onUpdate: () => {
        rot.current.y = state.y % 360;
        apply();
      },
    });
  };

  useEffect(() => {
    apply();
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      startIdle();
    }
    return () => {
      idleTween.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    last.current = { x: e.clientX, y: e.clientY };
    idleTween.current?.kill();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - last.current.x;
    const dy = e.clientY - last.current.y;
    last.current = { x: e.clientX, y: e.clientY };
    rot.current.y += dx * 0.25;
    rot.current.x = gsap.utils.clamp(-30, 20, rot.current.x - dy * 0.2);
    apply();
  };

  const onPointerUp = () => {
    dragging.current = false;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      startIdle();
    }
  };

  return (
    <div className="dome-gallery">
      <div
        ref={stageRef}
        className="dome-stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {tiles.map((t, i) => (
          <div
            key={i}
            className="dome-tile"
            style={{
              transform: `rotateY(${t.theta}deg) rotateX(${t.phi}deg) translateZ(${radius}px)`,
            }}
          >
            <div
              className="dome-tile-face"
              style={{ transform: `rotateX(${-t.phi}deg) rotateY(${-t.theta}deg)` }}
              data-cursor
              data-cursor-label="DRAG"
            >
              <img src={t.img} alt="" draggable={false} />
            </div>
          </div>
        ))}
      </div>
      <span className="dome-gallery-hint">drag to look around · nainital, uttarakhand</span>
    </div>
  );
}
