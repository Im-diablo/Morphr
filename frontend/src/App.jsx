import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import SmoothScroll from "./components/SmoothScroll";
import GrainOverlay from "./components/GrainOverlay";
import LiquidGlassFilter from "./components/LiquidGlassFilter";
import ScrollToTop from "./components/ScrollToTop";
import ScrollToTopButton from "./components/ScrollToTopButton";
import TerminalBootScreen from "./components/TerminalBootScreen";
import LandingPage from "./pages/LandingPage";
import AppPage from "./pages/AppPage";
import SettingsPage from "./pages/SettingsPage";

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<AppPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  const [bootVisible, setBootVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => setBootVisible(false), 1400);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <SmoothScroll>
        <GrainOverlay />
        <LiquidGlassFilter />
        <ScrollToTopButton />
        <TerminalBootScreen visible={bootVisible} />
        <AnimatedRoutes />
      </SmoothScroll>
    </BrowserRouter>
  );
}
