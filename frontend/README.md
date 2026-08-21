# Frontend — Nainital Tourism Vulnerability Dashboard

React + TypeScript, built with Vite. A client-side SPA that reads the FastAPI backend and
renders the Tourism Vulnerability Index, the zone map, and the peak-season stress test.

For full setup on a fresh machine (including the backend, which this app needs), see the
[root README](../README.md#running-it-on-a-new-machine). The short version:

```bash
npm install
npm run dev      # http://localhost:5173 — needs the backend on :8010
```

| Script | Does |
|---|---|
| `npm run dev` | Vite dev server with HMR; proxies `/api/*` to `localhost:8010` |
| `npm run build` | `tsc -b` type-check, then a production build into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |
| `npm run lint` | Oxlint |

The API base is the relative path `/api` (`src/api/client.ts`), so the same build works behind
Vite's dev proxy and behind FastAPI's `StaticFiles` in production. There is no `.env` here.

## The motion switch

**Read this before adding any animation.** Every animation on the site is behind one switch:

- `src/motion/` owns it. `MotionProvider` resolves the OS `prefers-reduced-motion` setting,
  lets the header's toggle override it in either direction, persists the choice to
  `localStorage`, and mirrors the result onto `<html data-motion="full|reduced">`.
- **JS animation** reads `useReducedMotion()` (`src/hooks/`). GSAP tweens do *not* obey the CSS
  media query, so anything driving GSAP must check this and use `gsap.set` instead of
  `.to`/`.from`.
- **CSS animation** is gated by the `html[data-motion="reduced"]` block in `styles/global.css`,
  not by a bare `prefers-reduced-motion` media query — a media query cannot see the user's
  in-page override. A small script in `index.html` stamps the attribute before first paint so
  nothing flutters for a frame on load.

Reduced motion means *delivered differently*, not *withheld*: the Nainital scene renders
complete instead of stroke-by-stroke, and every number shows its real value immediately.

## Animation architecture

- **`src/lib/gsap.ts` is the only place GSAP is imported from.** It registers every plugin
  exactly once and exports the named house eases. Importing `gsap` directly elsewhere risks a
  half-initialised plugin across a Vite HMR session.
- Prefer **`useGSAP()`** (`@gsap/react`) over `useEffect`. Pass a `scope` ref so selector
  strings can't reach outside the component, and it reverts everything on unmount.
- **Hover/pointer behaviour goes inside `gsap.matchMedia("(hover: hover) and (pointer: fine)")`,**
  not inside an `if`. When the query stops matching, matchMedia reverts every inline style set
  inside it — without that, an inline `visibility: hidden` survives onto touch devices and hides
  content the CSS fallback meant to show.
- **Colour is state, motion is animation.** Hover/active colour changes are CSS transitions on
  an `.is-active` class, so an interrupted tween can never strand an element mid-palette.
- **One reversible timeline per interactive state**, played on enter and reversed on leave.
  Independent enter/leave tweens are what let an element get stuck half-open.
- **Never gate a number behind a ScrollTrigger.** Render the true value in the markup and let
  the tween count *up to* what is already correct — otherwise an unscrolled gauge sits showing
  `0`, which reads as a real measurement rather than as a placeholder.
- **One-shot guards must compare a value, not flip a boolean.** React StrictMode double-invokes
  mount effects in development, so a `hasRun` flag fires on the second pass. Compare against a
  ref seeded with the mount-time value instead (see `RouteTransition`, `ZoneMap`).
- Long scroll sections stay put with **`position: sticky`, not ScrollTrigger's `pin`** — pinning
  forces a document reflow on every scroll tick and was confirmed to resurface an unrelated
  hover bug elsewhere on the page. See the comment in `PhotoStrip.tsx`.
- Hot paths use `gsap.quickTo` / `quickSetter` and cache geometry, so a pointermove or scroll
  tick never forces a synchronous layout.

Reference docs for the plugins are vendored in [`../.agents/skills/`](../.agents/skills) and
pinned by [`../skills-lock.json`](../skills-lock.json).

## Layout

```
src/
  api/              typed client + types mirroring backend/app/schemas.py
  lib/gsap.ts       single GSAP entry point: plugin registration + house eases
  motion/           the site-wide motion switch (provider, context, hook)
  hooks/            useAsync, useReducedMotion
  styles/           tokens.css (palette, spacing, --header-h), global.css, layout.css
  pages/            Landing, Overview, ZoneMap, StressTest
  components/
    NainitalScene/  the scroll-drawn SVG panorama (art + choreography, split)
    PhotoStrip/     seamless looping gallery + GreenSock's horizontalLoop helper
    FlowingMenu/    the "five views" section nav
    Magnetic/       useMagnetic + the header's motion toggle
    Reveal/         Reveal, SplitHeading, CountUp
    IndexViz/       RadialGauge, SubIndexBar
    SiteHeader/ Cursor/ PixelTransition/ RouteTransition/ ScrollProgress/ PahadiBot/ Decor/
```

`--header-h` in `tokens.css` is the sticky header's height; sticky sections and their
ScrollTrigger start offsets both derive from it, so the header can be resized in one place.
