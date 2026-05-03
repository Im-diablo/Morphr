import React from 'react'
import { useNavigate } from 'react-router-dom'
import Scene from '../components/Scene'
import StepPanel from '../components/StepPanel'
import LogPanel from '../components/LogPanel'
import Navbar from '../components/Navbar'
import useResumeFlow from '../hooks/useResumeFlow'

export default function AppPage() {
  const flow = useResumeFlow()
  const navigate = useNavigate()

  const geminiKey = localStorage.getItem('resumebot_gemini_key')
  const githubUsername = localStorage.getItem('resumebot_github_username')

  if (!geminiKey || !githubUsername) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center px-6">
        <Navbar />
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl glass-subtle border border-gold/10
                          flex items-center justify-center mx-auto mb-6">
            <span className="text-gold text-2xl">⚙</span>
          </div>
          <h2 className="font-heading text-xl font-bold text-text-primary mb-3">Setup Required</h2>
          <p className="text-text-dim text-sm font-mono leading-relaxed mb-6">
            You need to configure your Gemini API key and GitHub username before using Morphr.
          </p>
          <button onClick={() => navigate('/settings')} className="btn-primary">Go to Settings</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void relative">
      <Navbar />
      <Scene step={flow.step} />
      <div className="relative z-10 pt-32 pb-16 flex justify-center px-4 md:px-8 min-h-screen">
        <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6">
          <div className="flex-1 min-w-0">
            <StepPanel flow={flow} />
          </div>
          {flow.logs.length > 0 && (
            <div className="w-[380px] flex-shrink-0 hidden lg:block sticky top-32" style={{ alignSelf: 'flex-start' }}>
              <LogPanel logs={flow.logs} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
