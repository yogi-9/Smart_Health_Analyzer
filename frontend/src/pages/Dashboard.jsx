import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getHealthHistory, getMentalHistory, getTodayWater } from '../api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import BottomNav from '../components/BottomNav'

export default function Dashboard() {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [healthHistory, setHealthHistory] = useState([])
  const [mentalHistory, setMentalHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [todayWater, setTodayWater] = useState(null)

  useEffect(() => {
    if (!loading && !user) { navigate('/'); return }
    const fetchData = async () => {
      const [h, m, w] = await Promise.all([
      getHealthHistory(user.id),
      getMentalHistory(user.id),
      getTodayWater(user.id)
])
     setHealthHistory(h.data ?? [])
     setMentalHistory(m.data ?? [])
     setTodayWater(w.data ?? null)
    }
    fetchData()
  }, [user, navigate])

    if (loading) return (
    <div className="min-h-screen bg-gray-50"/>
  )

  const bmi = profile?.height && profile?.weight
    ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
    : null

  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight'
      : bmi < 25 ? 'Normal'
      : bmi < 30 ? 'Overweight'
      : 'Obese'
    : null

  const avgScore = healthHistory.length > 0
    ? Math.round(healthHistory.reduce((s, r) => s + r.risk_score, 0) / healthHistory.length)
    : null

  const lastRecord = healthHistory[0] ?? null
  const lastMental = mentalHistory[0] ?? null

  const riskColors = {
    Low: 'text-green-600 bg-green-50',
    Medium: 'text-yellow-600 bg-yellow-50',
    High: 'text-red-600 bg-red-50',
  }

  // Chart data — last 7 health records reversed (oldest first)
  const chartData = [...healthHistory].reverse().slice(-7).map(r => ({
    date: new Date(r.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    }),
    score: r.risk_score
  }))

  // Mental chart data
  const mentalChartData = [...mentalHistory].reverse().slice(-7).map(r => ({
    date: new Date(r.created_at).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short'
    }),
    score: r.mental_health_score
  }))

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse"/>
          <div className="h-3 w-24 bg-gray-100 rounded-lg mt-2 animate-pulse"/>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 h-20 animate-pulse"/>
            ))}
          </div>
          <div className="h-14 bg-blue-100 rounded-2xl animate-pulse"/>
          <div className="bg-white border border-gray-100 rounded-2xl p-5 h-40 animate-pulse"/>
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">
              Hello, {profile?.full_name?.split(' ')[0] || 'there'}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Your health overview</p>
          </div>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center
            justify-center text-white text-sm font-semibold">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 col-span-1">
            <p className="text-xs text-gray-500 mb-1">BMI</p>
            <p className="text-xl font-semibold text-gray-900">{bmi ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{bmiCategory ?? 'No data'}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 col-span-1">
            <p className="text-xs text-gray-500 mb-1">Checks</p>
            <p className="text-xl font-semibold text-gray-900">
              {healthHistory.length + mentalHistory.length}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">total</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-4 col-span-1">
            <p className="text-xs text-gray-500 mb-1">Avg risk</p>
            <p className="text-xl font-semibold text-gray-900">{avgScore ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-0.5">/ 100</p>
          </div>
          <div className={`rounded-2xl p-4 col-span-1 ${
            lastRecord ? riskColors[lastRecord.risk_level] : 'bg-white border border-gray-100'
          }`}>
            <p className="text-xs mb-1 opacity-70">Last</p>
            <p className="text-xl font-semibold">
              {lastRecord?.risk_level ?? '—'}
            </p>
            <p className="text-xs mt-0.5 opacity-60">risk</p>
          </div>
        </div>

        {/* Water today widget */}
        {todayWater && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-900">Water today</h2>
              <Link to="/water" className="text-xs text-blue-600 hover:underline">
                Track
              </Link>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-semibold text-blue-600">
                    {todayWater.glasses}
                  </span>
                  <span className="text-gray-400 text-sm mb-1">
                    / {todayWater.goal}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {todayWater.message}
                </p>
              </div>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${todayWater.percentage}%` }}
                />
              </div>
              <span className="text-xs font-medium text-gray-600 flex-shrink-0">
                {todayWater.percentage}%
              </span>
            </div>
          </div>
        )}

        {/* Run analysis CTA */}
        <Link to="/analyze"
          className="block bg-blue-600 text-white text-center py-4 rounded-2xl
            font-medium hover:bg-blue-700 transition-colors">
          Run health analysis
        </Link>

        {/* Nutrition CTA */}
        <Link to="/nutrition"
        className="block bg-green-600 text-white text-center py-4 rounded-2xl
        font-medium hover:bg-green-700 transition-colors">
        Track Nutrition
        </Link>

        {/* Risk score trend chart */}
        {chartData.length > 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">
              Risk score trend
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}/>
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}/>
                <Tooltip
                  contentStyle={{
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}/>
                <Line type="monotone" dataKey="score" stroke="#2563eb"
                  strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }}
                  activeDot={{ r: 6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mental health trend chart */}
        {mentalChartData.length > 1 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">
              Mental health trend
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={mentalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/>
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}/>
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9ca3af' }}
                  axisLine={false} tickLine={false}/>
                <Tooltip
                  contentStyle={{
                    border: '1px solid #f3f4f6',
                    borderRadius: '12px',
                    fontSize: '12px'
                  }}/>
                <Line type="monotone" dataKey="score" stroke="#8b5cf6"
                  strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Last 3 predictions */}
        {healthHistory.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-900">Recent analyses</h2>
              <Link to="/history"
                className="text-xs text-blue-600 hover:underline">
                See all
              </Link>
            </div>
            <div className="space-y-3">
              {healthHistory.slice(0, 3).map(item => (
                <div key={item.id}
                  className="flex items-center justify-between py-3
                    border-b border-gray-50 last:border-0">
                  <div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full
                      ${riskColors[item.risk_level]}`}>
                      {item.risk_level}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {item.risk_score}
                    </p>
                    <p className="text-xs text-gray-400">/ 100</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last mental health check */}
        {lastMental && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-gray-900">
                Last mental health check
              </h2>
              <Link to="/history"
                className="text-xs text-blue-600 hover:underline">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500">Score</p>
                <p className="text-xl font-semibold text-gray-900">
                  {lastMental.mental_health_score}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Depression</p>
                <p className="text-sm font-medium text-gray-900">
                  {lastMental.depression_level}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Anxiety</p>
                <p className="text-sm font-medium text-gray-900">
                  {lastMental.anxiety_level}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {healthHistory.length === 0 && mentalHistory.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-gray-400 text-sm mb-4">
              No health data yet. Run your first analysis!
            </p>
            <Link to="/analyze"
              className="text-blue-600 text-sm font-medium hover:underline">
              Start now
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}