import { createContext, useContext, useState, useEffect } from 'react'
import { flushSync } from 'react-dom'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { notify } from './NotificationContext'
import { kmKey } from '../utils/storageKeys'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        const userRef = doc(db, 'users', fbUser.uid)
        const snap = await getDoc(userRef)
        const data = snap.exists() ? snap.data() : {}
        setUser({
          id: fbUser.uid,
          email: fbUser.email,
          name: data.name ?? fbUser.displayName ?? fbUser.email?.split('@')[0] ?? '',
          phone: data.phone ?? '',
          trustScore: data.trustScore ?? 0,
        })
      } catch {
        setUser({
          id: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? '',
          phone: '',
          trustScore: 0,
        })
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const _resetSessionUsed = () => {
    const keys = ['km_session_used_profile', 'km_session_used_bank', 'km_session_used_sensor', 'km_session_used_crop', 'km_session_used_quiz', 'km_session_used_weather']
    try { keys.forEach(k => localStorage.removeItem(k)) } catch {}
  }

  /** Clear all dashboard/progress localStorage for this user (used when logging in as a different ID). */
  const _clearDashboardForUser = (uid) => {
    const bases = [
      'started', 'evaluated', 'eligible',
      'session_used_profile', 'session_used_bank', 'session_used_sensor', 'session_used_crop', 'session_used_quiz', 'session_used_weather',
      'profile_awarded', 'bank_awarded', 'penalty_bank_awarded', 'sensor_awarded', 'soil_awarded', 'n_awarded', 'ph_awarded',
      'crop_awarded', 'quiz_awarded', 'weather_awarded', 'penalty_drought_awarded', 'penalty_flood_awarded',
      'penalty_drought', 'penalty_flood', 'penalty_bank',
      'loan_start', 'stage1_active', 'stage2_active', 'stage3_active',
      'profile_data',
    ]
    try { bases.forEach(base => localStorage.removeItem(kmKey(base, uid))) } catch {}
  }

  const login = async (email, password) => {
    const previousUid = user?.id ?? null
    setUser(null)
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
      const isSameAccount = previousUid === null || cred.user.uid === previousUid
      const userRef = doc(db, 'users', cred.user.uid)
      const snap = await getDoc(userRef)
      const data = snap.exists() ? snap.data() : {}
      let trustScore
      if (isSameAccount) {
        trustScore = data.trustScore ?? 0
      } else {
        trustScore = 0
        _clearDashboardForUser(cred.user.uid)
        try {
          await setDoc(doc(db, 'users', cred.user.uid), { trustScore: 0 }, { merge: true })
        } catch {}
      }
      const userData = {
        id: cred.user.uid,
        email: cred.user.email,
        name: data.name ?? cred.user.displayName ?? cred.user.email?.split('@')[0] ?? '',
        phone: data.phone ?? '',
        trustScore,
      }
      flushSync(() => setUser(userData))
      try {
        await addDoc(collection(db, 'users', cred.user.uid, 'loginHistory'), {
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toISOString().slice(11, 19),
          timestamp: new Date(),
        })
      } catch {}
      _resetSessionUsed()
      return { ok: true }
    } catch (err) {
      const msg = err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password'
        ? 'Invalid email or password.'
        : err?.message ?? 'Login failed.'
      return { ok: false, message: msg }
    }
  }

  const register = async (data) => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password)
      const trustScore = data.trustScore ?? (Math.floor(Math.random() * 41) + 60)
      const userData = {
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone?.trim() ?? '',
        trustScore,
        createdAt: new Date(),
      }
      await setDoc(doc(db, 'users', cred.user.uid), userData)
      setUser({
        id: cred.user.uid,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        trustScore: userData.trustScore,
      })
      try {
        await addDoc(collection(db, 'users', cred.user.uid, 'loginHistory'), {
          date: new Date().toISOString().slice(0, 10),
          time: new Date().toISOString().slice(11, 19),
          timestamp: new Date(),
        })
      } catch {}
      _resetSessionUsed()
      return { ok: true }
    } catch (err) {
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'An account with this email already exists.'
        : err?.message ?? 'Registration failed.'
      return { ok: false, message: msg }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch {}
    setUser(null)
  }

  const addTrustScore = async (points, description) => {
    if (!user?.id || !Number.isFinite(points)) return
    const next = (user.trustScore ?? 0) + points
    const clamped = Math.max(0, Math.min(100, next))
    const updated = { ...user, trustScore: clamped }
    setUser(updated)
    const desc = description || (points >= 0 ? `+${points} points` : `${points} points`)
    notify({
      type: points >= 0 ? 'success' : 'warning',
      title: points >= 0 ? 'Trust score earned' : 'Trust score deducted',
      message: desc,
    })
    if (clamped >= 80 && (user.trustScore ?? 0) < 80) {
      notify({ type: 'loan', title: 'Loan eligible', message: 'You have reached a score of 80+. Loan, Vouchers and Pay-as-you-Grow are now unlocked.' })
    }
    try {
      await setDoc(doc(db, 'users', user.id), { trustScore: clamped }, { merge: true })
      await addDoc(collection(db, 'users', user.id, 'transactions'), {
        date: new Date().toISOString().slice(0, 10),
        description: description || 'Trust score change',
        change: points,
        type: points >= 0 ? 'earned' : 'depleted',
        timestamp: new Date(),
      })
      window.dispatchEvent(new CustomEvent('km_transactions_updated'))
    } catch {}
  }

  const setTrustScore = async (score) => {
    if (!user?.id || !Number.isFinite(score)) return
    const clamped = Math.max(0, Math.min(100, score))
    const updated = { ...user, trustScore: clamped }
    setUser(updated)
    notify({ type: 'info', title: 'Trust score updated', message: `Your score is now ${clamped}.` })
    if (clamped >= 80 && (user.trustScore ?? 0) < 80) {
      notify({ type: 'loan', title: 'Loan eligible', message: 'You have reached a score of 80+. Loan, Vouchers and Pay-as-you-Grow are now unlocked.' })
    }
    try {
      await setDoc(doc(db, 'users', user.id), { trustScore: clamped }, { merge: true })
    } catch {}
  }

  const getTransactions = async () => {
    if (!user?.id) return []
    try {
      const q = query(
        collection(db, 'users', user.id, 'transactions'),
        orderBy('timestamp', 'desc')
      )
      const snap = await getDocs(q)
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    } catch {
      return []
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        addTrustScore,
        setTrustScore,
        getTransactions,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
