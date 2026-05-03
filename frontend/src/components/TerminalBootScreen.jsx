import React from "react";
import { AnimatePresence, motion } from "framer-motion";

const bootLines = [
  "> initializing morphr shell...",
  "> loading terminal theme...",
  "> syncing glass interface...",
  "> boot complete",
];

export default function TerminalBootScreen({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#050505] px-4"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,215,0,0.08),_transparent_40%),linear-gradient(180deg,_rgba(255,255,255,0.02),_transparent_35%)]" />
          <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:28px_28px]" />

          <motion.div
            initial={{ y: 16, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md rounded-3xl border border-gold/15 bg-black/70 backdrop-blur-xl shadow-[0_0_80px_rgba(255,215,0,0.08)] overflow-hidden"
          >
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <span className="h-3 w-3 rounded-full bg-red-500/70" />
              <span className="h-3 w-3 rounded-full bg-amber-400/70" />
              <span className="h-3 w-3 rounded-full bg-green-400/70" />
              <span className="ml-3 text-[10px] uppercase tracking-[0.35em] text-gold/45 font-mono">
                morphr terminal
              </span>
            </div>

            <div className="px-4 py-5 sm:px-6 sm:py-6 font-mono text-sm sm:text-[15px] leading-7 text-white/90">
              <div className="mb-4 flex items-center gap-2 text-gold/70">
                <span className="text-gold">$</span>
                <span>starting session</span>
              </div>

              <div className="space-y-2">
                {bootLines.map((line, index) => (
                  <motion.div
                    key={line}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.18, duration: 0.28 }}
                    className="flex items-start gap-3"
                  >
                    <span className="text-gold/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={
                        index === bootLines.length - 1
                          ? "text-green-400"
                          : "text-white/80"
                      }
                    >
                      {line}
                    </span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6">
                <div className="h-2 overflow-hidden rounded-full bg-white/5 border border-white/10">
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    className="h-full w-1/2 bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-white/35">
                  <span className="h-2 w-2 rounded-full bg-gold animate-pulse-glow" />
                  <span>loading ui</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
