import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'
import WeatherInsurance from './pages/WeatherInsurance'
import CropAnalysis from './pages/CropAnalysis'
import FinancialLiteracy from './pages/FinancialLiteracy'
import SmartMilestones from './pages/SmartMilestones'
import Vouchers from './pages/Vouchers'
import Settings from './pages/Settings'
import SensorReadings from './pages/SensorReadings'
import BankStatement from './pages/BankStatement'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireStarted({ children }) {
  const { user } = useAuth()
  const uid = user?.id
  try {
    const key = uid ? `km_started_${uid}` : 'km_started'
    if (localStorage.getItem(key) !== '1') return <Navigate to="/" replace />
  } catch {}
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="weather-insurance" element={<ProtectedRoute><RequireStarted><WeatherInsurance /></RequireStarted></ProtectedRoute>} />
        <Route path="crop-analysis" element={<ProtectedRoute><RequireStarted><CropAnalysis /></RequireStarted></ProtectedRoute>} />
        <Route path="financial-literacy" element={<ProtectedRoute><RequireStarted><FinancialLiteracy /></RequireStarted></ProtectedRoute>} />
        <Route path="smart-milestones" element={<ProtectedRoute><RequireStarted><SmartMilestones /></RequireStarted></ProtectedRoute>} />
        <Route path="vouchers" element={<ProtectedRoute><RequireStarted><Vouchers /></RequireStarted></ProtectedRoute>} />
        <Route path="sensor-readings" element={<ProtectedRoute><RequireStarted><SensorReadings /></RequireStarted></ProtectedRoute>} />
        <Route path="bank-statement" element={<ProtectedRoute><RequireStarted><BankStatement /></RequireStarted></ProtectedRoute>} />
        <Route path="settings" element={<ProtectedRoute><RequireStarted><Settings /></RequireStarted></ProtectedRoute>} />
        <Route path="login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
        <Route path="register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
