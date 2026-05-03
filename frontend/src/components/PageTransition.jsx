import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'

/**
 * PageTransition — full-screen wipe transition between routes.
 * Uses AnimatePresence with a sliding overlay for cinematic page changes.
 */
export default function PageTransition({ children }) {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname}>
        {/* Page content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>

        {/* Slide-in overlay */}
        <motion.div
          className="fixed inset-0 z-[100] bg-gold origin-left pointer-events-none"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 0 }}
          exit={{ scaleX: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left' }}
        />

        {/* Slide-out overlay */}
        <motion.div
          className="fixed inset-0 z-[100] bg-gold pointer-events-none"
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'right' }}
        />
      </motion.div>
    </AnimatePresence>
  )
}
