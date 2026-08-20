import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import BoatIcon from "../Decor/BoatIcon";
import PrayerFlags from "../Decor/PrayerFlags";
import "./SiteHeader.css";

const NAV = [
  { to: "/", label: "home" },
  { to: "/overview", label: "overview" },
  { to: "/zones", label: "zone map" },
  { to: "/stress-test", label: "stress test" },
];

export default function SiteHeader() {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // close the mobile panel on route change, and don't let it survive a resize
  // back up to desktop width
  useEffect(() => setMobileOpen(false), [pathname]);

  return (
    <>
      <div className="header-decor-strip">
        <PrayerFlags width={150} className="header-flags" />
      </div>

      <header className="site-header">
        <div className="brand-group">
          <Link to="/" className="brand" data-cursor data-cursor-label="HOME">
            <strong>Nainital</strong>
            <span>/ tourism vulnerability</span>
          </Link>
          <BoatIcon size={30} className="header-boat" />
        </div>

        <div className="nav-group">
          <nav className="header-links">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                data-cursor
                data-cursor-label="GO"
                style={pathname === item.to ? { color: "var(--rust)" } : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

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
          <nav className="mobile-nav" aria-label="Mobile">
            {NAV.map((item, i) => (
              <Link
                key={item.to}
                to={item.to}
                className="mobile-nav-link"
                style={{ animationDelay: `${i * 0.05}s`, color: pathname === item.to ? "var(--rust)" : undefined }}
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
