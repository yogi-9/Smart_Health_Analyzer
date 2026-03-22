import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useEffect } from 'react'

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!state) navigate('/dashboard')
  }, [state, navigate])

  if (!state) return null

  const { type, data } = state

  const riskColors = {
    Low: 'bg-[#00E5C3]/10 border-[#00E5C3]/30 text-[#00E5C3]',
    Medium: 'bg-[#FFB830]/10 border-[#FFB830]/30 text-[#FFB830]',
    High: 'bg-[#FF3D5A]/10 border-[#FF3D5A]/30 text-[#FF3D5A]',
    Minimal: 'bg-[#00E5C3]/10 border-[#00E5C3]/30 text-[#00E5C3]',
    Mild: 'bg-[#FFB830]/10 border-[#FFB830]/30 text-[#FFB830]',
    Moderate: 'bg-[#FFB830]/10 border-[#FFB830]/30 text-[#FFB830]',
    'Moderately Severe': 'bg-[#FF3D5A]/10 border-[#FF3D5A]/30 text-[#FF3D5A]',
    Severe: 'bg-[#FF3D5A]/10 border-[#FF3D5A]/30 text-[#FF3D5A]',
  }

  const glowColors = {
    Low: 'rgba(0, 229, 195, 0.3)',
    Medium: 'rgba(255, 184, 48, 0.3)',
    High: 'rgba(255, 61, 90, 0.3)',
    Minimal: 'rgba(0, 229, 195, 0.3)',
    Mild: 'rgba(255, 184, 48, 0.3)',
    Moderate: 'rgba(255, 184, 48, 0.3)',
    'Moderately Severe': 'rgba(255, 61, 90, 0.3)',
    Severe: 'rgba(255, 61, 90, 0.3)',
  }

  const titles = {
    mental: 'Mental Health Results',
    diabetes: 'Diabetes Risk Results',
    heart: 'Heart Disease Risk Results',
  }

  const emoji = {
    mental: '🧠',
    diabetes: '🩸',
    heart: '❤️',
  }

  const mainLevel = type === 'mental' ? data.depression_level : data.risk_level
  const mainScore = type === 'mental' ? data.mental_health_score : data.risk_score
  const barColor = mainScore < 30 ? '#00E5C3' : mainScore < 60 ? '#FFB830' : '#FF3D5A'

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{emoji[type]}</span>
          <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">{titles[type]}</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-5 animate-fadeIn">

        {/* Main result card */}
        <div className={`p-6 rounded-2xl border ${riskColors[mainLevel]}`}
          style={{ boxShadow: `0 0 40px ${glowColors[mainLevel]}` }}>
          <p className="text-xs font-medium uppercase tracking-wide mb-1 opacity-70 font-dm">
            {type === 'mental' ? 'Depression Level' : 'Risk Level'}
          </p>
          <p className="text-3xl font-bold font-syne">{mainLevel}</p>
          <p className="text-sm opacity-80 mt-2 font-dm">{data.message}</p>
        </div>

        {/* Anxiety badge for mental */}
        {type === 'mental' && (
          <div className={`p-5 rounded-2xl border ${riskColors[data.anxiety_level]}`}>
            <p className="text-xs font-medium uppercase tracking-wide mb-1 opacity-70 font-dm">
              Anxiety Level
            </p>
            <p className="text-2xl font-bold font-syne">{data.anxiety_level}</p>
          </div>
        )}

        {/* Score bar */}
        <div className="glass-card p-6">
          <p className="text-xs font-medium text-[#8892B0] mb-1 font-dm">
            {type === 'mental' ? 'Mental Health Score' : 'Risk Score'}
          </p>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-bold font-mono text-[#F0F2FF]">{mainScore}</span>
            <span className="text-[#4A5480] text-sm mb-1 font-dm">/ 100</span>
          </div>
          <div className="mt-3 h-2.5 bg-[#1A2040] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${mainScore}%`, backgroundColor: barColor }} />
          </div>
        </div>

        {/* PHQ-9 / GAD-7 scores for mental */}
        {type === 'mental' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-[#8892B0] mb-1 font-dm">PHQ-9 Score</p>
              <p className="text-2xl font-bold font-mono text-[#F0F2FF]">{data.phq9_score}</p>
              <p className="text-xs text-[#4A5480] mt-0.5 font-dm">out of 27</p>
            </div>
            <div className="glass-card p-5">
              <p className="text-xs font-medium text-[#8892B0] mb-1 font-dm">GAD-7 Score</p>
              <p className="text-2xl font-bold font-mono text-[#F0F2FF]">{data.gad7_score}</p>
              <p className="text-xs text-[#4A5480] mt-0.5 font-dm">out of 21</p>
            </div>
          </div>
        )}

        {/* Tips */}
        {data.tips && data.tips.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-[#F0F2FF] mb-4 font-syne">
              Personalized Recommendations
            </h3>
            <ul className="space-y-3">
              {data.tips.map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-[#8892B0] font-dm"
                  style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="w-5 h-5 rounded-full bg-[#00E5C3]/10 text-[#00E5C3]
                    flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 font-mono">
                    {i + 1}
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Helpline for mental */}
        {type === 'mental' && data.seek_help && (
          <div className="p-4 rounded-2xl bg-[#FF3D5A]/10 border border-[#FF3D5A]/30">
            <p className="text-sm font-medium text-[#FF3D5A] mb-1 font-dm">
              💛 Consider speaking with a professional
            </p>
            <p className="text-xs text-[#FF3D5A]/80 font-dm">
              iCall helpline: 9152987821 — Free mental health support in India
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link to="/analyze"
            className="py-3.5 rounded-2xl border border-white/[0.06] text-sm font-medium
              text-[#8892B0] text-center hover:text-[#F0F2FF] hover:border-white/20 transition-colors font-dm">
            Take Another Test
          </Link>
          <Link to="/dashboard"
            className="py-3.5 rounded-2xl bg-[#00E5C3] text-[#0B0E1A] text-sm font-semibold
              text-center hover:scale-[1.02] active:scale-[0.98] transition-transform font-dm">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}