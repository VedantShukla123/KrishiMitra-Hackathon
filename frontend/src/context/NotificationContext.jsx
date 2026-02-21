import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const NotificationContext = createContext(null)

const STORAGE_KEY = 'krishimitra_notifications'
const MAX_STORED = 50

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed.slice(0, MAX_STORED) : []
      }
    } catch {}
    return []
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications.slice(0, MAX_STORED)))
    } catch {}
  }, [notifications])

  useEffect(() => {
    const handler = (e) => {
      const payload = e.detail || {}
      addNotification({
        type: payload.type || 'info',
        title: payload.title || 'Notification',
        message: payload.message || '',
        read: false,
        timestamp: new Date().toISOString(),
      })
    }
    window.addEventListener('km_notification', handler)
    return () => window.removeEventListener('km_notification', handler)
  }, [])

  const addNotification = useCallback((item) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const entry = { id, ...item, read: item.read ?? false }
    setNotifications((prev) => [entry, ...prev].slice(0, MAX_STORED))
  }, [])

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markRead,
        markAllRead,
        unreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}

export function notify(payload) {
  window.dispatchEvent(new CustomEvent('km_notification', { detail: payload }))
}
