import { useLocation, useNavigate, Link } from 'react-router-dom'

export default function Results() {
  const { state } = useLocation()
  const navigate = useNavigate()

  if (!state) {
    navigate('/dashboard')
    return null
  }

  const { type, data } = state

  const riskColors = {
    Low: 'bg-green-50 border-green-200 text-green-700',
    Medium: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    High: 'bg-red-50 border-red-200 text-red-700',
    Minimal: 'bg-green-50 border-green-200 text-green-700',
    Mild: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    Moderate: 'bg-orange-50 border-orange-200 text-orange-700',
    'Moderately Severe': 'bg-red-50 border-red-200 text-red-700',
    Severe: 'bg-red-50 border-red-200 text-red-700',
  }

  const titles = {
    mental: 'Mental Health Results',
    diabetes: 'Diabetes Risk Results',
    heart: 'Heart Disease Risk Results'
  }

  const mainLevel = type === 'mental'
    ? data.depression_level
    : data.risk_level

  const mainScore = type === 'mental'
    ? data.mental_health_score
    : data.risk_score

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">{titles[type]}</h1>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">

        {/* Main result card */}
        <div className={`p-6 rounded-2xl border ${riskColors[mainLevel]}`}>
          <p className="text-xs font-medium uppercase tracking-wide mb-1 opacity-70">
            {type === 'mental' ? 'Depression level' : 'Risk level'}
          </p>
          <p className="text-3xl font-semibold mb-1">{mainLevel}</p>
          <p className="text-sm opacity-80">{data.message}</p>
        </div>

        {/* Mental health shows both depression and anxiety */}
        {type === 'mental' && (
          <div className={`p-5 rounded-2xl border ${riskColors[data.anxiety_level]}`}>
            <p className="text-xs font-medium uppercase tracking-wide mb-1 opacity-70">
              Anxiety level
            </p>
            <p className="text-2xl font-semibold">{data.anxiety_level}</p>
          </div>
        )}

        {/* Score */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <p className="text-xs font-medium text-gray-500 mb-1">
            {type === 'mental' ? 'Mental health score' : 'Risk score'}
          </p>
          <div className="flex items-end gap-1">
            <span className="text-4xl font-semibold text-gray-900">
              {mainScore}
            </span>
            <span className="text-gray-400 text-sm mb-1">/ 100</span>
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                mainScore < 30 ? 'bg-green-500'
                : mainScore < 60 ? 'bg-yellow-500'
                : 'bg-red-500'
              }`}
              style={{ width: `${mainScore}%` }}
            />
          </div>
        </div>

        {/* PHQ9/GAD7 scores for mental health */}
        {type === 'mental' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-medium text-gray-500 mb-1">PHQ-9 score</p>
              <p className="text-2xl font-semibold text-gray-900">{data.phq9_score}</p>
              <p className="text-xs text-gray-400 mt-0.5">out of 27</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-medium text-gray-500 mb-1">GAD-7 score</p>
              <p className="text-2xl font-semibold text-gray-900">{data.gad7_score}</p>
              <p className="text-xs text-gray-400 mt-0.5">out of 21</p>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">
            Personalized recommendations
          </h3>
          <ul className="space-y-3">
            {data.tips.map((tip, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700
                  flex items-center justify-center flex-shrink-0 text-xs font-medium mt-0.5">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Seek help banner */}
        {(type === 'mental' && data.seek_help) && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-sm font-medium text-red-700 mb-1">
              Consider speaking with a professional
            </p>
            <p className="text-xs text-red-600">
              iCall helpline: 9152987821 — Free mental health support in India
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Link to="/analyze"
            className="py-3 rounded-2xl border border-gray-200 text-sm font-medium
              text-gray-700 text-center hover:bg-gray-50 transition-colors">
            Take another test
          </Link>
          <Link to="/dashboard"
            className="py-3 rounded-2xl bg-blue-600 text-white text-sm font-medium
              text-center hover:bg-blue-700 transition-colors">
            Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}