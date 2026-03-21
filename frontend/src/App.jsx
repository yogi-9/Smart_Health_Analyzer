import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'
import MentalHealth from './pages/MentalHealth'
import Diabetes from './pages/Diabetes'
import Heart from './pages/Heart'
import Results from './pages/Results'
import History from './pages/History'
import Profile from './pages/Profile'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-gray-50"/>
  if (!user) return <Navigate to="/" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-gray-50"/>
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const [apiStatus, setApiStatus] = useState('checking...')

  useEffect(() => {
    axios.get(import.meta.env.VITE_API_URL || 'http://localhost:8000')
      .then(res => setApiStatus(res.data.message))
      .catch(() => setApiStatus('backend offline'))
  }, [])

  return (
    <div>
      <div className={`px-4 py-2 text-xs font-medium text-center ${
        apiStatus.includes('offline')
          ? 'bg-red-50 text-red-600'
          : 'bg-green-50 text-green-700'
      }`}>
        API: {apiStatus}
      </div>
      <Routes>
        <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analyze" element={<ProtectedRoute><Analyze /></ProtectedRoute>} />
        <Route path="/analyze/mental" element={<ProtectedRoute><MentalHealth /></ProtectedRoute>} />
        <Route path="/analyze/diabetes" element={<ProtectedRoute><Diabetes /></ProtectedRoute>} />
        <Route path="/analyze/heart" element={<ProtectedRoute><Heart /></ProtectedRoute>} />
        <Route path="/results" element={<ProtectedRoute><Results /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
