import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling/staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself or that you're a failure",
  "Trouble concentrating on things",
  "Moving or speaking slowly — or being fidgety/restless",
  "Thoughts that you would be better off dead"
]

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious, or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it's hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid, as if something awful might happen"
]

const OPTIONS = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" }
]

export default function MentalHealth() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [phq9, setPhq9] = useState(Array(9).fill(null))
  const [gad7, setGad7] = useState(Array(7).fill(null))

  const allAnswered = phq9.every(v => v !== null) &&
                      gad7.every(v => v !== null)

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        phq9_q1: phq9[0], phq9_q2: phq9[1], phq9_q3: phq9[2],
        phq9_q4: phq9[3], phq9_q5: phq9[4], phq9_q6: phq9[5],
        phq9_q7: phq9[6], phq9_q8: phq9[7], phq9_q9: phq9[8],
        gad7_q1: gad7[0], gad7_q2: gad7[1], gad7_q3: gad7[2],
        gad7_q4: gad7[3], gad7_q5: gad7[4], gad7_q6: gad7[5],
        gad7_q7: gad7[6]
      }
      const res = await API.post('/mental/analyze', payload)
      navigate('/results', {
        state: { type: 'mental', data: res.data }
      })
    } catch (err) {
      setError('Could not connect to backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Mental Health Check</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          PHQ-9 + GAD-7 — clinically validated questionnaire
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl
            text-red-600 text-sm">{error}</div>
        )}

        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Part 1 — Depression screening (PHQ-9)
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Over the last 2 weeks, how often have you been bothered by the following?
          </p>

          <div className="space-y-6">
            {PHQ9_QUESTIONS.map((q, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-sm font-medium text-gray-800 mb-4">
                  {i + 1}. {q}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const updated = [...phq9]
                        updated[i] = opt.value
                        setPhq9(updated)
                      }}
                      className={`py-2 px-3 rounded-xl text-sm font-medium
                        border transition-colors text-left ${
                        phq9[i] === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-1">
            Part 2 — Anxiety screening (GAD-7)
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Over the last 2 weeks, how often have you been bothered by the following?
          </p>

          <div className="space-y-6">
            {GAD7_QUESTIONS.map((q, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-sm font-medium text-gray-800 mb-4">
                  {i + 1}. {q}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const updated = [...gad7]
                        updated[i] = opt.value
                        setGad7(updated)
                      }}
                      className={`py-2 px-3 rounded-xl text-sm font-medium
                        border transition-colors text-left ${
                        gad7[i] === opt.value
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allAnswered || loading}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium
            hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed
            transition-colors"
        >
          {loading ? 'Analyzing...' : allAnswered
            ? 'Get my results'
            : `Answer all questions to continue`}
        </button>
      </div>
    </div>
  )
}