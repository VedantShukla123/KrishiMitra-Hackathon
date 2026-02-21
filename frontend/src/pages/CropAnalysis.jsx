import { useState, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { kmKey } from '../utils/storageKeys'
import './CropAnalysis.css'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/jpg'
const MAX_SIZE_MB = 10

async function analyzeCrop(file, prompt, crop) {
  const apiBase = import.meta.env.VITE_API_URL || ''
  const formData = new FormData()
  formData.append('image', file)
  if (prompt) formData.append('prompt', prompt)
  if (crop) formData.append('crop', crop)
  const res = await fetch(`${apiBase}/api/crop-analysis`, { method: 'POST', body: formData })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Analysis failed')
  return data
}

export default function CropAnalysis() {
  const { t } = useLanguage()
  const { user, addTrustScore } = useAuth()
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const [crop, setCrop] = useState('wheat')

  const handleFileChange = (e) => {
    setError('')
    setResult(null)
    const chosen = e.target.files?.[0]
    if (!chosen) {
      setFile(null)
      setPreview(null)
      return
    }
    if (!chosen.type.startsWith('image/')) {
      setError('Please upload an image (JPEG, PNG, or WebP).')
      setFile(null)
      setPreview(null)
      return
    }
    if (chosen.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_SIZE_MB} MB.`)
      setFile(null)
      setPreview(null)
      return
    }
    setFile(chosen)
    const url = URL.createObjectURL(chosen)
    setPreview(url)
  }

  const clearImage = () => {
    if (preview) URL.revokeObjectURL(preview)
    setFile(null)
    setPreview(null)
    setResult(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a crop image first.')
      return
    }
    setError('')
    setResult(null)
    setAnalyzing(true)
    try {
      const data = await analyzeCrop(file, 'Assess crop condition and identify any disease or pest.', crop)
      setResult(data)
      try {
        const uid = user?.id
        const used = localStorage.getItem(kmKey('session_used_crop', uid)) === '1'
        if (!used) {
          const qualityScore = Math.round(Math.min(10, Math.max(0, data?.qualityScore ?? 7)))
          addTrustScore(qualityScore, 'Crop quality analysis')
          localStorage.setItem(kmKey('crop_awarded', uid), String(qualityScore))
          localStorage.setItem(kmKey('session_used_crop', uid), '1')
        }
      } catch {}
    } catch (err) {
      setError(err?.message || 'Analysis failed. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="crop-analysis">
      <div className="ca-hero">
        <span className="ca-hero-icon">🌾</span>
        <h1>{t('crop.title')}</h1>
        <p className="ca-hero-desc">
          {t('crop.subtitle')}
        </p>
      </div>

      <div className="ca-upload-card">
        <h2>{t('crop.uploadTitle')}</h2>
        {!preview ? (
          <label className="ca-dropzone">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              className="ca-input"
            />
            <span className="ca-dropzone-icon">📷</span>
            <span>{t('crop.clickOrDrag')}</span>
            <span className="ca-dropzone-hint">JPEG, PNG or WebP, max {MAX_SIZE_MB} MB</span>
          </label>
        ) : (
          <div className="ca-preview-wrap">
            <img src={preview} alt="Crop" className="ca-preview" />
            <div className="ca-preview-actions">
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className="btn">
                <option value="wheat">Wheat</option>
                <option value="rice">Rice</option>
                <option value="maize">Maize</option>
              </select>
              <button type="button" className="btn btn-ghost" onClick={clearImage}>
                {t('crop.remove')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAnalyze}
                disabled={analyzing}
              >
                {analyzing ? t('crop.analysing') : t('crop.analyseQuality')}
              </button>
            </div>
          </div>
        )}
        {error && <div className="ca-error">{error}</div>}
      </div>

      {result && (
        <div className="ca-result-card">
          <h2>{t('crop.resultTitle')}</h2>
          {result.qualityScore != null && (
            <div className="ca-result-quality">
              Quality Score: <strong>{result.qualityScore}/10</strong> — {result.qualityScore <= 3 ? 'Poor' : result.qualityScore <= 6 ? 'Fair' : result.qualityScore <= 8 ? 'Good' : 'Excellent'}
            </div>
          )}
          <div className="ca-result-summary">{result.summary}</div>
          {result.confidence && (
            <span className="ca-result-confidence">Confidence: {result.confidence}</span>
          )}
          <p className="ca-result-details">{result.details}</p>
          {Array.isArray(result.issues) && result.issues.length > 0 && (
            <div className="ca-issues">
              {result.issues.map((d, i) => (
                <div key={i} className="ca-issue-row">
                  <strong>{d.name}</strong> – {d.likelihood}%
                  <div>{d.description}</div>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(result.observations) && result.observations.length > 0 && (
            <div className="ca-issues">
              {result.observations.map((o, i) => (
                <div key={i} className="ca-issue-row">
                  <strong>{o.type}</strong> – severity {o.severity}/100 ({o.confidence})
                  <div>{o.description}</div>
                </div>
              ))}
            </div>
          )}
          {Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
            <div className="ca-issues">
              {result.recommendations.map((r, i) => (
                <div key={i} className="ca-issue-row">{r}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="ca-how">
        <h3>{t('crop.howWorks')}</h3>
        <p>
          You upload a crop image. Our system sends it to an AI vision model (e.g. OpenAI Vision) with a
          prompt designed to assess crop quality, health, pests, and disease. The result is shown here.
          Your backend will handle the API call and prompt.
        </p>
      </div>
    </div>
  )
}
