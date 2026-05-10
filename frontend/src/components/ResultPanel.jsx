import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Download button with icon + label ────────────────────────────────────────
function DownloadBtn({ href, label, sublabel, icon, colorClass, id }) {
  if (!href) return null;
  return (
    <a
      href={href}
      download
      id={id}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 no-underline group
        ${colorClass}`}
    >
      <span className="text-lg leading-none">{icon}</span>
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] font-mono font-bold leading-tight">{label}</span>
        <span className="text-[9px] font-mono opacity-50 leading-tight">{sublabel}</span>
      </div>
      <svg className="w-3.5 h-3.5 ml-auto opacity-40 group-hover:opacity-80 transition-opacity flex-shrink-0"
        fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  );
}

export default function ResultPanel({ result, onReset }) {
  const {
    match_score = 0,
    top_keywords = [],
    missing_keywords = [],
    matched_projects = [],
    pdf_url,
    tex_url,
    docx_url,
    preview_url,
  } = result || {};

  const [displayScore, setDisplayScore] = useState(0);
  const [showPreview, setShowPreview] = useState(true);
  const [pdfState, setPdfState] = useState("loading"); // "loading" | "ok" | "error"

  // Animated score counter
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

  useEffect(() => {
    setPdfState("loading");
  }, [preview_url]);

  const scoreColor = useMemo(() => {
    if (match_score >= 70) return { main: "#22c55e", glow: "rgba(34,197,94,0.2)" };
    if (match_score >= 40) return { main: "#FFD700", glow: "rgba(255,215,0,0.2)" };
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

  const iframeUrl = preview_url || pdf_url;
  const hasDownloads = pdf_url || docx_url || tex_url;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-5"
    >
      {/* ── Score ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-5">
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="5" />
            <circle
              cx="50" cy="50" r="45" fill="none"
              stroke={scoreColor.main} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.1s ease-out", filter: `drop-shadow(0 0 8px ${scoreColor.glow})` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-heading font-bold" style={{ color: scoreColor.main }}>{displayScore}</span>
          </div>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[9px] font-mono uppercase tracking-[0.15em] text-text-dim/50">Match Score</span>
          <span className="text-base font-heading font-semibold" style={{ color: scoreColor.main }}>{scoreLabel}</span>
          <span className="text-text-dim/40 text-[10px] font-mono">
            {top_keywords.length} keywords · {matched_projects.length} projects
          </span>
        </div>
      </div>

      {/* ── Downloads (always visible) ──────────────────────────── */}
      {hasDownloads && (
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 mb-2.5 font-mono">
            Download Resume
          </h3>
          <div className="grid grid-cols-1 gap-2">
            <DownloadBtn
              href={pdf_url}
              id="download-pdf-btn"
              label="Download PDF"
              sublabel="Best for job applications"
              icon="📄"
              colorClass="bg-red-500/[0.05] border-red-500/15 text-red-400 hover:bg-red-500/10 hover:border-red-500/30"
            />
            <DownloadBtn
              href={docx_url}
              id="download-docx-btn"
              label="Download DOCX"
              sublabel="Editable Word document"
              icon="📝"
              colorClass="bg-sky-500/[0.05] border-sky-500/15 text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30"
            />
            <DownloadBtn
              href={tex_url}
              id="download-tex-btn"
              label="Download LaTeX"
              sublabel="Source .tex file"
              icon="⟨/⟩"
              colorClass="bg-blue-500/[0.05] border-blue-500/15 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30"
            />
          </div>
        </div>
      )}

      {/* ── PDF Preview ─────────────────────────────────────────── */}
      {iframeUrl && (
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 font-mono">
                Live Preview
              </h3>
              {pdfState === "loading" && (
                <span className="text-[8px] font-mono text-gold/40 animate-pulse">rendering…</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {iframeUrl && (
                <a
                  href={iframeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[9px] text-text-dim/30 hover:text-gold/60 font-mono transition-colors"
                >
                  Open ↗
                </a>
              )}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-[9px] text-text-dim/30 hover:text-gold/60 font-mono bg-transparent border-none cursor-pointer transition-colors"
              >
                {showPreview ? "Hide ↑" : "Show ↓"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {showPreview && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-2xl overflow-hidden border border-white/[0.08] relative"
                  style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)" }}
                >
                  {/* Loading skeleton */}
                  {pdfState === "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d14] z-10 gap-3"
                         style={{ height: "520px" }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold/60"
                      />
                      <span className="text-[10px] font-mono text-text-dim/30">Rendering PDF…</span>
                    </div>
                  )}

                  {/* Error state */}
                  {pdfState === "error" && (
                    <div className="flex flex-col items-center justify-center bg-[#0d0d14] gap-4 py-14">
                      <span className="text-3xl">📄</span>
                      <div className="text-center">
                        <p className="text-text-dim/60 text-[12px] font-mono mb-1">Preview blocked by browser</p>
                        <p className="text-text-dim/30 text-[10px] font-mono">Use the buttons above to download your resume</p>
                      </div>
                      {pdf_url && (
                        <a href={iframeUrl} target="_blank" rel="noopener noreferrer"
                          className="text-[10px] font-mono text-gold/60 hover:text-gold border border-gold/20 px-4 py-2 rounded-lg transition-colors">
                          Open PDF in new tab ↗
                        </a>
                      )}
                    </div>
                  )}

                  {/* object tag — better cross-origin support than iframe for PDFs */}
                  {pdfState !== "error" && (
                    <object
                      data={iframeUrl}
                      type="application/pdf"
                      className="w-full bg-white"
                      style={{ height: "560px", display: "block" }}
                      onLoad={() => setPdfState("ok")}
                    >
                      {/* Fallback: try an embed */}
                      <embed
                        src={iframeUrl}
                        type="application/pdf"
                        className="w-full"
                        style={{ height: "560px" }}
                        onLoad={() => setPdfState("ok")}
                        onError={() => setPdfState("error")}
                      />
                    </object>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Keywords Found ──────────────────────────────────────── */}
      {top_keywords.length > 0 && (
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 mb-2 font-mono">Keywords Found</h3>
          <motion.div className="flex flex-wrap gap-1.5" variants={stagger.container} initial="initial" animate="animate">
            {top_keywords.map((kw, i) => (
              <motion.span key={i} variants={stagger.item}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-green-500/[0.06] text-green-400/80 border border-green-500/10 cursor-default">
                {kw}
              </motion.span>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── Missing Keywords ────────────────────────────────────── */}
      {missing_keywords.length > 0 && (
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 mb-2 font-mono">Missing Keywords</h3>
          <motion.div className="flex flex-wrap gap-1.5" variants={stagger.container} initial="initial" animate="animate">
            {missing_keywords.map((kw, i) => (
              <motion.span key={i} variants={stagger.item}
                className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-amber-500/[0.06] text-amber-400/80 border border-amber-500/10 cursor-default">
                {kw}
              </motion.span>
            ))}
          </motion.div>
        </div>
      )}

      {/* ── Matched Projects ────────────────────────────────────── */}
      {matched_projects.length > 0 && (
        <div>
          <h3 className="text-[9px] uppercase tracking-[0.15em] text-text-dim/50 mb-2 font-mono">Matched Projects</h3>
          <div className="flex flex-col gap-2">
            {matched_projects.slice(0, 3).map((proj, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.08 }}
                className="rounded-xl p-3 bg-white/[0.02] border border-white/[0.04] hover:border-gold/10 transition-all duration-300">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-text-primary text-[11px] font-semibold font-mono">{proj.name}</span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md"
                    style={{
                      color: proj.score >= 7 ? "#22c55e" : "#FFD700",
                      background: proj.score >= 7 ? "rgba(34,197,94,0.08)" : "rgba(255,215,0,0.08)",
                    }}>
                    {proj.score}/10
                  </span>
                </div>
                <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden mb-1.5">
                  <motion.div className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #FFD700, #F59E0B)" }}
                    initial={{ width: 0 }}
                    animate={{ width: `${(proj.score / 10) * 100}%` }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.08 }} />
                </div>
                <p className="text-text-dim/40 text-[9px] leading-relaxed font-mono">{proj.reason}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <button onClick={onReset} id="start-over-btn"
        className="text-text-dim/30 text-[10px] hover:text-gold/50 transition-colors duration-300 font-mono cursor-pointer bg-transparent border-none tracking-wider uppercase mt-1">
        ← Start Over
      </button>
    </motion.div>
  );
}
