import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import UploadZone from './UploadZone'
import ResultPanel from './ResultPanel'

const STATUS_MESSAGES = [
  { text: 'Scanning GitHub repositories', icon: '◈' },
  { text: 'Analyzing job requirements', icon: '◇' },
  { text: 'Matching your projects', icon: '△' },
  { text: 'Rewriting resume sections', icon: '○' },
  { text: 'Compiling PDF', icon: '□' },
]

export default function StepPanel({ flow }) {
  const { step, setStep, resumeFile, company, setCompany, jd, setJd, result, error, setError, uploadResume, runAnalysis, reset } = flow
  const [statusIdx, setStatusIdx] = useState(0)

  useEffect(() => {
    if (step !== 3) return
    setStatusIdx(0)
    const interval = setInterval(() => setStatusIdx((p) => (p + 1) % STATUS_MESSAGES.length), 3000)
    return () => clearInterval(interval)
  }, [step])

  const handleUpload = async (file) => { try { await uploadResume(file) } catch {} }
  const pageVariants = {
    initial: { opacity: 0, y: 24, filter: 'blur(4px)' },
    animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
    exit: { opacity: 0, y: -16, filter: 'blur(4px)' },
  }
  const stepNames = ['Upload', 'Details', 'Processing', 'Results']

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full rounded-3xl glass-liquid relative"
      style={{ padding: '40px' }}>

      {/* Header */}
      <div className="text-center mb-7">
        <div className="inline-flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-gold animate-pulse-glow" />
          <span className="text-[9px] text-gold/50 font-mono uppercase tracking-[0.2em]">AI-Powered</span>
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-wide">
          <span className="bg-gradient-to-r from-gold via-amber to-gold-300 bg-clip-text text-transparent">MORPHR</span>
        </h1>
        <p className="text-text-dim text-[11px] mt-1.5 font-mono tracking-wide">Morph your resume in seconds</p>
      </div>

      {/* Step indicator */}
      {step <= 3 && (
        <div className="flex items-center gap-1 mb-7 justify-center">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[11px] font-mono font-bold transition-all duration-500
                  ${step === s ? 'bg-gold/15 text-gold border border-gold/30 glow-gold'
                    : step > s ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                    : 'bg-white/[0.03] text-text-dim/40 border border-white/5'}`}>
                  {step > s ? '✓' : s}
                </div>
                <span className={`text-[8px] font-mono uppercase tracking-wider transition-colors duration-300
                  ${step === s ? 'text-gold/70' : step > s ? 'text-green-400/50' : 'text-text-dim/30'}`}>
                  {stepNames[s - 1]}
                </span>
              </div>
              {s < 3 && <div className={`w-12 h-px mb-5 transition-all duration-500 rounded-full
                ${step > s ? 'bg-gradient-to-r from-green-500/30 to-green-500/10' : 'bg-white/5'}`} />}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="p-3.5 rounded-xl bg-red-500/[0.06] border border-red-500/15 text-red-400 text-[11px] font-mono leading-relaxed overflow-hidden">
            <div className="flex items-start gap-2">
              <span className="text-red-400/60 mt-0.5">✕</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-300/40 hover:text-red-300 bg-transparent border-none cursor-pointer text-sm">×</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="s1" variants={pageVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col gap-5">
            <div>
              <h2 className="font-heading text-xs uppercase tracking-[0.15em] text-text-dim/70 mb-1">Step 1</h2>
              <p className="text-text-primary text-sm">Upload your base LaTeX resume</p>
            </div>
            <UploadZone onUpload={handleUpload} uploadedFile={resumeFile} error={null} />
            <button id="step1-next-btn" onClick={() => setStep(2)} disabled={!resumeFile} className="btn-primary w-full">Continue</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="s2" variants={pageVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="flex flex-col gap-5">
            <div>
              <h2 className="font-heading text-xs uppercase tracking-[0.15em] text-text-dim/70 mb-1">Step 2</h2>
              <p className="text-text-primary text-sm">Enter the target job details</p>
            </div>
            <div>
              <label className="text-text-dim/70 text-[10px] font-mono uppercase tracking-wider block mb-2">Company Name</label>
              <input id="company-input" type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. Google, Meta, Stripe" className="w-full px-4 py-3.5 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-text-dim/70 text-[10px] font-mono uppercase tracking-wider block mb-2">Job Description</label>
              <textarea id="jd-input" value={jd} onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the full job description here..." rows={7}
                className="w-full px-4 py-3.5 rounded-xl text-sm resize-none leading-relaxed" />
              <div className="flex justify-between mt-1.5">
                <span className="text-text-dim/30 text-[9px] font-mono">More text = better analysis</span>
                <span className={`text-[9px] font-mono ${jd.length > 100 ? 'text-green-400/50' : 'text-text-dim/30'}`}>{jd.length.toLocaleString()} chars</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="btn-secondary flex-1">← Back</button>
              <button id="analyze-btn" onClick={runAnalysis} disabled={!jd.trim() || !company.trim()} className="btn-primary flex-1">Analyze</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="s3" variants={pageVariants} initial="initial" animate="animate" exit="exit"
            transition={{ duration: 0.35 }} className="flex flex-col items-center gap-6 py-10">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 rounded-full border-2 border-gold/10" style={{ animation: 'spin-slow 8s linear infinite' }} />
              <div className="absolute inset-2 rounded-full border border-amber/15" style={{ animation: 'spin-slow 5s linear infinite reverse' }} />
              <div className="absolute inset-4 rounded-full animate-pulse-glow"
                style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.2) 0%, rgba(245,158,11,0.08) 60%, transparent 80%)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-gold/50" />
              </div>
            </div>
            <div className="h-12 flex flex-col items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={statusIdx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="flex items-center gap-2">
                  <span className="text-gold/50 text-sm">{STATUS_MESSAGES[statusIdx].icon}</span>
                  <span className="text-text-primary text-sm font-mono">{STATUS_MESSAGES[statusIdx].text}</span>
                </motion.div>
              </AnimatePresence>
            </div>
            <p className="text-text-dim/40 text-[9px] font-mono tracking-wider uppercase">This may take 30–60 seconds</p>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div key="s4" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.35 }}>
            <ResultPanel result={result} onReset={reset} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
