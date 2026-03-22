import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logWater, getTodayWater, getWaterHistory } from '../api'
import BottomNav from '../components/BottomNav'

export default function Water() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [glasses, setGlasses] = useState(0)
  const [goal, setGoal] = useState(() => {
    const saved = localStorage.getItem('water_goal')
    return saved ? Number(saved) : 8
  })
  const [editingGoal, setEditingGoal] = useState(false)
  const [tempGoal, setTempGoal] = useState(goal)
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bounce, setBounce] = useState(false)

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
    if (glasses >= 30 || saving) return
    const newCount = glasses + 1
    setSaving(true)
    setGlasses(newCount)
    setBounce(true)
    setTimeout(() => setBounce(false), 300)
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

  const saveGoal = () => {
    const val = Math.max(1, Math.min(30, Number(tempGoal) || 8))
    setGoal(val)
    localStorage.setItem('water_goal', String(val))
    setEditingGoal(false)
  }

  const percentage = Math.min(Math.round((glasses / goal) * 100), 100)
  const radius = 80
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percentage / 100)
  const ringColor = percentage >= 100 ? '#00E5C3' : percentage >= 50 ? '#00E5C3' : percentage > 0 ? '#FFB830' : '#1A2040'
  const mlTotal = glasses * 250

  const formatDate = (dateStr) => {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-IN', { weekday: 'short' })
  }

  // Streak calculation
  const streak = (() => {
    let count = 0
    for (const day of history) {
      if (day.glasses >= goal) count++
      else break
    }
    return count
  })()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="ag-spinner" style={{ width: 32, height: 32 }} />
          <span className="text-[#4A5480] text-sm font-dm">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💧</span>
            <div>
              <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Water Tracker</h1>
              <p className="text-sm text-[#8892B0] mt-0.5 font-dm">Stay hydrated, feel great</p>
            </div>
          </div>
          {/* Goal setting button */}
          <button type="button" onClick={() => { setTempGoal(goal); setEditingGoal(true) }}
            className="px-3 py-1.5 rounded-lg bg-[#1A2040] border border-white/[0.06]
              text-xs text-[#8892B0] font-dm hover:text-[#00E5C3] hover:border-[#00E5C3]/30 transition-colors">
            🎯 Goal: {goal} glasses
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5 animate-fadeIn">

        {/* Goal editor modal */}
        {editingGoal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setEditingGoal(false)}>
            <div className="glass-card p-6 w-full max-w-xs animate-fadeIn" onClick={e => e.stopPropagation()}>
              <h3 className="font-syne font-bold text-lg text-[#F0F2FF] mb-1">Set Daily Goal</h3>
              <p className="text-xs text-[#8892B0] font-dm mb-5">How many glasses per day? (1 glass = 250ml)</p>

              <div className="flex items-center justify-center gap-4 mb-5">
                <button type="button" onClick={() => setTempGoal(Math.max(1, tempGoal - 1))}
                  className="w-10 h-10 rounded-xl bg-[#1A2040] border border-white/[0.06] text-[#F0F2FF] text-lg
                    hover:border-[#00E5C3]/30 transition-colors flex items-center justify-center">
                  −
                </button>
                <div className="text-center">
                  <span className="font-mono text-4xl font-bold text-[#00E5C3]">{tempGoal}</span>
                  <p className="text-xs text-[#4A5480] font-dm mt-1">{tempGoal * 250}ml / day</p>
                </div>
                <button type="button" onClick={() => setTempGoal(Math.min(30, tempGoal + 1))}
                  className="w-10 h-10 rounded-xl bg-[#1A2040] border border-white/[0.06] text-[#F0F2FF] text-lg
                    hover:border-[#00E5C3]/30 transition-colors flex items-center justify-center">
                  +
                </button>
              </div>

              {/* Quick presets */}
              <div className="flex gap-2 mb-5">
                {[6, 8, 10, 12].map(n => (
                  <button key={n} type="button" onClick={() => setTempGoal(n)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium font-dm transition-all ${
                      tempGoal === n
                        ? 'bg-[#00E5C3] text-[#0B0E1A]'
                        : 'bg-[#1A2040] text-[#8892B0] border border-white/[0.06]'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>

              <button type="button" onClick={saveGoal}
                className="w-full bg-[#00E5C3] text-[#0B0E1A] py-3 rounded-xl text-sm font-semibold
                  hover:scale-[1.02] active:scale-[0.98] transition-transform">
                Save Goal
              </button>
            </div>
          </div>
        )}

        {/* Main card with ring */}
        <div className="glass-card p-8 flex flex-col items-center">
          <div className="relative" style={{ width: 200, height: 200 }}>
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r={radius} fill="none" stroke="#1A2040" strokeWidth="12" />
              <circle cx="100" cy="100" r={radius} fill="none"
                stroke={ringColor} strokeWidth="12" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease',
                         filter: percentage > 0 ? `drop-shadow(0 0 8px ${ringColor}40)` : 'none' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-4xl font-bold text-[#F0F2FF]">{glasses}</span>
              <span className="text-[#4A5480] text-sm font-dm">/ {goal} glasses</span>
            </div>
          </div>

          {percentage >= 100 ? (
            <p className="text-[#00E5C3] text-sm mt-4 font-dm text-center font-medium">
              🎉 Goal reached! Great job staying hydrated!
            </p>
          ) : (
            <p className="text-[#8892B0] text-sm mt-4 font-dm text-center">{message}</p>
          )}

          {streak > 0 && (
            <div className="mt-3 px-4 py-1.5 rounded-full bg-[#00E5C3]/10 border border-[#00E5C3]/20">
              <span className="text-sm font-dm text-[#00E5C3]">🔥 {streak} day streak!</span>
            </div>
          )}
        </div>

        {/* Daily stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-[#4A5480] font-dm mb-1">Total</p>
            <p className="font-mono text-xl font-bold text-[#00E5C3]">{mlTotal}</p>
            <p className="text-[10px] text-[#4A5480] font-dm">ml today</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-[#4A5480] font-dm mb-1">Remaining</p>
            <p className="font-mono text-xl font-bold text-[#F0F2FF]">{Math.max(0, goal - glasses)}</p>
            <p className="text-[10px] text-[#4A5480] font-dm">glasses left</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-[#4A5480] font-dm mb-1">Progress</p>
            <p className="font-mono text-xl font-bold" style={{ color: ringColor }}>{percentage}%</p>
            <p className="text-[10px] text-[#4A5480] font-dm">of goal</p>
          </div>
        </div>

        {/* Glass indicators */}
        <div className="glass-card p-5">
          <div className="flex flex-wrap gap-2 mb-5 justify-center">
            {Array.from({ length: goal }).map((_, i) => (
              <div key={i}
                className={`w-9 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  i < glasses
                    ? 'bg-[#00E5C3]/20 border border-[#00E5C3]/40'
                    : 'bg-[#1A2040] border border-white/[0.06]'
                } ${bounce && i === glasses - 1 ? 'scale-110' : ''}`}
              >
                <span className="text-sm">{i < glasses ? '💧' : '○'}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={handleRemove} disabled={glasses <= 0 || saving}
              className="flex-1 py-3 rounded-xl border border-white/[0.06] text-sm font-medium text-[#8892B0]
                hover:text-[#F0F2FF] hover:border-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
              − Remove
            </button>
            <button type="button" onClick={handleAdd} disabled={glasses >= 30 || saving}
              className={`flex-1 py-3 rounded-xl bg-[#00E5C3] text-[#0B0E1A] text-sm font-semibold
                hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed
                transition-transform ${bounce ? 'scale-95' : ''}`}>
              + Add glass
            </button>
          </div>
        </div>

        {/* Weekly chart */}
        {history.length > 0 && (
          <div className="glass-card p-5">
            <h2 className="text-sm font-medium text-[#F0F2FF] mb-4 font-dm">This Week</h2>
            <div className="flex items-end gap-2" style={{ height: 120 }}>
              {history.slice(0, 7).reverse().map((item) => {
                const pct = Math.min(Math.round((item.glasses / goal) * 100), 100)
                const barH = Math.max(pct * 0.8, 4)
                return (
                  <div key={item.logged_date} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-mono text-[#8892B0]">{item.glasses}</span>
                    <div className="w-full flex items-end" style={{ height: 80 }}>
                      <div className="w-full rounded-t-lg transition-all duration-500"
                        style={{
                          height: `${barH}%`,
                          backgroundColor: pct >= 100 ? '#00E5C3' : pct >= 50 ? '#00E5C3' : '#FFB830',
                          opacity: pct >= 100 ? 1 : 0.6,
                        }} />
                    </div>
                    <span className="text-[10px] text-[#4A5480] font-dm">{formatDate(item.logged_date)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-medium text-[#F0F2FF] mb-3 font-dm">Hydration Tips</h2>
          <ul className="space-y-2">
            {[
              "Drink a glass of water first thing in the morning",
              "Keep a water bottle on your desk as a reminder",
              "Drink a glass before each meal to help digestion",
              "Set hourly phone reminders if you tend to forget"
            ].map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-[#8892B0] font-dm">
                <span className="text-[#00E5C3] mt-0.5 flex-shrink-0">•</span>
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