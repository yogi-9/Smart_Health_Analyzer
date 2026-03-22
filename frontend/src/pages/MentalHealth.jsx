import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { analyzeMentalHealth } from '../api'

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
  { value: 0, label: "Not at all", color: '#00E5C3' },
  { value: 1, label: "Several days", color: '#7B61FF' },
  { value: 2, label: "More than half", color: '#FFB830' },
  { value: 3, label: "Nearly every day", color: '#FF3D5A' }
]

export default function MentalHealth() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [phq9, setPhq9] = useState(Array(9).fill(null))
  const [gad7, setGad7] = useState(Array(7).fill(null))

  const answeredCount = phq9.filter(v => v !== null).length + gad7.filter(v => v !== null).length
  const totalQuestions = 16
  const allAnswered = answeredCount === totalQuestions
  const progress = Math.round((answeredCount / totalQuestions) * 100)

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
      const res = await analyzeMentalHealth(payload)
      navigate('/results', { state: { type: 'mental', data: res.data } })
    } catch (err) {
      setError('Could not connect to backend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const renderQuestion = (question, index, answers, setAnswers) => (
    <div key={index} className="glass-card p-5 animate-fadeIn"
      style={{ animationDelay: `${index * 30}ms` }}>
      <p className="text-sm font-medium text-[#F0F2FF] mb-4 font-dm">
        <span className="text-[#00E5C3] font-mono mr-2">{index + 1}.</span>
        {question}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map(opt => (
          <button key={opt.value} type="button"
            onClick={() => {
              const updated = [...answers]
              updated[index] = opt.value
              setAnswers(updated)
            }}
            className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all duration-200 text-left ${
              answers[index] === opt.value
                ? 'text-[#0B0E1A] border-transparent'
                : 'bg-[#1A2040] text-[#8892B0] border-white/[0.06] hover:border-white/20'
            }`}
            style={answers[index] === opt.value ? { backgroundColor: opt.color } : {}}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Link to="/analyze" className="text-[#4A5480] hover:text-[#8892B0] transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </Link>
              <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Mental Health Check</h1>
            </div>
            <p className="text-sm text-[#8892B0] mt-0.5 font-dm ml-6">
              PHQ-9 + GAD-7 · Clinically validated questionnaire
            </p>
          </div>
          <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-[#7B61FF]/10 border border-[#7B61FF]/20 text-[#7B61FF]">
            {answeredCount}/{totalQuestions}
          </span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-[#1A2040] rounded-full overflow-hidden ml-6">
          <div className="h-full bg-[#7B61FF] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4 animate-fadeIn">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF3D5A]/10 border border-[#FF3D5A]/30
            text-[#FF3D5A] text-sm font-dm animate-fadeIn">{error}</div>
        )}

        {/* Part 1 — PHQ-9 */}
        <div className="flex items-center gap-2 pt-2">
          <span className="text-lg">🧠</span>
          <div>
            <h2 className="text-sm font-bold text-[#F0F2FF] font-syne">Part 1 — Depression (PHQ-9)</h2>
            <p className="text-xs text-[#4A5480] font-dm">
              Over the last 2 weeks, how often have you been bothered by:
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {PHQ9_QUESTIONS.map((q, i) => renderQuestion(q, i, phq9, setPhq9))}
        </div>

        {/* Part 2 — GAD-7 */}
        <div className="flex items-center gap-2 pt-6">
          <span className="text-lg">💭</span>
          <div>
            <h2 className="text-sm font-bold text-[#F0F2FF] font-syne">Part 2 — Anxiety (GAD-7)</h2>
            <p className="text-xs text-[#4A5480] font-dm">
              Over the last 2 weeks, how often have you been bothered by:
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {GAD7_QUESTIONS.map((q, i) => renderQuestion(q, i, gad7, setGad7))}
        </div>

        {/* Submit */}
        <button type="button" onClick={handleSubmit}
          disabled={!allAnswered || loading}
          className="w-full bg-[#7B61FF] text-white py-4 rounded-2xl font-semibold text-sm
            hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150
            disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (
            <><span className="ag-spinner" style={{width:18,height:18,borderWidth:2}} /> Analyzing...</>
          ) : allAnswered ? 'Get My Results' : `Answer all ${totalQuestions - answeredCount} remaining questions`}
        </button>

        {/* Disclaimer */}
        <p className="text-[10px] text-[#4A5480] text-center font-dm pt-2">
          This screening is not a diagnosis. If you're struggling, please reach out to a professional.
          <br />iCall helpline: 9152987821
        </p>
      </div>
    </div>
  )
}