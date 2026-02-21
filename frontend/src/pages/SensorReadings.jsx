import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { kmKey } from '../utils/storageKeys'
import './SensorReadings.css'
export default function SensorReadings() {
  const { t } = useLanguage()
  const { user, addTrustScore } = useAuth()
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const key = user?.id ? `km_last_sensor_${user.id}` : 'km_last_sensor'
      const stored = localStorage.getItem(key)
      if (stored) setResult(JSON.parse(stored))
      else setResult(null)
    } catch {
      setResult(null)
    }
  }, [user?.id])

  const handleUpload = async () => {
    setError('')
    if (!file) {
      setError('Please choose a file')
      return
    }
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/sensor-readings`, { method: 'POST', body: form })
      const text = await res.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        if (text.trim().toLowerCase().startsWith('<!doctype') || text.trim().startsWith('<!')) {
          setError('Server returned HTML instead of JSON. Is the backend running? Restart: cd backend, activate venv, python app.py')
          return
        }
        throw new Error(text || 'Invalid response')
      }
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      setResult(data)
      try {
        const key = user?.id ? `km_last_sensor_${user.id}` : 'km_last_sensor'
        localStorage.setItem(key, JSON.stringify(data))
        const uid = user?.id
        const used = localStorage.getItem(kmKey('session_used_sensor', uid)) === '1'
        if (!used) {
          const trustScore = data?.trustScore ?? 0
          const points = Math.round(Math.min(30, Math.max(0, trustScore)))
          if (points > 0) {
            addTrustScore(points, 'Sensor readings verified')
            localStorage.setItem(kmKey('sensor_awarded', uid), String(points))
            localStorage.setItem(kmKey('session_used_sensor', uid), '1')
          }
        }
      } catch {}
    } catch (e) {
      const msg = e?.message || String(e)
      setError(msg.includes('fetch') || msg.includes('NetworkError')
        ? 'Cannot reach backend. Start it with: cd backend && python app.py'
        : msg)
    } finally {
      setUploading(false)
    }
  }

  const m = result?.metrics || null
  const score = result?.trustScore ?? (m
    ? (Number(m.ph >= 6.0 && m.ph <= 7.5) + Number(m.moisture >= 20 && m.moisture <= 60) + Number(m.nitrogen >= 240 && m.nitrogen <= 480)) * 10
    : null)
  const grade = score == null
    ? null
    : score >= 24
    ? { label: t('sensor.excellent'), color: 'var(--green-light)' }
    : score >= 18
    ? { label: t('sensor.good'), color: 'var(--green-accent)' }
    : score >= 12
    ? { label: t('sensor.fair'), color: 'var(--earth-light)' }
    : { label: t('sensor.needsImprovement'), color: 'var(--earth)' }

  return (
    <div className="sensor-readings">
      <div className="sr-hero">
        <span className="sr-hero-icon">📡</span>
        <h1>{t('sensor.title')}</h1>
        <p className="sr-hero-desc">{t('sensor.subtitle')}</p>
      </div>

      <div className="sr-overall-card">
        <h2>{t('sensor.overallTrustScore')}</h2>
        <div className="sr-overall-circle" style={{ '--score-color': grade?.color }}>
          <span className="sr-overall-value">{score ?? '—'}</span>
          <span className="sr-overall-max">/ 30</span>
        </div>
        <p className="sr-overall-grade" style={{ color: grade?.color }}>
          {grade?.label || ''}
        </p>
        {result?.address && (
          <p className="sr-overall-note">{typeof result.address === 'string' ? result.address : JSON.stringify(result.address)}</p>
        )}
        {result?.aiSummary && (
          <p className="sr-overall-note" style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>{result.aiSummary}</p>
        )}
      </div>

      <div className="sr-sensors">
        <h3>{t('sensor.sensorReadings')}</h3>
        <div className="sr-grid">
          <div className="sr-sensor-card">
            <span className="sr-sensor-icon">📄</span>
            <h4>{t('sensor.uploadTitle')}</h4>
            <p className="sr-sensor-reading">
              <input type="file" accept=".pdf,.json,.csv,.xlsx,.xlsm,.txt,application/pdf,application/json" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </p>
            <div className="sr-sensor-trust">
              <button className="btn btn-primary" disabled={uploading} onClick={handleUpload}>
                {uploading ? t('sensor.analysing') : t('sensor.submitReadings')}
              </button>
              {error && <span className="sr-trust-value" style={{ color: 'var(--earth)' }}>{error}</span>}
            </div>
          </div>
          {result?.lat != null && result?.lon != null && (
            <div className="sr-sensor-card">
              <span className="sr-sensor-icon">📍</span>
              <h4>Detected location</h4>
              <p className="sr-sensor-reading">
                {result.lat.toFixed(4)}, {result.lon.toFixed(4)}
              </p>
              <div className="sr-sensor-trust">
                <span className="sr-trust-label">Report ID</span>
                <span className="sr-trust-value">{result.reportId}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sr-how">
        <h3>{t('sensor.howItWorks')}</h3>
        <p>{t('sensor.howNote')}</p>
      </div>
    </div>
  )
}
