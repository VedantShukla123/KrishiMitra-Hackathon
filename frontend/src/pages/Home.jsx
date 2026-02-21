import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useState } from 'react'
import { kmKey } from '../utils/storageKeys'
import './Home.css'

function getScoreGrade(score, t) {
  if (score >= 80) return { label: t('home.excellent'), color: 'var(--green-light)', emoji: '🌟' }
  if (score >= 60) return { label: t('home.good'), color: 'var(--green-accent)', emoji: '👍' }
  if (score >= 40) return { label: t('home.fair'), color: 'var(--earth-light)', emoji: '📋' }
  return { label: t('home.needsImprovement'), color: 'var(--earth)', emoji: '🌱' }
}

const PROGRESS_ITEMS = [
  { to: '/settings', key: 'profile', titleKey: 'home.progressProfile' },
  { to: '/bank-statement', key: 'bank', titleKey: 'home.progressBank' },
  { to: '/sensor-readings', key: 'sensor', titleKey: 'home.progressSensor' },
  { to: '/crop-analysis', key: 'crop', titleKey: 'home.progressCrop' },
  { to: '/financial-literacy', key: 'quiz', titleKey: 'home.progressQuiz' },
  { to: '/weather-insurance', key: 'weather', titleKey: 'home.progressWeather' },
]

const FEATURE_TILES = [
  { to: '/weather-insurance', icon: '🌧️', titleKey: 'home.weatherTitle', descKey: 'home.weatherDesc' },
  { to: '/crop-analysis', icon: '🌾', titleKey: 'home.cropTitle', descKey: 'home.cropDesc' },
  { to: '/financial-literacy', icon: '⬆️', titleKey: 'home.questsTitle', descKey: 'home.questsDesc' },
  { to: '/smart-milestones', icon: '📋', titleKey: 'home.milestonesTitle', descKey: 'home.milestonesDesc' },
  { to: '/vouchers', icon: '🎫', titleKey: 'home.vouchersTitle', descKey: 'home.vouchersDesc' },
  { to: '/sensor-readings', icon: '📡', titleKey: 'home.sensorTitle', descKey: 'home.sensorDesc' },
]

