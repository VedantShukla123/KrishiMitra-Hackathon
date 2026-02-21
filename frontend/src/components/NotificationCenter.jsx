import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'
import './NotificationCenter.css'

export default function NotificationCenter() {
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const formatTime = (iso) => {
    try {
      const d = new Date(iso)
      const now = new Date()
      const diff = (now - d) / 60000
      if (diff < 1) return 'Just now'
      if (diff < 60) return `${Math.floor(diff)}m ago`
      if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
      return d.toLocaleDateString()
    } catch {
      return ''
    }
  }

  return (
    <div className="notification-center" ref={ref}>
      <button
        type="button"
        className="notification-bell"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close notifications' : 'Open notifications'}
        aria-expanded={open}
      >
        🔔
        {unreadCount > 0 && <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>
      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <button type="button" className="notification-mark-all" onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">No notifications yet.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notification-item notification-item-${n.type} ${n.read ? 'read' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  <div className="notification-item-title">{n.title}</div>
                  {n.message && <div className="notification-item-message">{n.message}</div>}
                  <div className="notification-item-time">{formatTime(n.timestamp)}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
