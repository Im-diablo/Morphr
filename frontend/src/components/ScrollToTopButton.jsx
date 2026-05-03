import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * ScrollToTopButton
 * Floating button with liquid glass effect that appears on scroll
 */
export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(window.scrollY > 300);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 rounded-full
            bg-gradient-to-br from-gold/10 to-amber/5
            border border-gold/25
            backdrop-filter backdrop-blur-lg
            -webkit-backdrop-filter backdrop-blur-lg
            hover:from-gold/15 hover:to-amber/10
            hover:border-gold/40
            text-gold
            shadow-lg hover:shadow-xl
            transition-all duration-300
            cursor-pointer
            group
            hover:scale-110"
          aria-label="Scroll to top"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-y-1 transition-transform duration-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 19V5M5 12l7-7 7 7"
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
