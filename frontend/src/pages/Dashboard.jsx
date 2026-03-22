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
      try {
        const [h, m, w] = await Promise.all([
          getHealthHistory(user.id),
          getMentalHistory(user.id),
          getTodayWater(user.id)
        ])
        setHealthHistory(h.data ?? [])
        setMentalHistory(m.data ?? [])
        setTodayWater(w.data ?? null)
      } catch (e) {
        console.error('Dashboard fetch error:', e)
      } finally {
        setIsLoading(false)
      }
    }
    if (user) fetchData()
  }, [user, loading, navigate])

  // Loading skeleton
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] pb-24">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
          <div className="h-3 w-24 rounded-lg skeleton-shimmer mt-2" />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
          <div className="grid grid-cols-4 gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="glass-card p-4 h-20 skeleton-shimmer" />
            ))}
          </div>
          <div className="h-14 rounded-2xl skeleton-shimmer" />
          <div className="glass-card p-5 h-40 skeleton-shimmer" />
        </div>
        <BottomNav />
      </div>
    )
  }

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
    Low: 'text-[#00E5C3] bg-[#00E5C3]/10 border border-[#00E5C3]/20',
    Medium: 'text-[#FFB830] bg-[#FFB830]/10 border border-[#FFB830]/20',
    High: 'text-[#FF3D5A] bg-[#FF3D5A]/10 border border-[#FF3D5A]/20',
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

  // Custom tooltip for dark theme
  const DarkTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-[#8892B0]">{label}</p>
        <p className="font-mono font-bold text-[#00E5C3]">{payload[0].value}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">
              Your Health Snapshot
            </h1>
            <p className="text-sm text-[#8892B0] mt-0.5 font-dm">
              {lastRecord
                ? `Last analyzed ${new Date(lastRecord.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} · Overall risk: ${lastRecord.risk_level}`
                : 'Start your health journey today'
              }
            </p>
          </div>
          <Link to="/profile"
            className="w-10 h-10 rounded-xl bg-[#00E5C3]/10 border border-[#00E5C3]/20 flex items-center
              justify-center text-[#00E5C3] text-sm font-semibold hover:bg-[#00E5C3]/20 transition-colors">
            {profile?.full_name?.[0]?.toUpperCase() || 'U'}
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5 animate-fadeIn">

        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-3">
          {/* BMI */}
          <div className="glass-card p-4 hover:shadow-[0_0_20px_rgba(0,229,195,0.15)] transition-shadow duration-300">
            <p className="text-xs text-[#4A5480] mb-1 font-dm">BMI</p>
            <p className="text-xl font-bold font-mono text-[#F0F2FF]">{bmi ?? '—'}</p>
            <p className="text-xs text-[#4A5480] mt-0.5">{bmiCategory ?? 'No data'}</p>
          </div>
          {/* Checks */}
          <div className="glass-card p-4 hover:shadow-[0_0_20px_rgba(0,229,195,0.15)] transition-shadow duration-300">
            <p className="text-xs text-[#4A5480] mb-1 font-dm">Checks</p>
            <p className="text-xl font-bold font-mono text-[#F0F2FF]">
              {healthHistory.length + mentalHistory.length}
            </p>
            <p className="text-xs text-[#4A5480] mt-0.5">total</p>
          </div>
          {/* Avg Risk */}
          <div className="glass-card p-4 hover:shadow-[0_0_20px_rgba(0,229,195,0.15)] transition-shadow duration-300">
            <p className="text-xs text-[#4A5480] mb-1 font-dm">Avg Risk</p>
            <p className="text-xl font-bold font-mono text-[#F0F2FF]">{avgScore ?? '—'}</p>
            <p className="text-xs text-[#4A5480] mt-0.5">/ 100</p>
          </div>
          {/* Last Risk */}
          <div className={`rounded-2xl p-4 ${
            lastRecord ? riskColors[lastRecord.risk_level] : 'glass-card'
          }`}>
            <p className="text-xs mb-1 opacity-70">Last</p>
            <p className="text-xl font-bold font-syne">
              {lastRecord?.risk_level ?? '—'}
            </p>
            <p className="text-xs mt-0.5 opacity-60">risk</p>
          </div>
        </div>

        {/* Water today widget */}
        {todayWater && (() => {
          const waterGoal = Number(localStorage.getItem('water_goal')) || 8
          const waterGlasses = todayWater.glasses || 0
          const waterPct = Math.min(Math.round((waterGlasses / waterGoal) * 100), 100)
          const waterMl = waterGlasses * 250
          const waterColor = waterPct >= 100 ? '#00E5C3' : waterPct >= 50 ? '#00E5C3' : waterPct > 0 ? '#FFB830' : '#1A2040'
          return (
            <div className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-medium text-[#F0F2FF] font-dm">💧 Water Today</h2>
                <Link to="/water" className="text-xs text-[#00E5C3] hover:underline font-dm">
                  Track →
                </Link>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold font-mono text-[#00E5C3]">
                      {waterGlasses}
                    </span>
                    <span className="text-[#4A5480] text-sm mb-1 font-dm">
                      / {waterGoal} glasses
                    </span>
                  </div>
                  <p className="text-xs text-[#8892B0] mt-1 font-dm">
                    {waterMl}ml · {waterPct >= 100 ? '🎉 Goal reached!' : todayWater.message}
                  </p>
                </div>
                <div className="flex-1 h-2.5 bg-[#1A2040] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${waterPct}%`, backgroundColor: waterColor }} />
                </div>
                <span className="text-xs font-bold font-mono flex-shrink-0" style={{ color: waterColor }}>
                  {waterPct}%
                </span>
              </div>
            </div>
          )
        })()}

        {/* CTAs */}
        <Link to="/analyze"
          className="block bg-[#00E5C3] text-[#0B0E1A] text-center py-4 rounded-2xl
            font-semibold hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150">
          Run Health Analysis
        </Link>

        <Link to="/nutrition"
          className="block border border-[#00E5C3]/30 text-[#00E5C3] text-center py-4 rounded-2xl
            font-semibold hover:bg-[#00E5C3]/5 transition-colors duration-200">
          Track Nutrition
        </Link>

        {/* Risk score trend chart */}
        {chartData.length > 1 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-medium text-[#F0F2FF] mb-4 font-dm">
              Risk Score Trend
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2040" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4A5480' }}
                  axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#4A5480' }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#00E5C3"
                  strokeWidth={2} dot={{ fill: '#00E5C3', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#00E5C3', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mental health trend chart */}
        {mentalChartData.length > 1 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-medium text-[#F0F2FF] mb-4 font-dm">
              Mental Health Trend
            </h2>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={mentalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A2040" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#4A5480' }}
                  axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#4A5480' }}
                  axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTooltip />} />
                <Line type="monotone" dataKey="score" stroke="#7B61FF"
                  strokeWidth={2} dot={{ fill: '#7B61FF', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#7B61FF', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Last 3 predictions */}
        {healthHistory.length > 0 && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[#F0F2FF] font-dm">Recent Analyses</h2>
              <Link to="/history"
                className="text-xs text-[#00E5C3] hover:underline">
                See all
              </Link>
            </div>
            <div className="space-y-3">
              {healthHistory.slice(0, 3).map(item => (
                <div key={item.id}
                  className="flex items-center justify-between py-3
                    border-b border-white/[0.06] last:border-0">
                  <div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      riskColors[item.risk_level] || ''
                    }`}>
                      {item.risk_level}
                    </span>
                    <p className="text-xs text-[#4A5480] mt-1.5">
                      {new Date(item.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold font-mono text-[#F0F2FF]">
                      {item.risk_score}
                    </p>
                    <p className="text-xs text-[#4A5480]">/ 100</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Last mental health check */}
        {lastMental && (
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-[#F0F2FF] font-dm">
                Last Mental Health Check
              </h2>
              <Link to="/history"
                className="text-xs text-[#00E5C3] hover:underline">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-[#4A5480]">Score</p>
                <p className="text-xl font-bold font-mono text-[#F0F2FF]">
                  {lastMental.mental_health_score}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#4A5480]">Depression</p>
                <p className="text-sm font-medium text-[#F0F2FF]">
                  {lastMental.depression_level}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#4A5480]">Anxiety</p>
                <p className="text-sm font-medium text-[#F0F2FF]">
                  {lastMental.anxiety_level}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {healthHistory.length === 0 && mentalHistory.length === 0 && (
          <div className="glass-card p-8 text-center">
            {/* Decorative icon */}
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00E5C3]/10 border border-[#00E5C3]/20 mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5C3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <p className="text-[#8892B0] text-sm mb-4 font-dm">
              No analyses yet. Run your first health check.
            </p>
            <Link to="/analyze"
              className="inline-block bg-[#00E5C3] text-[#0B0E1A] font-semibold px-6 py-2.5 rounded-xl
                text-sm hover:scale-[1.02] transition-transform duration-150">
              Get Your Risk Score
            </Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}