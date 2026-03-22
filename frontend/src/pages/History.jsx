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
    Low: 'bg-[#00E5C3]/10 text-[#00E5C3] border-[#00E5C3]/30',
    Medium: 'bg-[#FFB830]/10 text-[#FFB830] border-[#FFB830]/30',
    High: 'bg-[#FF3D5A]/10 text-[#FF3D5A] border-[#FF3D5A]/30',
  }

  const levelColors = {
    Minimal: 'bg-[#00E5C3]/10 text-[#00E5C3] border-[#00E5C3]/30',
    Mild: 'bg-[#FFB830]/10 text-[#FFB830] border-[#FFB830]/30',
    Moderate: 'bg-[#FFB830]/10 text-[#FFB830] border-[#FFB830]/30',
    'Moderately Severe': 'bg-[#FF3D5A]/10 text-[#FF3D5A] border-[#FF3D5A]/30',
    Severe: 'bg-[#FF3D5A]/10 text-[#FF3D5A] border-[#FF3D5A]/30',
  }

  const barColor = (score) => score < 30 ? '#00E5C3' : score < 60 ? '#FFB830' : '#FF3D5A'

  const formatDate = (ts) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Health History</h1>
        <p className="text-sm text-[#8892B0] mt-0.5 font-dm">All your past analyses</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 animate-fadeIn">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['health', 'mental'].map(t => (
            <button key={t} type="button" onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 font-dm ${
                tab === t
                  ? 'bg-[#00E5C3] text-[#0B0E1A] border-[#00E5C3]'
                  : 'bg-transparent text-[#8892B0] border-white/[0.06] hover:border-white/20'
              }`}>
              {t === 'health' ? 'Health Checks' : 'Mental Health'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="glass-card h-24 skeleton-shimmer" />
            ))}
          </div>
        ) : tab === 'health' ? (
          healthHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🌱</span>
              <p className="font-dm text-[#8892B0] text-sm text-center">
                No health analyses yet. Take your first check!
              </p>
              <Link to="/analyze"
                className="px-5 py-2.5 rounded-xl bg-[#00E5C3] text-[#0B0E1A] text-sm font-semibold font-dm
                  hover:scale-[1.02] active:scale-[0.98] transition-transform">
                Start Analysis
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {healthHistory.map((item) => (
                <div key={item.id} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border font-dm
                      ${riskColors[item.risk_level] || riskColors.Low}`}>
                      {item.risk_level} risk
                    </span>
                    <span className="text-xs text-[#4A5480] font-dm">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-3xl font-bold font-mono text-[#F0F2FF]">
                      {item.risk_score}
                    </span>
                    <span className="text-[#4A5480] text-sm mb-1 font-dm">/ 100</span>
                  </div>
                  <div className="h-1.5 bg-[#1A2040] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${item.risk_score}%`, backgroundColor: barColor(item.risk_score) }} />
                  </div>
                  {item.message && (
                    <p className="text-xs text-[#8892B0] mt-2 font-dm">{item.message}</p>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          mentalHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <span className="text-4xl">🧠</span>
              <p className="font-dm text-[#8892B0] text-sm text-center">
                No mental health checks yet.
              </p>
              <Link to="/analyze/mental"
                className="px-5 py-2.5 rounded-xl bg-[#7B61FF] text-white text-sm font-semibold font-dm
                  hover:scale-[1.02] active:scale-[0.98] transition-transform">
                Take Mental Health Check
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {mentalHistory.map((item) => (
                <div key={item.id} className="glass-card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2 flex-wrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border font-dm
                        ${levelColors[item.depression_level] || levelColors.Minimal}`}>
                        {item.depression_level} depression
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border font-dm
                        ${levelColors[item.anxiety_level] || levelColors.Minimal}`}>
                        {item.anxiety_level} anxiety
                      </span>
                    </div>
                    <span className="text-xs text-[#4A5480] font-dm">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-[#4A5480] font-dm">Overall</p>
                      <p className="text-xl font-bold font-mono text-[#F0F2FF]">
                        {item.mental_health_score}
                        <span className="text-xs text-[#4A5480] font-normal font-dm">/100</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#4A5480] font-dm">PHQ-9</p>
                      <p className="text-xl font-bold font-mono text-[#F0F2FF]">
                        {item.phq9_score}
                        <span className="text-xs text-[#4A5480] font-normal font-dm">/27</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[#4A5480] font-dm">GAD-7</p>
                      <p className="text-xl font-bold font-mono text-[#F0F2FF]">
                        {item.gad7_score}
                        <span className="text-xs text-[#4A5480] font-normal font-dm">/21</span>
                      </p>
                    </div>
                  </div>
                  {item.seek_help && (
                    <div className="mt-3 p-2.5 rounded-lg bg-[#FF3D5A]/10 border border-[#FF3D5A]/20">
                      <p className="text-xs text-[#FF3D5A] font-dm">
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
