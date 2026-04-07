import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { lazy, Suspense } from 'react'

// Eagerly load critical path pages (needed immediately)
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'

// Lazy load secondary pages (loaded on demand)
const ProfileSetup = lazy(() => import('./pages/ProfileSetup'))
const Nutrition = lazy(() => import('./pages/Nutrition'))
const Water = lazy(() => import('./pages/Water'))
const MentalHealth = lazy(() => import('./pages/MentalHealth'))

const History = lazy(() => import('./pages/History'))
const Profile = lazy(() => import('./pages/Profile'))
const Results = lazy(() => import('./pages/Results'))
const Streaks = lazy(() => import('./pages/Streaks'))
const AiCoach = lazy(() => import('./pages/AiCoach'))
const AiMeals = lazy(() => import('./pages/AiMeals'))

// Lightweight loading spinner for lazy chunks
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0B0E1A]">
      <div className="flex flex-col items-center gap-3">
        <div className="ag-spinner" style={{ width: 28, height: 28 }} />
        <span className="text-[#4A5480] text-xs font-dm">Loading...</span>
      </div>
    </div>
  )
}

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return <PageLoader />

  return (
    <Suspense fallback={<PageLoader />}>
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

        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/streaks" element={<ProtectedRoute><Streaks /></ProtectedRoute>} />
        <Route path="/ai-coach" element={<ProtectedRoute><AiCoach /></ProtectedRoute>} />
        <Route path="/ai-meals" element={<ProtectedRoute><AiMeals /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}