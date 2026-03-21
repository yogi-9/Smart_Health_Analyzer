 import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHealthHistory, getMentalHistory } from '../api'
import BottomNav from '../components/BottomNav'

export default function History() {
  const { user } = useAuth()
  const [healthHistory, setHealthHistory] = useState([])
  const [mentalHistory, setMentalHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('health')

  useEffect(() => {
    if (!user) return
    const fetchAll = async () => {
      const [h, m] = await Promise.all([
        getHealthHistory(user.id),
        getMentalHistory(user.id)
      ])
      setHealthHistory(h.data ?? [])
      setMentalHistory(m.data ?? [])
      setLoading(false)
    }
    fetchAll()
  }, [user])

  const riskColors = {
    Low: 'bg-green-50 text-green-700 border-green-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    High: 'bg-red-50 text-red-700 border-red-200',
  }

  const levelColors = {
    Minimal: 'bg-green-50 text-green-700 border-green-200',
    Mild: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    Moderate: 'bg-orange-50 text-orange-700 border-orange-200',
    'Moderately Severe': 'bg-red-50 text-red-700 border-red-200',
    Severe: 'bg-red-50 text-red-700 border-red-200',
  }

  const formatDate = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Health history</h1>
        <p className="text-sm text-gray-500 mt-0.5">All your past analyses</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6">
          {['health', 'mental'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                tab === t
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}>
              {t === 'health' ? 'Diabetes + Heart' : 'Mental health'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : tab === 'health' ? (
          healthHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-4">No health analyses yet</p>
              <Link to="/analyze"
                className="text-blue-600 text-sm font-medium hover:underline">
                Take your first analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {healthHistory.map((item) => (
                <div key={item.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border
                      ${riskColors[item.risk_level]}`}>
                      {item.risk_level} risk
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-3xl font-semibold text-gray-900">
                      {item.risk_score}
                    </span>
                    <span className="text-gray-400 text-sm mb-1">/ 100</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      item.risk_score < 30 ? 'bg-green-500'
                      : item.risk_score < 60 ? 'bg-yellow-500'
                      : 'bg-red-500'
                    }`} style={{ width: `${item.risk_score}%` }}/>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">{item.message}</p>
                </div>
              ))}
            </div>
          )
        ) : (
          mentalHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm mb-4">No mental health checks yet</p>
              <Link to="/analyze/mental"
                className="text-blue-600 text-sm font-medium hover:underline">
                Take the mental health check
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {mentalHistory.map((item) => (
                <div key={item.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${levelColors[item.depression_level]}`}>
                        {item.depression_level} depression
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border
                        ${levelColors[item.anxiety_level]}`}>
                        {item.anxiety_level} anxiety
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-gray-500">Overall score</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {item.mental_health_score}
                        <span className="text-xs text-gray-400 font-normal">/100</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">PHQ-9</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {item.phq9_score}
                        <span className="text-xs text-gray-400 font-normal">/27</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">GAD-7</p>
                      <p className="text-xl font-semibold text-gray-900">
                        {item.gad7_score}
                        <span className="text-xs text-gray-400 font-normal">/21</span>
                      </p>
                    </div>
                  </div>
                  {item.seek_help && (
                    <div className="mt-3 p-2 bg-red-50 rounded-lg">
                      <p className="text-xs text-red-600">
                        iCall helpline: 9152987821
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
      <BottomNav />
    </div>
  )
}
