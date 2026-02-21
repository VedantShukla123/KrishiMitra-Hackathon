import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import './Quiz.css'

/**
 * Reusable quiz component.
 * questions: Array<{ question: string, options: string[], correctIndex: number }>
 * onComplete: (score: number, total: number) => void - score = correct count, total = questions length
 */
export default function Quiz({ questions, onComplete }) {
  const { t } = useLanguage()
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [finalScore, setFinalScore] = useState(0)
  const [correctAnswers, setCorrectAnswers] = useState([])

  const q = questions[current]
  const isLast = current === questions.length - 1

  const handleNext = () => {
    if (selected === null) return
    const correct = selected === q.correctIndex
    const newCorrect = [...correctAnswers, correct]
    setCorrectAnswers(newCorrect)
    if (isLast) {
      const score = newCorrect.filter(Boolean).length
      setShowResult(true)
      setFinalScore(score)
      onComplete?.(score, questions.length)
      return
    }
    setCurrent((c) => c + 1)
    setSelected(null)
  }

  if (showResult) {
    const passed = finalScore === questions.length
    return (
      <div className="quiz-result">
        {passed ? (
          <>
            <span className="quiz-result-icon">🎉</span>
            <p className="quiz-result-title">{t('quiz.questComplete')}</p>
            <p className="quiz-result-text">{t('quiz.questCompleteText')}</p>
          </>
        ) : (
          <>
            <span className="quiz-result-icon">📚</span>
            <p className="quiz-result-title">{t('quiz.notQuite')}</p>
            <p className="quiz-result-text">{t('quiz.scoreText', { score: finalScore, total: questions.length, points: finalScore * 5 }) || `You got ${finalScore} out of ${questions.length} correct. You earned ${finalScore * 5} Trust Score.`}</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="quiz">
      <p className="quiz-progress">
        {t('quiz.questionOf', { current: current + 1, total: questions.length })}
      </p>
      <h4 className="quiz-question">{q.question}</h4>
      <ul className="quiz-options">
        {q.options.map((opt, i) => (
          <li key={i}>
            <label className={`quiz-option ${selected === i ? 'quiz-option-selected' : ''}`}>
              <input
                type="radio"
                name="quiz"
                checked={selected === i}
                onChange={() => setSelected(i)}
              />
              <span>{opt}</span>
            </label>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="btn btn-primary"
        onClick={handleNext}
        disabled={selected === null}
      >
        {isLast ? t('common.submit') : t('common.next')}
      </button>
    </div>
  )
}
