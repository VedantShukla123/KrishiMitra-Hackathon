import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { kmKey } from '../utils/storageKeys'
import './Sidebar.css'

const navItems = [
  { to: '/', icon: '🏠', labelKey: 'nav.home', alwaysOpen: true },
  { to: '/weather-insurance', icon: '🌧️', labelKey: 'nav.weatherInsurance' },
  { to: '/crop-analysis', icon: '🌾', labelKey: 'nav.cropAnalysis' },
  { to: '/financial-literacy', icon: '⬆️', labelKey: 'nav.financialQuests' },
  { to: '/smart-milestones', icon: '📋', labelKey: 'nav.payAsYouGrow' },
  { to: '/vouchers', icon: '🎫', labelKey: 'nav.vouchers' },
  { to: '/sensor-readings', icon: '📡', labelKey: 'nav.sensorReadings' },
  { to: '/bank-statement', icon: '🏦', labelKey: 'nav.bankStatement' },
]

export default function Sidebar({ open, onClose, onLogout }) {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { user } = useAuth()
  const uid = user?.id
  const started = (() => { try { return localStorage.getItem(kmKey('started', uid)) === '1' } catch { return false } })()
  const evaluated = (() => { try { return localStorage.getItem(kmKey('evaluated', uid)) === '1' } catch { return false } })()

  const handleSettingsClick = () => {
    if (!started) {
      navigate('/')
      onClose?.()
      return
    }
    navigate('/settings')
    onClose?.()
  }

  const handleLogout = () => {
    onLogout?.()
  }

  return (
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon, labelKey, alwaysOpen }) => {
          const locked = !alwaysOpen && !started
          const disabled = (to === '/vouchers' || to === '/smart-milestones') && !evaluated
          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${locked ? 'sidebar-link-locked' : ''} ${disabled ? 'sidebar-link-disabled' : ''}`}
              end={to === '/'}
              onClick={(e) => { if (locked) { e.preventDefault(); navigate('/'); onClose?.() } else onClose?.() }}
            >
              <span className="sidebar-icon">{locked ? '🔒' : icon}</span>
              <span className="sidebar-label">{t(labelKey)}</span>
            </NavLink>
          )
        })}
      </nav>
      <div className="sidebar-contact">
        <h3 className="sidebar-contact-title">{t('nav.contactUs')}</h3>
        <ul className="sidebar-contact-list">
          <li><span className="sidebar-contact-label">{t('contact.telephone')}</span><a href="tel:08390312345">083903 12345</a></li>
          <li><span className="sidebar-contact-label">{t('contact.mobile')}</span><a href="tel:09123456789">091234 56789</a></li>
          <li><span className="sidebar-contact-label">{t('contact.tollFree')}</span><a href="tel:18001234567">1800 123 4567</a></li>
          <li><span className="sidebar-contact-label">{t('contact.email')}</span><a href="mailto:support@krishimitra.in">support@krishimitra.in</a></li>
          <li><span className="sidebar-contact-label">{t('contact.whatsapp')}</span><a href="https://wa.me/919123456789" target="_blank" rel="noreferrer">+91 91234 56789</a></li>
          <li><span className="sidebar-contact-label">{t('contact.instagram')}</span><a href="https://instagram.com/krishimitra" target="_blank" rel="noreferrer">@krishimitra</a></li>
          <li><span className="sidebar-contact-label">{t('contact.helplineHours')}</span><span className="sidebar-contact-value">Mon–Sat, 9 AM – 6 PM</span></li>
        </ul>
      </div>
      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-link sidebar-link-footer"
          onClick={handleSettingsClick}
        >
          <span className="sidebar-icon">⚙️</span>
          <span className="sidebar-label">{t('nav.settings')}</span>
        </button>
        <button
          type="button"
          className="sidebar-link sidebar-link-footer sidebar-link-logout"
          onClick={handleLogout}
        >
          <span className="sidebar-icon">🚪</span>
          <span className="sidebar-label">{t('nav.logout')}</span>
        </button>
      </div>
    </aside>
  )
}
