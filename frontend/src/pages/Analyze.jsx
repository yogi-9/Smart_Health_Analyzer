import { useState } from 'react'
import { predictRisk } from '../api'

export default function Analyze() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const testPredict = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await predictRisk({
        age: 45,
        gender: 1,
        height: 170,
        weight: 85,
        systolic_bp: 135,
        diastolic_bp: 88,
        cholesterol: 210,
        glucose: 105,
        smoking: 0
      })
      setResult(response.data)
    } catch (err) {
      setError('Could not connect to backend')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = {
    Low: 'bg-green-50 text-green-700 border-green-200',
    Medium: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    High: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">
        Health Analyzer
      </h1>
      <p className="text-gray-500 text-sm mb-8">
        Connection test with sample data
      </p>

      <button
        onClick={testPredict}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm
          font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Analyzing...' : 'Test Prediction'}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200
          rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 max-w-md space-y-4">
          <div className={`p-4 rounded-xl border ${riskColor[result.risk_level]}`}>
            <div className="text-xs font-medium uppercase tracking-wide mb-1">
              Risk Level
            </div>
            <div className="text-2xl font-semibold">{result.risk_level}</div>
            <div className="text-sm mt-1">{result.message}</div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-500 mb-3">
              Health Tips
            </div>
            <ul className="space-y-2">
              {result.tips.map((tip, i) => (
                <li key={i} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-500 mb-1">
              Risk Score
            </div>
            <div className="text-3xl font-semibold text-gray-900">
              {result.risk_score}
              <span className="text-sm text-gray-400 font-normal"> / 100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
