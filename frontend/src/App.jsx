import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import axios from 'axios'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Register from './pages/Register'
import ProfileSetup from './pages/ProfileSetup'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? children : <Navigate to="/" replace />
}

function AppRoutes() {
  const [apiStatus, setApiStatus] = useState('checking...')
  const { user, profile } = useAuth()

  useEffect(() => {
    axios.get('http://localhost:8000')
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
        <Route path="/" element={
          user ? <Navigate to="/dashboard" replace /> : <Login />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/dashboard" replace /> : <Register />
        } />
        <Route path="/profile-setup" element={
          <ProtectedRoute><ProfileSetup /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/analyze" element={
          <ProtectedRoute><Analyze /></ProtectedRoute>
        } />
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
