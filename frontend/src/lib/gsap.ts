/**
 * Single GSAP entry point for the whole app.
 *
 * Every plugin is registered exactly once, here, and every component imports
 * gsap from this module rather than from "gsap" directly -- registering a
 * plugin in more than one module is the usual way ScrollTrigger ends up
 * half-initialised in a Vite HMR session.
 *
 * All plugins ship in the public `gsap` package (free since the Webflow
 * acquisition -- no Club membership, no private registry, no auth token).
 */
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { Flip } from "gsap/Flip";
import { Observer } from "gsap/Observer";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";

gsap.registerPlugin(
  useGSAP,
  ScrollTrigger,
  ScrollToPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  SplitText,
  CustomEase,
  Flip,
  Observer,
  ScrambleTextPlugin,
);

/**
 * Named eases for the dashboard's motion language. The design system calls for
 * mechanical, decisive movement (hard-offset shadows, near-zero radii), so the
 * house curves are steep in and settle flat -- never a floaty ease-out-back on
 * interface chrome.
 */
CustomEase.create("brut", "M0,0 C0.2,0 0.1,1 1,1");
/** A slight, single overshoot -- physical objects landing, e.g. a magnet snap. */
CustomEase.create("snap", "M0,0 C0.14,0 0.2,1.12 0.5,1.04 0.72,0.98 0.78,1 1,1");
export const EASE = {
  brut: "brut",
  snap: "snap",
  out: "power3.out",
  inOut: "power2.inOut",
} as const;

gsap.defaults({ duration: 0.6, ease: EASE.out });

// ScrollTrigger fires its own resize refresh; this only guards against the
// mobile URL-bar show/hide, which changes innerHeight without a real reflow.
ScrollTrigger.config({ ignoreMobileResize: true });

export {
  gsap,
  useGSAP,
  ScrollTrigger,
  ScrollToPlugin,
  DrawSVGPlugin,
  MotionPathPlugin,
  SplitText,
  CustomEase,
  Flip,
  Observer,
  ScrambleTextPlugin,
};
export default gsap;
