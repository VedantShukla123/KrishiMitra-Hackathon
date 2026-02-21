import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { kmKey } from '../utils/storageKeys'
import './WeatherInsurance.css'

export default function WeatherInsurance() {
  const { t } = useLanguage()
  const { user, addTrustScore } = useAuth()
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState('')
  const [rainLast30DaysMm, setRainLast30DaysMm] = useState(null)
  const [thresholdMm, setThresholdMm] = useState(10)
  const [triggered, setTriggered] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let addr = ''
    let rainMm = null
    try {
      const key = user?.id ? `km_last_sensor_${user.id}` : 'km_last_sensor'
      const stored = localStorage.getItem(key)
      if (stored) {
        const j = JSON.parse(stored)
        const a = j?.address
        if (a != null) {
          addr = typeof a === 'string' ? a : (a?.place || a?.name || (typeof a === 'object' ? JSON.stringify(a) : String(a)) || '')
        }
        const r = j?.rainfallTotal ?? j?.rainfall
        if (r != null) rainMm = typeof r === 'number' ? r : parseFloat(r)
      }
    } catch {}
    if (rainMm != null && !Number.isNaN(rainMm)) {
      setLocation(addr || 'From sensor')
      setRainLast30DaysMm(Math.round(rainMm))
      const th = 10
      setThresholdMm(th)
      setTriggered(rainMm < th)
      setMessage('')
      setLoading(false)
    } else {
      setLocation(addr || '—')
      setRainLast30DaysMm(null)
      setThresholdMm(10)
      setTriggered(false)
      setMessage(t('weather.uploadSensorFirst'))
      setLoading(false)
    }
  }, [user?.id, t])

  useEffect(() => {
    if (!loading && rainLast30DaysMm != null) {
        const uid = user?.id
        const used = localStorage.getItem(kmKey('session_used_weather', uid)) === '1'
      if (!used) {
        const inRange = rainLast30DaysMm >= 25 && rainLast30DaysMm <= 75
        try {
          if (inRange) {
            addTrustScore(10)
            localStorage.setItem(kmKey('weather_awarded', uid), '1')
          }
          const droughtPenalized = localStorage.getItem(kmKey('penalty_drought_awarded', uid)) === '1'
          const floodPenalized = localStorage.getItem(kmKey('penalty_flood_awarded', uid)) === '1'
          if (rainLast30DaysMm < 10 && !droughtPenalized) {
            addTrustScore(-10)
            localStorage.setItem(kmKey('penalty_drought', uid), '-10')
            localStorage.setItem(kmKey('penalty_drought_awarded', uid), '1')
          }
          if (rainLast30DaysMm > 100 && !floodPenalized) {
            addTrustScore(-10)
            localStorage.setItem(kmKey('penalty_flood', uid), '-10')
            localStorage.setItem(kmKey('penalty_flood_awarded', uid), '1')
          }
          localStorage.setItem(kmKey('session_used_weather', uid), '1')
        } catch {}
      }
    }
  }, [loading, rainLast30DaysMm, addTrustScore])

  return (
    <div className="weather-insurance">
      <div className="wi-hero">
        <span className="wi-hero-icon">🌧️</span>
        <h1>{t('weather.title')}</h1>
        <p className="wi-hero-desc">
          {t('weather.subtitle')}
        </p>
      </div>

      <div className="wi-status-card">
        <h2>{t('weather.yourCoverage')}</h2>
        {loading ? (
          <div className="wi-loading">{t('weather.checkingData')}</div>
        ) : (
          <>
            <div className="wi-metrics">
              <div className="wi-metric">
                <span className="wi-metric-label">{t('weather.location')}</span>
                <span className="wi-metric-value">{location}</span>
              </div>
              <div className="wi-metric">
                <span className="wi-metric-label">{t('weather.rainfall30')}</span>
                <span className="wi-metric-value">
                  {rainLast30DaysMm != null ? `${rainLast30DaysMm} mm` : '—'}
                </span>
              </div>
              <div className="wi-metric">
                <span className="wi-metric-label">{t('weather.threshold')}</span>
                <span className="wi-metric-value">{thresholdMm} mm</span>
              </div>
            </div>
            <div className={`wi-badge ${triggered ? 'wi-badge-triggered' : 'wi-badge-ok'}`}>
              {triggered ? t('weather.triggered') : t('weather.monitoring')}
            </div>
            {message && <p className="wi-message">{triggered ? t('weather.messageTriggered') : message}</p>}
          </>
        )}
      </div>

      <div className="wi-how">
        <h3>{t('weather.howWorks')}</h3>
        <p>
          {t('weather.howDetail', { location, threshold: thresholdMm })}
        </p>
      </div>

      <div className="wi-why">
        <h3>{t('weather.whyWins')}</h3>
        <ul>
          <li>{t('weather.why1')}</li>
          <li>{t('weather.why2')}</li>
          <li>{t('weather.why3')}</li>
        </ul>
      </div>
    </div>
  )
}
