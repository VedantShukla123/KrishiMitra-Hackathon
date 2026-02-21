import { useState, useRef, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { Link, useNavigate } from 'react-router-dom'
import { languageCodes } from '../lib/translations'
import Sidebar from './Sidebar'
import Chatbot from './Chatbot'
import NotificationCenter from './NotificationCenter'
import './Layout.css'

export default function Layout() {
  const { user, logout } = useAuth()
  const { language, setLanguage, t } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [langOpen, setLangOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const langRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false)
    }
    document.addEventListener('click', handleClickOutside, true)
    return () => document.removeEventListener('click', handleClickOutside, true)
  }, [])

  const handleLogout = () => {
    logout()
    setSidebarOpen(false)
    navigate('/login')
  }

  const langLabels = { en: 'English', hi: 'हिंदी', mr: 'मराठी' }

  return (
    <div className="layout">
      <header className="header">
        <div className="header-left">
          {user && (
            <button
              type="button"
              className="hamburger"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span />
              <span />
              <span />
            </button>
          )}
          <Link to="/" className="logo">
            <span className="logo-icon">🌾</span>
            <span>Krishimitra</span>
          </Link>
        </div>
        <div className="header-actions">
          {user && <NotificationCenter />}
          <div className="lang-switcher" ref={langRef}>
            <button
              type="button"
              className="lang-trigger"
              onClick={() => setLangOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
            >
              <span className="lang-globe">🌐</span>
              <span>{langLabels[language]}</span>
            </button>
            {langOpen && (
              <ul className="lang-dropdown" role="listbox">
                {languageCodes.map((code) => (
                  <li key={code}>
                    <button
                      type="button"
                      className={`lang-option ${language === code ? 'lang-option-active' : ''}`}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setLanguage(code)
                        setLangOpen(false)
                      }}
                      onTouchEnd={(e) => {
                        e.preventDefault()
                        setLanguage(code)
                        setLangOpen(false)
                      }}
                      role="option"
                      aria-selected={language === code}
                    >
                      {langLabels[code]}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {user ? (
            <>
              <span className="user-name">{user.name}</span>
              <button type="button" className="btn btn-ghost" onClick={handleLogout}>
                {t('nav.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login">{t('nav.login')}</Link>
              <Link to="/register" className="btn btn-primary">
                {t('nav.register')}
              </Link>
            </>
          )}
        </div>
      </header>
      <div className="layout-body">
        {user && (
          <>
            <div
              className={`sidebar-backdrop ${sidebarOpen ? 'sidebar-backdrop-open' : ''}`}
              onClick={() => setSidebarOpen(false)}
              aria-hidden="true"
            />
            <Sidebar
              open={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              onLogout={handleLogout}
            />
          </>
        )}
        <main className="main">
          <div key={location.pathname} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>
      <footer className="footer">
        {t('footer.madeBy')} <strong>AlgroithmX</strong>
      </footer>
      <Chatbot />
    </div>
  )
}
