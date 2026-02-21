import { useState, useMemo, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { kmKey } from '../utils/storageKeys'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import './SmartMilestones.css'

const MOISTURE_THRESHOLD = 40

// Period lengths (days) – backend can override
const SOWING_DAYS = 60
const GROWTH_DAYS = 120

const PERIODS = {
  sowing: 'Sowing',
  growth: 'Growth',
  harvest: 'Harvest',
}

// Mock: backend will return stage status, current period, and accept moisture / crop-photo
const STAGES = [
  {
    id: 1,
    title: 'Seeds & Fertilizer',
    subtitle: 'Unlocked on day 1',
    icon: '🌱',
    period: 'sowing',
    unlockCondition: 'Available from day 1',
    periodNote: 'Only during sowing. No harvest or pesticide money yet.',
  },
  {
    id: 2,
    title: 'Labor / Weeding / Pesticides',
    subtitle: 'Unlock with soil moisture',
    icon: '💧',
    period: 'growth',
    unlockCondition: 'Submit soil moisture reading above 40%',
    periodNote: 'Only after sowing. Crops need time to grow before this stage.',
  },
  {
    id: 3,
    title: 'Harvest / Transport',
    subtitle: 'Unlock with crop verification',
    icon: '🚜',
    period: 'harvest',
    unlockCondition: 'Crop photo AI confirms growth',
    periodNote: 'Only when it’s harvest time. Not available during sowing or growth.',
  },
]

function getCurrentPeriod(loanStartDate) {
  const start = new Date(loanStartDate)
  const today = new Date()
  const daysSinceStart = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  if (daysSinceStart < SOWING_DAYS) return 'sowing'
  if (daysSinceStart < SOWING_DAYS + GROWTH_DAYS) return 'growth'
  return 'harvest'
}

export default function SmartMilestones() {
  const { t } = useLanguage()
  const { user } = useAuth()
  const uid = user?.id
  const evaluated = (() => { try { return localStorage.getItem(kmKey('evaluated', uid)) === '1' } catch { return false } })()
  const score = user?.trustScore ?? 0
  const eligible = score >= 80
  const [loanStartDate, setLoanStartDate] = useState(() => {
    try {
      const saved = localStorage.getItem(kmKey('loan_start', uid))
      if (saved) return saved
    } catch {}
    const d = new Date()
    d.setDate(d.getDate() - 45)
    return d.toISOString().slice(0, 10)
  })
  const [stage2Active, setStage2Active] = useState(() => {
    try { return localStorage.getItem(kmKey('stage2_active', uid)) === '1' } catch { return false }
  })
  const [stage3Active, setStage3Active] = useState(() => {
    try { return localStorage.getItem(kmKey('stage3_active', uid)) === '1' } catch { return false }
  })
  const [moisture, setMoisture] = useState('')
  const [moistureError, setMoistureError] = useState('')
  const [stage3Submitting, setStage3Submitting] = useState(false)

  const currentPeriod = useMemo(() => getCurrentPeriod(loanStartDate), [loanStartDate])

  useEffect(() => {
    try { localStorage.setItem(kmKey('loan_start', uid), loanStartDate) } catch {}
  }, [loanStartDate, uid])

  useEffect(() => {
    try {
      if (currentPeriod === 'sowing') {
        localStorage.setItem(kmKey('stage1_active', uid), '1')
      }
    } catch {}
  }, [currentPeriod, uid])

  const handleMoistureSubmit = (e) => {
    e.preventDefault()
    setMoistureError('')
    const value = Number(moisture)
    if (Number.isNaN(value) || value < 0 || value > 100) {
      setMoistureError(t('milestones.moistureInvalid'))
      return
    }
    if (value > MOISTURE_THRESHOLD) {
      setStage2Active(true)
      setMoistureError('')
      try { localStorage.setItem(kmKey('stage2_active', uid), '1') } catch {}
    } else {
      setMoistureError(t('milestones.moistureTooLow', { threshold: MOISTURE_THRESHOLD }))
    }
  }

  const handleCropPhotoVerify = async () => {
    setStage3Submitting(true)
    await new Promise((r) => setTimeout(r, 1000))
    setStage3Active(true)
    setStage3Submitting(false)
    try { localStorage.setItem(kmKey('stage3_active', uid), '1') } catch {}
  }

  const isTimeLocked = (stagePeriod) => currentPeriod !== stagePeriod

  const getStageStatus = (stage) => {
    const timeLocked = isTimeLocked(stage.period)
    if (stage.id === 1) {
      if (timeLocked && currentPeriod !== 'sowing') return 'completed'
      return currentPeriod === 'sowing' ? 'active' : 'locked'
    }
    if (stage.id === 2) {
      if (timeLocked && currentPeriod === 'harvest') return 'completed'
      if (timeLocked) return 'locked'
      return stage2Active ? 'active' : 'locked'
    }
    if (stage.id === 3) {
      if (timeLocked) return 'locked'
      return stage3Active ? 'active' : 'locked'
    }
    return 'locked'
  }

  const getTimeLockMessage = (stage) => {
    if (!isTimeLocked(stage.period)) return null
    const periodName = PERIODS[stage.period]
    const currentName = PERIODS[currentPeriod]
    if (currentPeriod === 'sowing' && stage.period !== 'sowing') {
      return `Locked during ${currentName}. Available in ${periodName} period—you can’t access harvest or pesticide money while sowing.`
    }
    if (currentPeriod === 'growth' && stage.period === 'harvest') {
      return `Locked during ${currentName}. Harvest/transport funds open in ${periodName} period.`
    }
    if (currentPeriod === 'growth' && stage.period === 'sowing') {
      return `Sowing period over. This stage is completed.`
    }
    if (currentPeriod === 'harvest' && stage.period !== 'harvest') {
      return `Past period. This stage is completed.`
    }
    return `Available only in ${periodName} period. You’re currently in ${currentName}.`
  }

  const unlockedCount = STAGES.filter((s) => {
    const status = getStageStatus(s)
    return status === 'active' || status === 'completed'
  }).length

  if (!evaluated) {
    return (
      <div className="smart-milestones">
        <div className="sm-hero">
          <span className="sm-hero-icon">📋</span>
          <h1>{t('milestones.title')}</h1>
          <p className="sm-hero-desc">{t('milestones.subtitle')}</p>
        </div>
        <div className="sm-period-card">
          <h3>{t('milestones.lockedUntilEvaluation')}</h3>
          <p>{t('milestones.unlockEvalHint')}</p>
        </div>
      </div>
    )
  }

  if (!eligible) {
    return (
      <div className="smart-milestones">
        <div className="sm-hero">
          <span className="sm-hero-icon">📋</span>
          <h1>{t('milestones.title')}</h1>
          <p className="sm-hero-desc">{t('milestones.subtitle')}</p>
        </div>
        <div className="sm-period-card">
          <h3>{t('milestones.lockedUntil80')}</h3>
          <p>{t('milestones.unlockHint', { score })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="smart-milestones">
      <div className="sm-hero">
        <span className="sm-hero-icon">📋</span>
        <h1>{t('milestones.title')}</h1>
        <p className="sm-hero-desc">
          {t('milestones.subtitle')}
        </p>
      </div>

      <div className="sm-period-card">
        <h3>{t('milestones.currentPeriod')}</h3>
        <p className="sm-period-value">
          {t('milestones.youAreIn')} <strong>{PERIODS[currentPeriod]}</strong>
        </p>
        <p className="sm-period-desc">
          {t('milestones.periodDesc')}
        </p>
        <label className="sm-period-date">
          {t('milestones.loanStartDate')}
          <input
            type="date"
            value={loanStartDate}
            onChange={(e) => setLoanStartDate(e.target.value)}
          />
        </label>
      </div>

      <div className="sm-progress-wrap">
        <div className="sm-progress-bar">
          <div
            className="sm-progress-fill"
            style={{
              width: `${(unlockedCount / 3) * 100}%`,
            }}
          />
        </div>
        <p className="sm-progress-label">
          {t('milestones.stagesUnlocked', { count: unlockedCount })}
        </p>
      </div>

      <div className="sm-stages">
        {STAGES.map((stage) => {
          const status = getStageStatus(stage)
          const timeLocked = isTimeLocked(stage.period)
          return (
            <div
              key={stage.id}
              className={`sm-stage-card sm-stage-${status}`}
            >
              <div className="sm-stage-head">
                <span className="sm-stage-icon">{stage.icon}</span>
                <div>
                  <h2>{t('milestones.stageLabel')} {stage.id}: {t(`milestones.${stage.period === 'sowing' ? 'seeds' : stage.period === 'growth' ? 'labor' : 'harvest'}`)}</h2>
                  <p className="sm-stage-sub">{stage.subtitle}</p>
                </div>
                <span className={`sm-stage-badge sm-badge-${status}`}>
                  {status === 'active' ? t('milestones.active') : status === 'completed' ? t('milestones.completed') : t('milestones.locked')}
                </span>
              </div>
              <p className="sm-stage-condition">{stage.unlockCondition}</p>
              <p className="sm-stage-period-note">{t('milestones.availableInPeriod', { period: PERIODS[stage.period] })}</p>
              

              {stage.id === 1 && !timeLocked && (
                <p className="sm-stage-note">{t('milestones.stage1Note')}</p>
              )}

              {stage.id === 2 && !timeLocked && (
                <form onSubmit={handleMoistureSubmit} className="sm-moisture-form">
                  {stage2Active ? (
                    <p className="sm-stage-unlocked">{t('milestones.stageUnlocked')}</p>
                  ) : (
                    <>
                      <label>
                        {t('milestones.soilMoisture')}
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={moisture}
                          onChange={(e) => setMoisture(e.target.value)}
                          placeholder="e.g. 45"
                        />
                      </label>
                      {moistureError && <p className="sm-error">{moistureError}</p>}
                      <button type="submit" className="btn btn-primary">
                        {t('milestones.submitReading')}
                      </button>
                    </>
                  )}
                </form>
              )}

              {stage.id === 3 && !timeLocked && (
                <div className="sm-crop-verify">
                  {stage3Active ? (
                    <p className="sm-stage-unlocked">{t('milestones.cropGrowthConfirmed')}</p>
                  ) : (
                    <>
                      <p className="sm-stage-note">
                        {t('milestones.cropPhotoVerify')} <Link to="/crop-analysis">{t('nav.cropAnalysis')}</Link> {t('milestones.orSubmitBelow')}
                      </p>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleCropPhotoVerify}
                        disabled={!stage2Active || stage3Submitting}
                      >
                        {stage3Submitting ? t('milestones.verifying') : t('milestones.submitCropPhoto')}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="sm-why">
        <h3>{t('milestones.whyTimeLock')}</h3>
        <p>
          During sowing, the farmer can’t access money for harvesting or for pesticides—crops need
          time to grow. When it’s growth period, only labor/weeding/pesticide stage unlocks (with
          moisture). Harvest/transport money unlocks only when it’s harvest time and crop photo is
          confirmed. This reduces default risk and keeps spending aligned with the real farm
          lifecycle. Your backend can enforce the same periods (e.g. if moisture &gt; 40% and
          period is Growth, set loan_stage_2 = &quot;Active&quot;; stage_3 only in Harvest).
        </p>
      </div>
    </div>
  )
}
