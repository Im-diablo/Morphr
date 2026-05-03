import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isLanding = location.pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const navLinks = [
    { label: "About", href: isLanding ? "#about" : "/#about" },
    { label: "Features", href: isLanding ? "#features" : "/#features" },
    { label: "Guide", href: isLanding ? "#guide" : "/#guide" },
    {
      label: "Testimonials",
      href: isLanding ? "#testimonials" : "/#testimonials",
    },
  ];

  const primaryLink = { to: "/app", label: "Launch App" };

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500
          ${scrolled ? "py-3" : "py-5"}`}
      >
        <div
          className={`mx-auto max-w-6xl w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] px-6 md:px-10 py-3 rounded-full transition-all duration-500
          ${!isLanding || scrolled ? "glass-liquid" : ""}`}
        >
          <div className="flex items-center justify-between">
            <Link to="/" className="no-underline flex items-center gap-3">
              <img src="/logo.svg" alt="Morphr" className="w-9 h-9" />
              <span className="font-heading text-sm sm:text-base font-bold tracking-wide text-gold block">
                Morphr
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={
                    isLanding
                      ? link.href
                      : { pathname: "/", hash: link.href.replace(/^\//, "") }
                  }
                  className="text-text-dim/80 hover:text-gold text-sm font-mono no-underline
                             transition-colors duration-300 tracking-wide"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                to="/settings"
                className="text-text-dim/80 hover:text-gold text-sm font-mono no-underline
                           transition-colors duration-300"
              >
                Settings
              </Link>
              <Link
                to={primaryLink.to}
                className="btn-primary !text-xs !px-6 !py-2.5 no-underline"
              >
                {primaryLink.label}
              </Link>
            </div>

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden relative w-8 h-8 flex flex-col items-center justify-center gap-1.5
                         bg-transparent border-none cursor-pointer"
            >
              <motion.span
                animate={{ rotate: menuOpen ? 45 : 0, y: menuOpen ? 5 : 0 }}
                className="w-5 h-px bg-text-primary block"
              />
              <motion.span
                animate={{ opacity: menuOpen ? 0 : 1 }}
                className="w-5 h-px bg-text-primary block"
              />
              <motion.span
                animate={{ rotate: menuOpen ? -45 : 0, y: menuOpen ? -5 : 0 }}
                className="w-5 h-px bg-text-primary block"
              />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-void/95 backdrop-blur-xl flex flex-col items-center justify-center gap-6"
          >
            {navLinks.map((link, i) => (
              <motion.div
                key={link.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <Link
                  to={
                    isLanding
                      ? link.href
                      : { pathname: "/", hash: link.href.replace(/^\//, "") }
                  }
                  onClick={() => setMenuOpen(false)}
                  className="font-heading text-3xl font-bold text-text-primary no-underline hover:text-gold transition-colors"
                >
                  {link.label}
                </Link>
              </motion.div>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center gap-4 mt-6"
            >
              <Link
                to="/settings"
                onClick={() => setMenuOpen(false)}
                className="font-heading text-xl text-text-dim/90 no-underline hover:text-gold transition-colors"
              >
                Settings
              </Link>
              <Link
                to={primaryLink.to}
                onClick={() => setMenuOpen(false)}
                className="btn-primary !text-sm !px-10 !py-3.5 no-underline mt-4"
              >
                {primaryLink.label}
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
