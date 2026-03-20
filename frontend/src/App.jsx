import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import axios from 'axios'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Analyze from './pages/Analyze'

export default function App() {
  const [apiStatus, setApiStatus] = useState('checking...')

  useEffect(() => {
    axios.get('http://localhost:8000')
      .then(res => setApiStatus(res.data.message))
      .catch(() => setApiStatus('backend offline — start FastAPI first'))
  }, [])

  return (
    <div>
      <div className={`px-4 py-2 text-xs font-medium text-center
        ${apiStatus.includes('offline') 
          ? 'bg-red-50 text-red-600' 
          : 'bg-green-50 text-green-700'}`}>
        API: {apiStatus}
      </div>

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/analyze" element={<Analyze />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
