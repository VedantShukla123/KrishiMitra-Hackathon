import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { kmKey } from '../utils/storageKeys'
import { useLanguage } from '../context/LanguageContext'
import Quiz from '../components/Quiz'
import './FinancialLiteracy.css'

const VIDEO_URLS = {
  en: 'https://www.youtube.com/embed/ttWoN-2RlZo',
  hi: 'https://www.youtube.com/embed/ttWoN-2RlZo',
}

const QUEST_INTEREST_RATES = {
  id: 'interest-rates',
  title: 'EMI Basics',
  points: 20,
  questions_en: [
    {
      question: 'EMI stands for:',
      options: [
        'Equal Money Investment',
        'Equated Monthly Installment',
        'Estimated Monthly Interest',
      ],
      correctIndex: 1,
    },
    {
      question: 'EMI depends primarily on:',
      options: [
        'Account balance and bank branch',
        'Principal, interest rate, and tenure',
        'Only processing fees',
      ],
      correctIndex: 1,
    },
    {
      question: 'If interest rate decreases (principal and tenure same), EMI will:',
      options: [
        'Decrease',
        'Increase',
        'Stay exactly the same',
      ],
      correctIndex: 0,
    },
    {
      question: 'Prepaying principal generally:',
      options: [
        'Increases total interest payable',
        'Reduces total interest and may reduce EMI or tenure',
        'Has no effect on the loan',
      ],
      correctIndex: 1,
    },
  ],
  questions_hi: [
    {
      question: 'EMI का पूरा रूप क्या है?',
      options: [
        'Equal Money Investment',
        'Equated Monthly Installment',
        'Estimated Monthly Interest',
      ],
      correctIndex: 1,
    },
    {
      question: 'EMI मुख्य रूप से किन बातों पर निर्भर करती है?',
      options: [
        'खाते का बैलेंस और बैंक शाखा',
        'मूलधन, ब्याज दर और अवधि',
        'सिर्फ प्रोसेसिंग फीस',
      ],
      correctIndex: 1,
    },
    {
      question: 'ब्याज दर कम होने पर (मूलधन और अवधि समान), EMI:',
      options: [
        'कम होगी',
        'बढ़ेगी',
        'समान रहेगी',
      ],
      correctIndex: 0,
    },
    {
      question: 'मूलधन का प्री-पेमेंट सामान्यतः:',
      options: [
        'कुल ब्याज बढ़ाता है',
        'कुल ब्याज कम करता है और EMI/अवधि घटा सकता है',
        'ऋण पर कोई प्रभाव नहीं डालता',
      ],
      correctIndex: 1,
    },
  ],
}

export default function FinancialLiteracy() {
  const { user, addTrustScore } = useAuth()
  const uid = user?.id
  const { t } = useLanguage()
  const { language } = useLanguage()
  const [questComplete, setQuestComplete] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(0)
  const [videoWatched, setVideoWatched] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)

  const videoUrl = useMemo(() => {
    return VIDEO_URLS[language] || VIDEO_URLS.en
  }, [language])

  const questions = useMemo(() => {
    return language === 'hi' ? QUEST_INTEREST_RATES.questions_hi : QUEST_INTEREST_RATES.questions_en
  }, [language])

  const handleQuestComplete = (score, total) => {
    const used = localStorage.getItem(kmKey('session_used_quiz', uid)) === '1'
    if (!used && score > 0 && total > 0) {
      const pointsPerCorrect = QUEST_INTEREST_RATES.points / total
      const points = Math.round(score * pointsPerCorrect)
      addTrustScore(points, 'Financial quest completed')
      setQuestComplete(true)
      setEarnedPoints(points)
      try {
        const prev = Number(localStorage.getItem(kmKey('quiz_awarded', uid)) || 0)
        const best = Math.max(prev, points)
        localStorage.setItem(kmKey('quiz_awarded', uid), String(best))
        localStorage.setItem(kmKey('session_used_quiz', uid), '1')
      } catch {}
    } else if (score > 0) {
      setQuestComplete(true)
      setEarnedPoints(Number(localStorage.getItem(kmKey('quiz_awarded', uid)) || 0))
    }
  }

  return (
    <div className="financial-literacy">
      <div className="fl-hero">
        <span className="fl-hero-icon">⬆️</span>
        <h1>{t('financial.title')}</h1>
        <p className="fl-hero-desc">
          {t('financial.subtitle')}
        </p>
      </div>

      <div className="fl-quest-card">
        <div className="fl-quest-header">
          <span className="fl-quest-badge">{t('financial.quest1')}</span>
          <h2>{t('financial.howInterest')}</h2>
          <p>{t('financial.watchAndQuiz')}</p>
          <p className="fl-quest-reward">+{QUEST_INTEREST_RATES.points} Trust Score</p>
        </div>

        <div className="fl-video-section">
          <h3>{t('financial.step1')}</h3>
          <div className="fl-video-wrap">
            <iframe
              src={videoUrl}
              title="How Interest Rates Work"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setVideoWatched(true)}
            />
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setVideoCompleted(true)}
              disabled={!videoWatched}
            >
              {t('financial.startQuiz')}
            </button>
          </div>
        </div>

        <div className="fl-quiz-section">
          <h3>{t('financial.step2')}</h3>
          {questComplete ? (
            <div className="fl-quest-done">
              <span className="fl-quest-done-icon">✅</span>
              <p>{t('financial.earned')} <strong>+{earnedPoints} Trust Score!</strong></p>
              <p className="fl-quest-done-sub">{t('financial.newScore')} <strong>{user?.trustScore ?? 0}/100</strong></p>
              <Link to="/" className="btn btn-primary">{t('financial.backToHome')}</Link>
            </div>
          ) : videoCompleted ? (
            <Quiz
              questions={questions}
              onComplete={handleQuestComplete}
            />
          ) : (
            <p style={{ color: 'var(--text-muted)' }}>
              {t('financial.watchAndQuiz')}
            </p>
          )}
        </div>
      </div>

      <div className="fl-why">
        <h3>{t('financial.whyMatters')}</h3>
        <p>{t('financial.whyMattersDetail')}</p>
      </div>
    </div>
  )
}
