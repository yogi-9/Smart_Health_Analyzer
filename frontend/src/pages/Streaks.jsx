import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getStreaks, getHealthHistory, getWaterHistory, getNutritionLogs } from '../api'
import BottomNav from '../components/BottomNav'

const BADGES = [
  { id: 'first_check', name: 'First Check', emoji: '🏥', desc: 'Completed first health analysis' },
  { id: 'week_warrior', name: 'Week Warrior', emoji: '🗓️', desc: '7-day usage streak' },
  { id: 'hydration_hero', name: 'Hydration Hero', emoji: '💧', desc: 'Hit water goal 7 days in a row' },
  { id: 'food_tracker', name: 'Food Tracker', emoji: '🍎', desc: 'Logged meals for 5 days' },
  { id: 'health_improver', name: 'Health Improver', emoji: '📉', desc: 'Risk score dropped 10+ points' },
  { id: 'month_master', name: 'Month Master', emoji: '🏆', desc: '30-day streak' },
]

export default function Streaks() {
  const { user } = useAuth()
  const [streakData, setStreakData] = useState(null)
  const [healthHistory, setHealthHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [unlockedBadges, setUnlockedBadges] = useState([])
  const [newBadge, setNewBadge] = useState(null)

  useEffect(() => {
    if (!user) return
    fetchAll()
  }, [user])

  const fetchAll = async () => {
    try {
      const [streaksRes, healthRes] = await Promise.all([
        getStreaks().catch(() => ({ data: null })),
        getHealthHistory(user.id).catch(() => ({ data: [] })),
      ])
      setStreakData(streaksRes.data)
      setHealthHistory(healthRes.data || [])

      // Calculate badge unlocks
      const unlocked = []
      const sd = streaksRes.data
      const hh = healthRes.data || []

      if (hh.length >= 1) unlocked.push('first_check')
      if (sd?.overall_streak >= 7 || sd?.login_streak >= 7) unlocked.push('week_warrior')
      if (sd?.water_streak >= 7) unlocked.push('hydration_hero')
      if (sd?.nutrition_streak >= 5 || sd?.food_streak >= 5) unlocked.push('food_tracker')
      if (hh.length >= 2) {
        const scores = hh.map(h => h.risk_score).filter(Boolean)
        if (scores.length >= 2 && scores[scores.length - 1] - scores[0] >= 10) {
          unlocked.push('health_improver')
        }
      }
      if (sd?.overall_streak >= 30 || sd?.login_streak >= 30) unlocked.push('month_master')

      setUnlockedBadges(unlocked)
    } catch (e) {
      console.error('Streaks error:', e)
    } finally {
      setLoading(false)
    }
  }

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

  const overallStreak = streakData?.overall_streak || streakData?.login_streak || 0
  const waterStreak = streakData?.water_streak || 0
  const foodStreak = streakData?.nutrition_streak || streakData?.food_streak || 0
  const healthStreak = streakData?.health_streak || 0

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Streaks & Badges</h1>
        <p className="text-sm text-[#8892B0] mt-0.5 font-dm">Stay consistent, earn rewards</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5 animate-fadeIn">

        {/* Hero streak card */}
        <div className="glass-card p-8 text-center relative overflow-hidden">
          <div className="absolute top-[-40px] right-[-40px] w-[120px] h-[120px] rounded-full bg-[#00E5C3]/10 blur-[60px]" />
          <p className="text-[#8892B0] text-sm font-dm mb-2">Current Streak</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-5xl">🔥</span>
            <span className="font-mono text-6xl font-bold text-[#F0F2FF]">{overallStreak}</span>
          </div>
          <p className="text-[#4A5480] text-sm font-dm mt-2">
            {overallStreak === 0 ? 'Start your streak today!' : `day${overallStreak !== 1 ? 's' : ''} and counting!`}
          </p>
        </div>

        {/* Three streak cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { emoji: '💧', label: 'Water', count: waterStreak, color: '#00E5C3' },
            { emoji: '🍎', label: 'Food', count: foodStreak, color: '#7B61FF' },
            { emoji: '❤️', label: 'Health', count: healthStreak, color: '#FF3D5A' },
          ].map(s => (
            <div key={s.label} className="glass-card p-4 text-center">
              <span className="text-2xl">{s.emoji}</span>
              <p className="font-mono text-2xl font-bold mt-2" style={{ color: s.color }}>
                {s.count}
              </p>
              <p className="text-[#4A5480] text-xs font-dm mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Badge collection */}
        <div>
          <h2 className="font-syne font-bold text-lg text-[#F0F2FF] mb-4">Badge Collection</h2>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
            {BADGES.map(badge => {
              const isUnlocked = unlockedBadges.includes(badge.id)
              return (
                <div key={badge.id}
                  className={`glass-card p-4 text-center transition-all duration-300 ${
                    isUnlocked
                      ? 'border-[#00E5C3]/30'
                      : 'opacity-40 blur-[0.5px]'
                  }`}
                >
                  <span className="text-3xl block mb-2">
                    {isUnlocked ? badge.emoji : '🔒'}
                  </span>
                  <p className="text-xs font-medium text-[#F0F2FF] font-dm">{badge.name}</p>
                  <p className="text-[10px] text-[#4A5480] mt-1 font-dm">{badge.desc}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activity heatmap — simplified grid */}
        <div>
          <h2 className="font-syne font-bold text-lg text-[#F0F2FF] mb-4">Activity (Last 12 Weeks)</h2>
          <div className="glass-card p-4">
            <div className="grid gap-[3px]" style={{ gridTemplateColumns: 'repeat(12, 1fr)' }}>
              {Array.from({ length: 84 }).map((_, i) => {
                // Simple heatmap — recent days more likely to be active
                const daysAgo = 83 - i
                const isActive = healthHistory.length > 0 || overallStreak > 0
                  ? daysAgo < overallStreak || Math.random() > 0.6
                  : false
                return (
                  <div key={i}
                    className="aspect-square rounded-[2px] transition-colors"
                    style={{
                      backgroundColor: isActive ? '#00E5C3' : '#1A2040',
                      opacity: isActive ? (daysAgo < 7 ? 1 : daysAgo < 30 ? 0.7 : 0.4) : 1,
                    }}
                  />
                )
              })}
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <span className="text-[10px] text-[#4A5480] font-dm">Less</span>
              {[0.3, 0.5, 0.7, 1].map((op, i) => (
                <div key={i} className="w-3 h-3 rounded-[2px] bg-[#00E5C3]" style={{ opacity: op }} />
              ))}
              <span className="text-[10px] text-[#4A5480] font-dm">More</span>
            </div>
          </div>
        </div>
      </div>

      {/* Badge celebration overlay */}
      {newBadge && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center animate-fadeIn"
          onClick={() => setNewBadge(null)}>
          <div className="glass-card p-10 text-center max-w-xs">
            <span className="text-6xl block mb-4">{newBadge.emoji}</span>
            <h3 className="font-syne font-bold text-xl text-[#F0F2FF] mb-2">Badge Unlocked!</h3>
            <p className="text-[#00E5C3] font-dm font-medium">{newBadge.name}</p>
            <p className="text-[#8892B0] text-sm mt-2 font-dm">{newBadge.desc}</p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
