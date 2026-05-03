import React from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

export default function Footer() {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <footer ref={ref} className="border-t border-white/[0.03] bg-void">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold to-amber flex items-center justify-center">
                <span className="text-void font-heading font-black text-sm">M</span>
              </div>
              <span className="font-heading text-base font-bold text-text-primary">Morphr</span>
            </div>
            <p className="text-text-dim/40 text-sm font-mono leading-[1.8] max-w-xs">
              AI-powered resume tailoring backed by your real GitHub projects. Morph your resume to match any role.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-text-dim/30 mb-5">Navigation</h4>
            <div className="flex flex-col gap-3">
              {[{ label: 'Home', to: '/' }, { label: 'App', to: '/app' }, { label: 'Settings', to: '/settings' }].map((l) => (
                <Link key={l.to} to={l.to}
                  className="text-text-dim/50 hover:text-gold text-sm font-mono no-underline transition-colors duration-300">
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}>
            <h4 className="text-[10px] font-mono uppercase tracking-[0.25em] text-text-dim/30 mb-5">Resources</h4>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Get Gemini Key', href: 'https://aistudio.google.com' },
                { label: 'GitHub Tokens', href: 'https://github.com/settings/tokens?type=beta' },
                { label: 'LaTeX Templates', href: 'https://www.overleaf.com/latex/templates' },
              ].map((l) => (
                <a key={l.label} href={l.href} target="_blank" rel="noopener noreferrer"
                  className="text-text-dim/50 hover:text-gold text-sm font-mono no-underline transition-colors duration-300">
                  {l.label} ↗
                </a>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="hr-gold mb-8" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-dim/20 text-xs font-mono">© {new Date().getFullYear()} Morphr. Built by BlaZe.</p>
          <p className="text-text-dim/15 text-[10px] font-mono">Made with ❤ and Gemini AI</p>
        </div>
      </div>
    </footer>
  )
}
