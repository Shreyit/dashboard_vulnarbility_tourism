import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { gsap, useGSAP, ScrollTrigger, Flip } from "../../lib/gsap";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import MotionToggle from "../Magnetic/MotionToggle";
import Magnetic from "../Magnetic/Magnetic";
import BoatIcon from "../Decor/BoatIcon";
import PrayerFlags from "../Decor/PrayerFlags";
import "./SiteHeader.css";

const NAV = [
  { to: "/", label: "home" },
  { to: "/dashboard", label: "dashboard" },
];

/** Rolled through the header's centre slot, so the widest breakpoint isn't
 *  mostly empty space between the wordmark and the nav. */
const TICKER = [
  "1,029 survey responses · 5 respondent groups",
  "9 surveyed zones · 6 vulnerability pillars",
  "9 cited external benchmarks · UNWTO, Sphere, GSTC",
  "extreme weekend inflow ≈ 16.7× road capacity",
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const linksRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tickerRef = useRef<HTMLDivElement>(null);
  // The marker starts life as a child of the nav itself, so its very first
  // move has no meaningful "previous box" to fly from.
  const markerPlaced = useRef(false);
  const reduced = useReducedMotion();

  // close the mobile panel on route change, and don't let it survive a resize
  // back up to desktop width
  useEffect(() => setMobileOpen(false), [pathname]);

  // ---- the active-link marker slides between nav items ----
  // Flip is the right tool here: the marker is genuinely re-parented into
  // whichever link is active, and Flip animates from its recorded previous
  // box to its new one. That keeps the DOM honest -- the marker really does
  // belong to the active link -- while still moving smoothly.
  useGSAP(
    () => {
      const nav = linksRef.current;
      if (!nav) return;
      const marker = nav.querySelector<HTMLElement>(".nav-marker");
      const target = nav.querySelector<HTMLElement>(`[data-nav="${pathname}"]`);
      if (!marker || !target) {
        marker?.style.setProperty("opacity", "0");
        return;
      }

      const state = Flip.getState(marker);
      target.appendChild(marker);
      marker.style.opacity = "1";

      if (reduced || !markerPlaced.current) {
        markerPlaced.current = true;
        return;
      }
      Flip.from(state, { duration: 0.45, ease: "power3.inOut", absolute: true });
    },
    { dependencies: [pathname, reduced], scope: linksRef },
  );

  // ---- the header condenses once the reader leaves the top of the page ----
  useGSAP(
    () => {
      const header = headerRef.current;
      if (!header || reduced) return;

      const condense = ScrollTrigger.create({
        start: 80,
        end: "max",
        onToggle: (self) => {
          gsap.to(header, {
            paddingTop: self.isActive ? "0.55rem" : "0.9rem",
            paddingBottom: self.isActive ? "0.55rem" : "0.9rem",
            backgroundColor: self.isActive ? "var(--white)" : "var(--paper)",
            duration: 0.35,
            ease: "power2.out",
          });
          gsap.to(header.querySelector(".brand strong"), {
            fontSize: self.isActive ? "0.98rem" : "1.15rem",
            duration: 0.35,
            ease: "power2.out",
          });
          gsap.to(header.querySelector(".header-boat"), {
            scale: self.isActive ? 0.78 : 1,
            duration: 0.35,
            ease: "power2.out",
          });
        },
      });

      return () => condense.kill();
    },
    { dependencies: [reduced], scope: headerRef },
  );

  // ---- centre slot: one fact at a time, rolled vertically ----
  useGSAP(
    () => {
      const inner = tickerRef.current;
      if (!inner || reduced) return;
      // The list carries a duplicate of its first line, so the roll can run
      // past the end and be reset to zero without a visible jump back.
      const step = 100 / (TICKER.length + 1);
      const tl = gsap.timeline({ repeat: -1 });
      TICKER.forEach((_, i) => {
        tl.to(inner, { yPercent: -step * (i + 1), duration: 0.55, ease: "power3.inOut", delay: 3.4 });
      });
      tl.set(inner, { yPercent: 0 });
    },
    { dependencies: [reduced], scope: tickerRef },
  );

  // ---- mobile panel: a real timeline instead of a CSS keyframe per link ----
  useGSAP(
    () => {
      const panel = panelRef.current;
      if (!panel) return;
      const links = gsap.utils.toArray<HTMLElement>(".mobile-nav-link", panel);

      if (reduced) {
        gsap.set([panel, links], { clearProps: "all" });
        return;
      }

      gsap
        .timeline()
        .fromTo(panel, { scaleY: 0, transformOrigin: "center top" }, { scaleY: 1, duration: 0.3, ease: "power3.out" })
        .from(links, { autoAlpha: 0, x: -18, duration: 0.3, stagger: 0.05, ease: "power2.out" }, 0.12);
    },
    { dependencies: [mobileOpen, reduced], scope: panelRef },
  );

  return (
    <>
      {/* instrument rail: fixed facts on the left, the flag string on the right */}
      <div className="header-rail">
        <span className="header-rail-meta mono-num">
          <span className="header-rail-dot" aria-hidden="true" />
          29.3865°N 79.4590°E · Kumaon, Uttarakhand
        </span>
        <PrayerFlags width={132} height={34} className="header-flags" />
      </div>

      <header className="site-header" ref={headerRef}>
        <div className="brand-group">
          <BoatIcon size={30} className="header-boat" />
          <Magnetic strength={0.3} radius={70} maxOffset={10}>
            <Link to="/" className="brand" data-cursor data-cursor-label="HOME">
              <strong>Nainital</strong>
              <span className="brand-sub">tourism vulnerability index</span>
            </Link>
          </Magnetic>
        </div>

        <div className="header-ticker" aria-hidden="true">
          <div className="header-ticker-inner" ref={tickerRef}>
            {[...TICKER, TICKER[0]].map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </div>
        </div>

        <div className="nav-group">
          <nav className="header-links" ref={linksRef}>
            {/* moved into the active link by Flip, above */}
            <span className="nav-marker" aria-hidden="true" />
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                data-nav={item.to}
                className={`header-link${pathname === item.to ? " is-current" : ""}`}
                data-cursor
                data-cursor-label="GO"
                aria-current={pathname === item.to ? "page" : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <span className="nav-divider" aria-hidden="true" />

          <MotionToggle />

          <button
            type="button"
            className={`hamburger${mobileOpen ? " is-open" : ""}`}
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            data-cursor
            data-cursor-label={mobileOpen ? "CLOSE" : "MENU"}
          >
            <span />
            <span />
            <span />
          </button>
        </div>

        {mobileOpen && (
          <nav className="mobile-nav" aria-label="Mobile" ref={panelRef}>
            {NAV.map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                className="mobile-nav-link"
                style={{ color: pathname === item.to ? "var(--rust)" : undefined }}
                data-cursor
                data-cursor-label="GO"
              >
                <span className="mono-num">{String(i + 1).padStart(2, "0")}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </>
  );
}
