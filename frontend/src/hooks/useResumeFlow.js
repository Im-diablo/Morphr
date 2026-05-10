import { useState, useCallback, useRef } from 'react'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

/**
 * Custom hook — reads API keys from localStorage, sends as headers.
 */
export default function useResumeFlow() {
  const [step, setStep] = useState(1)
  const [resumeFile, setResumeFile] = useState(null)
  const [company, setCompany] = useState('')
  const [jd, setJd] = useState('')
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [logs, setLogs] = useState([])
  const logIdRef = useRef(0)

  const getHeaders = () => ({
    'x-gemini-key': localStorage.getItem('resumebot_gemini_key') || '',
    'x-github-token': localStorage.getItem('resumebot_github_token') || '',
    'x-github-username': localStorage.getItem('resumebot_github_username') || '',
  })

  const addLog = useCallback((message, type = 'info') => {
    const id = ++logIdRef.current
    setLogs((prev) => [...prev, { id, message, type, timestamp: new Date() }])
    return id
  }, [])

  const uploadResume = useCallback(async (file) => {
    setError(null)
    addLog(`Uploading ${file.name}...`, 'step')
    try {
      const formData = new FormData()
      formData.append('file', file)
      await axios.post(`${API_BASE_URL}/api/upload-resume`, formData, {
        headers: { 'Content-Type': 'multipart/form-data', ...getHeaders() },
      })
      setResumeFile(file)
      addLog(`${file.name} uploaded successfully`, 'success')
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || 'Upload failed'
      setError(msg)
      addLog(`Upload failed: ${msg}`, 'error')
      throw err
    }
  }, [addLog])

  const runAnalysis = useCallback(async () => {
    setError(null)
    setIsLoading(true)
    setStep(3)
    addLog(`Starting analysis for ${company}...`, 'step')
    addLog('Connecting to GitHub API...', 'info')

    const phases = [
      { msg: 'Fetching GitHub repositories & READMEs...', delay: 2000 },
      { msg: 'Analyzing job description keywords...', delay: 4000 },
      { msg: 'Scoring project relevance with Gemini...', delay: 7000 },
      { msg: 'Rewriting resume LaTeX sections...', delay: 11000 },
      { msg: 'Compiling PDF with Tectonic...', delay: 16000 },
    ]
    const timers = phases.map(({ msg, delay }) => setTimeout(() => addLog(msg, 'info'), delay))

    try {
      const response = await axios.post(`${API_BASE_URL}/api/analyze`, { jd, company }, { headers: getHeaders() })
      timers.forEach(clearTimeout)
      
      // Prepend backend URL to relative paths
      const resultData = {
        ...response.data,
        pdf_url:     response.data.pdf_url     ? `${API_BASE_URL}${response.data.pdf_url}`     : null,
        tex_url:     response.data.tex_url     ? `${API_BASE_URL}${response.data.tex_url}`     : null,
        docx_url:    response.data.docx_url    ? `${API_BASE_URL}${response.data.docx_url}`    : null,
        preview_url: response.data.preview_url ? `${API_BASE_URL}${response.data.preview_url}` : null,
      }
      
      setResult(resultData)
      addLog(`Analysis complete — Match score: ${response.data.match_score}%`, 'success')
      addLog(`Found ${response.data.top_keywords?.length || 0} keywords, ${response.data.matched_projects?.length || 0} matched projects`, 'success')
      setStep(4)
    } catch (err) {
      timers.forEach(clearTimeout)
      const msg = err.response?.data?.detail || err.message || 'Analysis failed'
      setError(msg)
      addLog(`Analysis failed: ${msg}`, 'error')
      setStep(2)
    } finally {
      setIsLoading(false)
    }
  }, [jd, company, addLog])

  const reset = useCallback(() => {
    setStep(1); setResumeFile(null); setCompany(''); setJd('')
    setResult(null); setIsLoading(false); setError(null)
    setLogs([]); logIdRef.current = 0
    addLog('Session reset — ready for new analysis', 'info')
  }, [addLog])

  return {
    step, setStep, resumeFile, company, setCompany, jd, setJd,
    result, isLoading, error, setError, logs, addLog,
    uploadResume, runAnalysis, reset,
  }
}
