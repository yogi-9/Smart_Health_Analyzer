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

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-gray-400 text-sm">Loading...</div>
    </div>
  )

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route path="/register" element={<Register />} />

      <Route path="/profile-setup" element={
        <ProtectedRoute><ProfileSetup /></ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />
      <Route path="/nutrition" element={
        <ProtectedRoute><Nutrition /></ProtectedRoute>
      } />
      <Route path="/water" element={
        <ProtectedRoute><Water /></ProtectedRoute>
      } />
      <Route path="/analyze" element={
        <ProtectedRoute><Analyze /></ProtectedRoute>
      } />
      <Route path="/analyze/mental" element={
        <ProtectedRoute><MentalHealth /></ProtectedRoute>
      } />
      <Route path="/analyze/diabetes" element={
        <ProtectedRoute><Diabetes /></ProtectedRoute>
      } />
      <Route path="/analyze/heart" element={
        <ProtectedRoute><Heart /></ProtectedRoute>
      } />
      <Route path="/history" element={
        <ProtectedRoute><History /></ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />
      <Route path="/results" element={
        <ProtectedRoute><Results /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}