export default function Home() {
  const { user, setTrustScore } = useAuth()
  const { t } = useLanguage()
  const location = useLocation()
  const navigate = useNavigate()
  const [, forceUpdate] = useState(0)
  const score = user?.trustScore ?? 0
  const grade = getScoreGrade(score, t) // used only after evaluation
  const uid = user?.id

  const started = (() => { try { return localStorage.getItem(kmKey('started', uid)) === '1' } catch { return false } })()
  const evaluated = (() => { try { return localStorage.getItem(kmKey('evaluated', uid)) === '1' } catch { return false } })()

  const isDone = (key) => {
    try { return localStorage.getItem(kmKey(`session_used_${key}`, uid)) === '1' } catch { return false }
  }

  const handleStart = () => {
    try { localStorage.setItem(kmKey('started', uid), '1') } catch {}
    forceUpdate(n => n + 1)
  }

  const handleEvaluate = () => {
    try {
      // Only count points for tasks that are actually completed (session_used)
      let total = 0
      if (isDone('profile')) {
        total += localStorage.getItem(kmKey('profile_awarded', uid)) === '1' ? 10 : 0
      }
      if (isDone('bank')) {
        if (localStorage.getItem(kmKey('penalty_bank_awarded', uid)) === '1') total += -15
        else if (localStorage.getItem(kmKey('bank_awarded', uid)) === '1') total += 20
      }
      if (isDone('sensor')) {
        const sensor = Number(localStorage.getItem(kmKey('sensor_awarded', uid)) || 0)
        const soil = localStorage.getItem(kmKey('soil_awarded', uid)) === '1' ? 10 : 0
        const nitrogen = localStorage.getItem(kmKey('n_awarded', uid)) === '1' ? 10 : 0
        const ph = localStorage.getItem(kmKey('ph_awarded', uid)) === '1' ? 10 : 0
        const legacySensor = soil + nitrogen + ph
        total += sensor > 0 ? sensor : legacySensor
      }
      if (isDone('crop')) {
        total += Number(localStorage.getItem(kmKey('crop_awarded', uid)) || 0)
      }
      if (isDone('quiz')) {
        total += Number(localStorage.getItem(kmKey('quiz_awarded', uid)) || 0)
      }
      if (isDone('weather')) {
        if (localStorage.getItem(kmKey('penalty_drought_awarded', uid)) === '1' || localStorage.getItem(kmKey('penalty_flood_awarded', uid)) === '1') total += -10
        else if (localStorage.getItem(kmKey('weather_awarded', uid)) === '1') total += 10
      }
      total = Math.max(0, Math.min(100, total))
      setTrustScore(total)
      localStorage.setItem(kmKey('evaluated', uid), '1')
      localStorage.setItem(kmKey('eligible', uid), total >= 80 ? '1' : '0')
      forceUpdate(n => n + 1)
    } catch {}
  }

  const handleLockedClick = () => {
    navigate('/')
  }

  return (
    <div className="home">
      <div className="home-welcome">
        <h1>{t('home.hello')}, {user?.name?.split(' ')[0] || t('home.farmer')}!</h1>
        <p>{t('home.subtitle')}</p>
      </div>

      {!started ? (
        <div className="score-card score-card-start">
          <div className="score-header">
            <span className="score-emoji">🔒</span>
            <h2>{t('home.getStarted')}</h2>
          </div>
          <p className="score-desc">
            {t('home.startDesc')}
          </p>
          <button type="button" className="btn btn-primary" onClick={handleStart}>
            {t('home.startEarning')}
          </button>
        </div>
      ) : (
        <div className="score-card">
          <div className="score-header">
            <span className="score-emoji">📋</span>
            <h2>{t('home.progress')}</h2>
          </div>
          <div className="home-progress-list">
            {PROGRESS_ITEMS.map(({ to, key, titleKey }) => (
              <Link key={key} to={to} className="home-progress-item">
                <span className="home-progress-icon">{isDone(key) ? '✓' : '○'}</span>
                <span className={`home-progress-label ${isDone(key) ? 'home-progress-done' : ''}`}>{t(titleKey)}</span>
              </Link>
            ))}
          </div>
          {!evaluated ? (
            <button type="button" className="btn btn-primary" onClick={handleEvaluate} style={{ marginTop: '0.5rem' }}>
              {t('home.evaluateScore')}
            </button>
          ) : (
            <div className="home-score-result" style={{ '--score-color': grade.color }}>
              <p className="home-score-value">{score}<span className="home-score-max">/ 100</span></p>
              <p className="home-score-grade" style={{ color: grade.color }}>{grade.label}</p>
              <p className="home-score-eligible" style={{ color: score >= 80 ? 'var(--green-mid)' : 'var(--earth)' }}>
                {score >= 80 ? t('home.eligibleMsg') : t('home.ineligibleMsg')}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="home-tiles-section">
        <h3 className="home-tiles-heading">{t('home.explore')}</h3>
        <div className="home-tiles">
          {FEATURE_TILES.map(({ to, icon, titleKey, descKey }) => {
            const locked = !started && to !== '/'
            return locked ? (
              <div
                key={to}
                role="button"
                tabIndex={0}
                onClick={handleLockedClick}
                onKeyDown={(e) => e.key === 'Enter' && handleLockedClick()}
                className="home-tile home-tile-locked"
              >
                <span className="home-tile-icon">🔒</span>
                <span className="home-tile-title">{t(titleKey)}</span>
                <span className="home-tile-desc">{t('home.locked')}</span>
              </div>
            ) : (
              <Link
                key={to}
                to={to}
                className={`home-tile ${location.pathname === to ? 'home-tile-active' : ''}`}
              >
                <span className="home-tile-icon">{icon}</span>
                <span className="home-tile-title">{t(titleKey)}</span>
                <span className="home-tile-desc">{t(descKey)}</span>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="home-tips">
        <h3>{t('home.tipsTitle')}</h3>
        <ul>
          <li>{t('home.tip1')}</li>
          <li>{t('home.tip2')}</li>
          <li>{t('home.tip3')}</li>
          <li>{t('home.tip4')}</li>
        </ul>
      </div>
    </div>
  )
}
