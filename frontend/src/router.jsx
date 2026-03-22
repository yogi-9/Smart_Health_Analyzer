import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

import Login from './pages/Login'
import Register from './pages/Register'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'
import Nutrition from './pages/Nutrition'
import Water from './pages/Water'
import Analyze from './pages/Analyze'
import MentalHealth from './pages/MentalHealth'
import Diabetes from './pages/Diabetes'
import Heart from './pages/Heart'
import History from './pages/History'
import Profile from './pages/Profile'
import Results from './pages/Results'
import Streaks from './pages/Streaks'
import AiCoach from './pages/AiCoach'
import AiMeals from './pages/AiMeals'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0B0E1A]">
      <div className="flex flex-col items-center gap-3">
        <div className="ag-spinner" style={{ width: 32, height: 32 }} />
        <span className="text-[#4A5480] text-sm font-dm">Loading...</span>
      </div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-[#0B0E1A]">
      <div className="flex flex-col items-center gap-3">
        <div className="ag-spinner" style={{ width: 32, height: 32 }} />
        <span className="text-[#4A5480] text-sm font-dm">Loading...</span>
      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

      <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/nutrition" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
      <Route path="/food" element={<ProtectedRoute><Nutrition /></ProtectedRoute>} />
      <Route path="/water" element={<ProtectedRoute><Water /></ProtectedRoute>} />
      <Route path="/analyze" element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
      <Route path="/analyze/mental" element={<ProtectedRoute><MentalHealth /></ProtectedRoute>} />
      <Route path="/analyze/diabetes" element={<ProtectedRoute><Diabetes /></ProtectedRoute>} />
      <Route path="/analyze/heart" element={<ProtectedRoute><Heart /></ProtectedRoute>} />
      <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
      <Route path="/streaks" element={<ProtectedRoute><Streaks /></ProtectedRoute>} />
      <Route path="/ai-coach" element={<ProtectedRoute><AiCoach /></ProtectedRoute>} />
      <Route path="/ai-meals" element={<ProtectedRoute><AiMeals /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}