import { useState, useRef } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { kmKey } from '../utils/storageKeys'

const ACCEPT = '.csv,.xlsx,.json,.txt,.pdf'

export default function BankStatement() {
  const { t } = useLanguage()
  const { user, addTrustScore } = useAuth()
  const [file, setFile] = useState(null)
  const [name, setName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    setError('')
    setResult(null)
    if (!f) {
      setFile(null)
      setName('')
      return
    }
    setFile(f)
    setName(f.name)
  }

  const clearFile = () => {
    setFile(null)
    setName('')
    inputRef.current?.value && (inputRef.current.value = '')
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Please choose a file')
      return
    }
    setError('')
    setUploading(true)
    setResult(null)
    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${apiBase}/api/bank-statement`, { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      setResult(data)
      const uid = user?.id
      const used = localStorage.getItem(kmKey('session_used_bank', uid)) === '1'
      if (!used && typeof data.trustDelta === 'number') {
        addTrustScore(data.trustDelta, 'Bank statement activity')
        try {
          if (data.trustDelta > 0) localStorage.setItem(kmKey('bank_awarded', uid), '1')
          if (data.active === false) {
            addTrustScore(-15, 'Bank inactivity penalty')
            localStorage.setItem(kmKey('penalty_bank', uid), '-15')
            localStorage.setItem(kmKey('penalty_bank_awarded', uid), '1')
          }
          localStorage.setItem(kmKey('session_used_bank', uid), '1')
        } catch {}
      }
    } catch (e) {
      setError(String(e.message || e))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="sensor-page">
      <div className="sensor-card">
        <h1>{t('bank.title')}</h1>
        <p>{t('bank.subtitle')}</p>
      </div>
      <div className="sensor-card">
        <h3>{t('bank.uploadTitle')}</h3>
        {!file ? (
          <label className="ca-dropzone">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT}
              onChange={handleFileChange}
              className="ca-input"
            />
            <span className="ca-dropzone-icon">🏦</span>
            <span>{t('bank.clickOrDrag')}</span>
          </label>
        ) : (
          <div className="ca-preview-wrap">
            <div className="ca-preview" style={{ padding: 12 }}>
              <strong>{name}</strong>
            </div>
            <div className="ca-preview-actions">
              <button type="button" className="btn btn-ghost" onClick={clearFile}>
                {t('common.remove')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={uploading}
              >
                {uploading ? t('bank.analysing') : t('bank.analyse')}
              </button>
            </div>
          </div>
        )}
        {error && <div className="ca-error">{error}</div>}
      </div>

      {result && (
        <div className="sensor-card">
          <h3>{t('bank.resultTitle')}</h3>
          <p>
            {result.active ? t('bank.active') : t('bank.inactive')}
          </p>
          <div className="ca-issues">
            <div className="ca-issue-row">
              <strong>{t('bank.smallTxns')}:</strong> {result.smallTransactions}
            </div>
            <div className="ca-issue-row">
              <strong>{t('bank.totalTxns')}:</strong> {result.totalTransactions}
            </div>
            <div className="ca-issue-row">
              <strong>{t('bank.ratio')}:</strong> {result.activityRatio}
            </div>
            <div className="ca-issue-row">
              <strong>{t('bank.delta')}:</strong> {result.trustDelta}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
