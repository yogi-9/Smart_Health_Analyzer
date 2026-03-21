import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logWater, getTodayWater, getWaterHistory } from '../api'
import BottomNav from '../components/BottomNav'

export default function Water() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [glasses, setGlasses] = useState(0)
  const [goal] = useState(8)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        getTodayWater(user.id),
        getWaterHistory(user.id)
      ])
      setGlasses(todayRes.data.glasses)
      setMessage(todayRes.data.message)
      setHistory(historyRes.data.data || [])
    } catch (err) {
      console.error('Water fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (glasses >= 20 || saving) return
    const newCount = glasses + 1
    setSaving(true)
    setGlasses(newCount)
    try {
      await logWater(newCount)
      const res = await getTodayWater(user.id)
      setMessage(res.data.message)
      fetchData()
    } catch (err) {
      setGlasses(glasses)
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (glasses <= 0 || saving) return
    const newCount = glasses - 1
    setSaving(true)
    setGlasses(newCount)
    try {
      await logWater(newCount)
      const res = await getTodayWater(user.id)
      setMessage(res.data.message)
      fetchData()
    } catch (err) {
      setGlasses(glasses)
    } finally {
      setSaving(false)
    }
  }

  const percentage = Math.min(Math.round((glasses / goal) * 100), 100)

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Water tracker</h1>
        <p className="text-sm text-gray-500 mt-0.5">Daily goal: {goal} glasses</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        {/* Main water card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Today</p>
              <div className="flex items-end gap-1">
                <span className="text-5xl font-semibold text-blue-600">
                  {glasses}
                </span>
                <span className="text-gray-400 text-lg mb-1">/ {goal}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{message}</p>
            </div>

            {/* Circle progress */}
            <div className="relative w-20 h-20">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40" cy="40" r="32"
                  fill="none" stroke="#f3f4f6" strokeWidth="8"
                />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - percentage / 100)}`}
                  transform="rotate(-90 40 40)"
                  style={{ transition: 'stroke-dashoffset 0.4s ease' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">
                  {percentage}%
                </span>
              </div>
            </div>
          </div>

          {/* Glass indicators */}
          <div className="grid grid-cols-8 gap-2 mb-6">
            {Array.from({ length: goal }).map((_, i) => (
              <div
                key={i}
                className={`h-8 rounded-lg transition-colors ${
                  i < glasses
                    ? 'bg-blue-500'
                    : 'bg-gray-100'
                }`}
              />
            ))}
          </div>

          {/* Add / Remove buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleRemove}
              disabled={glasses <= 0 || saving}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm
                font-medium text-gray-700 hover:bg-gray-50
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              − Remove glass
            </button>
            <button
              onClick={handleAdd}
              disabled={glasses >= 20 || saving}
              className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-sm
                font-medium hover:bg-blue-700
                disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              + Add glass
            </button>
          </div>
        </div>

        {/* Last 7 days */}
        {history.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Last 7 days</h2>
            <div className="space-y-3">
              {history.map((item) => {
                const pct = Math.min(Math.round((item.glasses / goal) * 100), 100)
                return (
                  <div key={item.logged_date}
                    className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-14 flex-shrink-0">
                      {formatDate(item.logged_date)}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 100 ? 'bg-blue-500'
                          : pct >= 50 ? 'bg-blue-400'
                          : 'bg-blue-200'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-12 text-right flex-shrink-0">
                      {item.glasses}/{goal}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h2 className="text-sm font-medium text-blue-900 mb-3">
            Hydration tips
          </h2>
          <ul className="space-y-2">
            {[
              "Drink a glass of water first thing in the morning",
              "Keep a water bottle on your desk as a visual reminder",
              "Drink a glass before each meal to help digestion",
              "Set hourly phone reminders if you tend to forget"
            ].map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-blue-800">
                <span className="text-blue-500 mt-0.5 flex-shrink-0">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}