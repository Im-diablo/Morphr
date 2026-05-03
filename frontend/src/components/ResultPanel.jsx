import React, { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import LiquidGlass from "./LiquidGlass";

export default function ResultPanel({ result, onReset }) {
  const {
    match_score = 0,
    top_keywords = [],
    missing_keywords = [],
    matched_projects = [],
    pdf_url,
    tex_url,
  } = result || {};
  const [displayScore, setDisplayScore] = useState(0);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    let frame;
    const duration = 1800;
    const start = performance.now();
    const animate = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setDisplayScore(Math.round((1 - Math.pow(1 - p, 4)) * match_score));
      if (p < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [match_score]);

  const scoreColor = useMemo(() => {
    if (match_score >= 70)
      return { main: "#22c55e", glow: "rgba(34,197,94,0.2)" };
    if (match_score >= 40)
      return { main: "#FFD700", glow: "rgba(255,215,0,0.2)" };
    return { main: "#ef4444", glow: "rgba(239,68,68,0.2)" };
  }, [match_score]);

  const scoreLabel = useMemo(() => {
    if (match_score >= 80) return "Excellent";
    if (match_score >= 60) return "Good";
    if (match_score >= 40) return "Fair";
    return "Low";
  }, [match_score]);

  const circ = 2 * Math.PI * 45;
  const offset = circ - (displayScore / 100) * circ;
  const stagger = {
    container: { transition: { staggerChildren: 0.06 } },
    item: { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } },
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      {/* ── Score ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="5"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={scoreColor.main}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 0.1s ease-out",
                filter: `drop-shadow(0 0 8px ${scoreColor.glow})`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-2xl font-heading font-bold"
              style={{ color: scoreColor.main }}
            >
              {displayScore}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-text-dim/50">
            Match Score
          </span>
          <span
            className="text-base font-heading font-semibold"
            style={{ color: scoreColor.main }}
          >
            {scoreLabel}
          </span>
          <span className="text-text-dim/40 text-[10px] font-mono">
            {top_keywords.length} keywords · {matched_projects.length} projects
          </span>
        </div>
      </div>

      {/* ── PDF Preview ────────────────────────────────────────── */}
      {pdf_url && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 font-mono">
              Resume Preview
            </h3>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="text-[9px] text-gold/40 hover:text-gold/70 font-mono bg-transparent border-none cursor-pointer transition-colors"
            >
              {showPreview ? "Hide" : "Show"}
            </button>
          </div>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.4 }}
              className="rounded-xl overflow-hidden border border-white/[0.06] glass-liquid"
            >
              <iframe
                src={pdf_url}
                title="Resume PDF Preview"
                className="w-full bg-white"
                style={{ height: "400px", border: "none" }}
              />
            </motion.div>
          )}
        </div>
      )}

      {/* ── Keywords ───────────────────────────────────────────── */}
      {top_keywords.length > 0 && (
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 mb-2 font-mono">
            Keywords Found
          </h3>
          <motion.div
            className="flex flex-wrap gap-1.5"
            variants={stagger.container}
            initial="initial"
            animate="animate"
          >
            {top_keywords.map((kw, i) => (
              <motion.span
                key={i}
                variants={stagger.item}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-green-500/[0.06] text-green-400/80 border border-green-500/10 cursor-default"
              >
                {kw}
              </motion.span>
            ))}
          </motion.div>
        </div>
      )}

      {missing_keywords.length > 0 && (
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 mb-2 font-mono">
            Missing Keywords
          </h3>
          <motion.div
            className="flex flex-wrap gap-1.5"
            variants={stagger.container}
            initial="initial"
            animate="animate"
          >
            {missing_keywords.map((kw, i) => (
              <motion.span
                key={i}
                variants={stagger.item}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-amber-500/[0.06] text-amber-400/80 border border-amber-500/10 cursor-default"
              >
                {kw}
              </motion.span>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── Projects ───────────────────────────────────────────── */}
      {matched_projects.length > 0 && (
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 mb-2 font-mono">
            Matched Projects
          </h3>
          <div className="flex flex-col gap-2">
            {matched_projects.slice(0, 3).map((proj, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04] hover:border-gold/10 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-text-primary text-[11px] font-semibold font-mono">
                    {proj.name}
                  </span>
                  <span
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md"
                    style={{
                      color: proj.score >= 7 ? "#22c55e" : "#FFD700",
                      background:
                        proj.score >= 7
                          ? "rgba(34,197,94,0.08)"
                          : "rgba(255,215,0,0.08)",
                    }}
                  >
                    {proj.score}/10
                  </span>
                </div>
                <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden mb-1.5">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, #FFD700, #F59E0B)",
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(proj.score / 10) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }}
                  />
                </div>
                <p className="text-text-dim/40 text-[9px] leading-relaxed font-mono">
                  {proj.reason}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Downloads ──────────────────────────────────────────── */}
      <div className="flex gap-3 mt-1">
        {pdf_url && (
          <a
            href={pdf_url}
            download
            id="download-pdf-btn"
            className="btn-primary flex-1 text-center no-underline inline-block"
          >
            Download PDF
          </a>
        )}
        {tex_url && (
          <a
            href={tex_url}
            download
            id="download-tex-btn"
            className="btn-secondary flex-1 text-center no-underline inline-block"
          >
            Download .tex
          </a>
        )}
      </div>

      <button
        onClick={onReset}
        id="start-over-btn"
        className="text-text-dim/30 text-[10px] hover:text-gold/50 transition-colors duration-300 font-mono cursor-pointer bg-transparent border-none tracking-wider uppercase"
      >
        ← Start Over
      </button>
    </motion.div>
  );
}
