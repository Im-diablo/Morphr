import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatCountdown(seconds) {
  if (seconds <= 0) return "Expired";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function urgencyClass(seconds) {
  if (seconds <= 0)   return "text-red-400/60 bg-red-500/5 border-red-500/10";
  if (seconds < 1800) return "text-red-400 bg-red-500/10 border-red-500/20";   // < 30 min
  if (seconds < 3600) return "text-amber-400 bg-amber-500/10 border-amber-500/20"; // < 1 h
  return "text-green-400 bg-green-500/[0.07] border-green-500/15";
}

function DownloadLink({ href, label, colorClass }) {
  if (!href) return null;
  const fullHref = href.startsWith("http") ? href : `${API_BASE_URL}${href}`;
  return (
    <a
      href={fullHref}
      download
      className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all duration-200 no-underline ${colorClass}`}
    >
      {label}
    </a>
  );
}

// ── History card ──────────────────────────────────────────────────────────────
function HistoryCard({ entry, onExpired }) {
  const [seconds, setSeconds] = useState(entry.seconds_remaining ?? 0);

  // Live countdown
  useEffect(() => {
    if (seconds <= 0) { onExpired?.(); return; }
    const id = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) { clearInterval(id); onExpired?.(); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const scoreColor =
    entry.match_score >= 70 ? "#22c55e" :
    entry.match_score >= 40 ? "#FFD700" : "#ef4444";

  const circ = 2 * Math.PI * 16;
  const dashOffset = circ - (entry.match_score / 100) * circ;

  const createdAt = new Date(entry.date);
  const timeStr = createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = createdAt.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: seconds <= 0 ? 0.3 : 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-300 overflow-hidden"
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Row 1: score + company + TTL badge */}
        <div className="flex items-center gap-3">
          {/* Mini score ring */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke={scoreColor} strokeWidth="3" strokeLinecap="round"
                strokeDasharray={circ} strokeDashoffset={dashOffset}
                style={{ filter: `drop-shadow(0 0 4px ${scoreColor}55)` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-bold font-mono" style={{ color: scoreColor }}>
                {entry.match_score}
              </span>
            </div>
          </div>

          {/* Company + date */}
          <div className="flex-1 min-w-0">
            {/* Job ID badge + company name on same line */}
            <div className="flex items-center gap-1.5 min-w-0">
              {entry.job_id && (
                <span className="text-[8px] font-mono text-gold/40 bg-gold/[0.04] border border-gold/10 px-1.5 py-0.5 rounded flex-shrink-0">
                  #{entry.job_id}
                </span>
              )}
              <p className="text-text-primary text-[12px] font-semibold font-mono truncate">
                {entry.company}
              </p>
            </div>
            <p className="text-text-dim/40 text-[9px] font-mono mt-0.5">
              {dateStr} at {timeStr}
            </p>
          </div>

          {/* TTL countdown badge */}
          <span className={`text-[9px] font-mono px-2 py-1 rounded-lg border flex-shrink-0 tabular-nums ${urgencyClass(seconds)}`}>
            ⏱ {formatCountdown(seconds)}
          </span>
        </div>

        {/* Row 2: keyword chips */}
        {entry.top_keywords?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {entry.top_keywords.slice(0, 6).map((kw, i) => (
              <span key={i}
                className="text-[8px] font-mono px-2 py-0.5 rounded-md bg-gold/[0.04] text-gold/50 border border-gold/10">
                {kw}
              </span>
            ))}
            {entry.top_keywords.length > 6 && (
              <span className="text-[8px] font-mono text-text-dim/30">
                +{entry.top_keywords.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Row 3: download links */}
        <div className="flex items-center gap-2 flex-wrap">
          <DownloadLink
            href={entry.pdf_url}
            label="↓ PDF"
            colorClass="text-red-400/70 bg-red-500/[0.04] border-red-500/15 hover:bg-red-500/10 hover:text-red-400"
          />
          <DownloadLink
            href={entry.docx_url}
            label="↓ DOCX"
            colorClass="text-sky-400/70 bg-sky-500/[0.04] border-sky-500/15 hover:bg-sky-500/10 hover:text-sky-400"
          />
          <DownloadLink
            href={entry.tex_url}
            label="↓ LaTeX"
            colorClass="text-blue-400/70 bg-blue-500/[0.04] border-blue-500/15 hover:bg-blue-500/10 hover:text-blue-400"
          />
          <span className="ml-auto text-[8px] font-mono text-text-dim/20">
            TTL {entry.ttl_hours}h
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────
export default function HistoryPanel() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const getHeaders = () => ({
    "x-gemini-key":       localStorage.getItem("resumebot_gemini_key") || "",
    "x-github-token":     localStorage.getItem("resumebot_github_token") || "",
    "x-github-username":  localStorage.getItem("resumebot_github_username") || "",
  });

  const fetchHistory = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/history`, { headers: getHeaders() });
      setHistory(data);
      setError(null);
    } catch (e) {
      setError("Could not load history");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + refresh every 60 s
  useEffect(() => {
    fetchHistory();
    const id = setInterval(fetchHistory, 60_000);
    return () => clearInterval(id);
  }, [fetchHistory]);

  // Remove a card from local state when its countdown hits zero
  const handleExpired = useCallback((slug) => {
    setHistory((prev) => prev.filter((e) => e.slug !== slug));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="w-full rounded-3xl glass-liquid flex flex-col overflow-hidden"
      style={{ padding: "28px 24px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse-glow" />
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-text-dim/60">
            History
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-text-dim/30">auto-deletes after 3h</span>
          <button
            onClick={fetchHistory}
            className="text-[9px] font-mono text-gold/40 hover:text-gold/70 bg-transparent border-none cursor-pointer transition-colors"
            title="Refresh history"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}
           data-lenis-prevent="true">
        {loading && (
          <div className="flex items-center justify-center py-16 gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 rounded-full border-2 border-gold/20 border-t-gold/60"
            />
            <span className="text-[10px] font-mono text-text-dim/30">Loading…</span>
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-12">
            <p className="text-red-400/60 text-[11px] font-mono">{error}</p>
            <button onClick={fetchHistory}
              className="mt-3 text-[9px] font-mono text-gold/40 hover:text-gold bg-transparent border-none cursor-pointer">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/[0.04] border border-gold/10 flex items-center justify-center">
              <span className="text-lg">📋</span>
            </div>
            <p className="text-text-dim/40 text-[11px] font-mono text-center leading-relaxed">
              No recent analyses.<br />
              <span className="text-text-dim/25">Results appear here for 3 hours.</span>
            </p>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {history.map((entry) => (
            <HistoryCard
              key={entry.slug}
              entry={entry}
              onExpired={() => handleExpired(entry.slug)}
            />
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
