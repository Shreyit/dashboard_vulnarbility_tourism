import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./styles/global.css";
import "./styles/layout.css";

import { MotionProvider } from "./motion/MotionContext";
import Cursor from "./components/Cursor/Cursor";
import SiteHeader from "./components/SiteHeader/SiteHeader";
import RouteTransition from "./components/RouteTransition/RouteTransition";
import ScrollProgress from "./components/ScrollProgress/ScrollProgress";
import PahadiBotLauncher from "./components/PahadiBot/PahadiBotLauncher";

import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import ZoneMap from "./pages/ZoneMap";
import StressTest from "./pages/StressTest";

export default function App() {
  return (
    // MotionProvider sits outside the router so the motion setting survives
    // route changes and is available to the wipe between them.
    <MotionProvider>
      <BrowserRouter>
        <Cursor />
        <ScrollProgress />
        <SiteHeader />
        <RouteTransition />

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/zones" element={<ZoneMap />} />
          <Route path="/stress-test" element={<StressTest />} />
        </Routes>

        <footer className="site-footer">
          <span>Nainital Tourism Vulnerability Dashboard · TISS Urban Immersion, 2024-28 batch</span>
          <span>Photography: Wikimedia Commons, CC BY-SA 4.0</span>
        </footer>

        <PahadiBotLauncher />
      </BrowserRouter>
    </MotionProvider>
  );
}
