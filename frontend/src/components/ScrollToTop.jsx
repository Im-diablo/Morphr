import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop
 * Automatically scrolls to top when route changes
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    const scrollTarget = () => {
      if (pathname === "/" && !hash) {
        const homeSection = document.getElementById("home");
        if (homeSection) {
          homeSection.scrollIntoView({ behavior: "auto", block: "start" });
          return;
        }
      }

      if (hash) {
        const target = document.getElementById(hash.replace(/^#/, ""));
        if (target) {
          target.scrollIntoView({ behavior: "auto", block: "start" });
          return;
        }
      }

      window.scrollTo({ top: 0, behavior: "auto" });
    };

    const raf = requestAnimationFrame(scrollTarget);
    return () => cancelAnimationFrame(raf);
  }, [pathname, hash]);

  return null;
}
