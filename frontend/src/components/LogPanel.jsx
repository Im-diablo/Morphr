import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function LogPanel({ logs }) {
  const bottomRef = useRef(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [logs])

  const formatTime = (date) =>
    date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

  const typePrefix = { info: '   INFO', success: '     OK', error: '  ERROR', warn: '   WARN', step: '   STEP' }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="w-full h-[calc(100vh-160px)] min-h-[400px] rounded-2xl glass-liquid flex flex-col overflow-hidden"
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
        <span className="text-[10px] text-text-dim font-mono uppercase tracking-widest ml-2">Live Log</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-glow" />
          <span className="text-[9px] text-gold/50 font-mono">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2" data-lenis-prevent="true">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div key={log.id} initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.2 }}
              className="log-entry">
              <span className="log-timestamp">{formatTime(log.timestamp)}</span>
              <span className={`log-${log.type} font-mono`}>
                <span className="opacity-50">{typePrefix[log.type] || '  INFO'}</span> {log.message}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-2 border-t border-white/[0.04]">
        <div className="flex items-center gap-2">
          <span className="text-gold text-[10px] font-mono">$</span>
          <div className="w-1.5 h-4 bg-gold/40 animate-pulse-glow" />
        </div>
      </div>
    </motion.div>
  )
}
