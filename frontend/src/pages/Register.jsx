import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import './Auth.css'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
  })
  const [error, setError] = useState('')
  const { register } = useAuth()
  const { t } = useLanguage()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name.trim()) {
      setError(t('auth.errorName'))
      return
    }
    if (!form.email.trim()) {
      setError(t('auth.errorEmail'))
      return
    }
    if (form.password.length < 6) {
      setError(t('auth.errorPasswordLength'))
      return
    }
    if (form.password !== form.confirmPassword) {
      setError(t('auth.errorPasswordMatch'))
      return
    }
    const result = await register({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      trustScore: Math.floor(Math.random() * 41) + 60,
    })
    if (result.ok) navigate('/')
    else setError(result.message === 'An account with this email already exists.' ? t('auth.errorEmailExists') : result.message)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-icon">🌾</span>
          <h1>{t('auth.createAccount')}</h1>
          <p>{t('auth.joinAsFarmer')}</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <label>
            {t('auth.fullName')}
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
              autoComplete="name"
            />
          </label>
          <label>
            {t('auth.email')}
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label>
            {t('auth.phoneOptional')}
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
            />
          </label>
          <label>
            {t('auth.password')}
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="At least 6 characters"
              autoComplete="new-password"
            />
          </label>
          <label>
            {t('auth.confirmPassword')}
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block">
            {t('auth.register')}
          </button>
        </form>
        <p className="auth-footer">
          {t('auth.haveAccount')} <Link to="/login">{t('auth.signIn')}</Link>
        </p>
      </div>
    </div>
  )
}
