import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Navbar from '../components/Navbar'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function SettingsPage() {
  const [geminiKey, setGeminiKey] = useState('')
  const [githubUsername, setGithubUsername] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [saved, setSaved] = useState(false)
  const [health, setHealth] = useState(null)

  useEffect(() => {
    setGeminiKey(localStorage.getItem('resumebot_gemini_key') || '')
    setGithubUsername(localStorage.getItem('resumebot_github_username') || '')
    setGithubToken(localStorage.getItem('resumebot_github_token') || '')
  }, [])

  const save = () => {
    localStorage.setItem('resumebot_gemini_key', geminiKey.trim())
    localStorage.setItem('resumebot_github_username', githubUsername.trim())
    localStorage.setItem('resumebot_github_token', githubToken.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const clear = () => {
    localStorage.removeItem('resumebot_gemini_key')
    localStorage.removeItem('resumebot_github_username')
    localStorage.removeItem('resumebot_github_token')
    setGeminiKey(''); setGithubUsername(''); setGithubToken('')
    setSaved(false); setHealth(null)
  }

  const testConnection = async () => {
    setHealth('testing')
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout
      
      const res = await fetch(`${API_BASE_URL}/api/health`, {
        headers: {
          'x-gemini-key': geminiKey,
          'x-github-token': githubToken,
          'x-github-username': githubUsername,
        },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const data = await res.json()
      setHealth(data)
    } catch (err) {
      console.error('Health check error:', err)
      setHealth({ status: 'error', github: false, gemini: false })
    }
  }

  return (
    <div className="min-h-screen bg-void">
      <Navbar />
      <div className="max-w-xl mx-auto px-6 pt-32 pb-20">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>

          <span className="text-xs font-mono uppercase tracking-[0.3em] text-gold/30 block mb-3">Configuration</span>
          <h1 className="font-heading text-4xl font-black text-text-primary mb-4">Settings</h1>
          <p className="text-text-dim text-sm font-mono leading-relaxed mb-10">
            Enter your API keys below. They are stored only in your browser's local storage
            and sent directly to the APIs — never stored on any server.
          </p>

          <div className="flex flex-col gap-6">
            {/* Gemini Key */}
            <div className="p-6 rounded-2xl glass-liquid">
              <label className="text-text-dim/60 text-[10px] font-mono uppercase tracking-[0.2em] block mb-3">
                Gemini API Key <span className="text-gold">*</span>
              </label>
              <input type="password" value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)}
                placeholder="AIza..." className="w-full px-4 py-3.5 rounded-xl text-sm" />
              <p className="text-text-dim/30 text-[10px] font-mono mt-2">
                Free at <a href="https://aistudio.google.com" target="_blank" rel="noopener noreferrer"
                  className="text-gold/50 hover:text-gold no-underline transition-colors">aistudio.google.com</a>
              </p>
            </div>

            {/* GitHub Username */}
            <div className="p-6 rounded-2xl glass-liquid">
              <label className="text-text-dim/60 text-[10px] font-mono uppercase tracking-[0.2em] block mb-3">
                GitHub Username <span className="text-gold">*</span>
              </label>
              <input type="text" value={githubUsername} onChange={(e) => setGithubUsername(e.target.value)}
                placeholder="your-username" className="w-full px-4 py-3.5 rounded-xl text-sm" />
            </div>

            {/* GitHub Token */}
            <div className="p-6 rounded-2xl glass-liquid">
              <label className="text-text-dim/60 text-[10px] font-mono uppercase tracking-[0.2em] block mb-3">
                GitHub Token <span className="text-text-dim/30">(optional)</span>
              </label>
              <input type="password" value={githubToken} onChange={(e) => setGithubToken(e.target.value)}
                placeholder="ghp_..." className="w-full px-4 py-3.5 rounded-xl text-sm" />
              <p className="text-text-dim/30 text-[10px] font-mono mt-2">
                Increases API rate limit from 60 to 5,000 requests/hour. Create a fine-grained token with
                read-only public repo access.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button onClick={save} disabled={!geminiKey.trim() || !githubUsername.trim()}
                className="btn-primary flex-1">
                {saved ? '✓ Saved' : 'Save Settings'}
              </button>
              <button onClick={testConnection} disabled={!geminiKey.trim()}
                className="btn-secondary flex-1">Test Connection</button>
            </div>

            {/* Health */}
            {health && health !== 'testing' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="p-5 rounded-xl glass-subtle">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${health.gemini ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-xs font-mono text-text-dim/60">
                      Gemini: {health.gemini ? 'Connected' : 'Failed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${health.github ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-xs font-mono text-text-dim/60">
                      GitHub: {health.github ? 'Connected' : 'Failed'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {health === 'testing' && (
              <div className="p-4 rounded-xl glass-subtle text-center">
                <span className="text-xs font-mono text-gold/40">Testing connection...</span>
              </div>
            )}

            <button onClick={clear}
              className="text-text-dim/20 text-[10px] hover:text-red-400/50 transition-colors duration-300
                         font-mono bg-transparent border-none cursor-pointer tracking-wider uppercase text-center">
              Clear All Settings
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
