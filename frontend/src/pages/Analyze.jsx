import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'
import { supabase } from '../lib/supabase'

// ─── Tooltip Component ──────────────────────────────────────────────
function Tooltip({ text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-block ml-1.5">
      <button type="button" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="w-4 h-4 rounded-full bg-[#1A2040] border border-white/10 text-[#4A5480] text-[10px] font-bold inline-flex items-center justify-center hover:text-[#00E5C3] hover:border-[#00E5C3]/30 transition-colors">
        ?
      </button>
      {show && (
        <div className="absolute z-50 bottom-6 left-1/2 -translate-x-1/2 w-52 p-2.5 rounded-lg bg-[#1A2040] border border-white/10 text-[#8892B0] text-xs font-dm leading-relaxed shadow-lg animate-fadeIn">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1A2040] rotate-45 border-r border-b border-white/10" />
        </div>
      )}
    </span>
  )
}

const TOOLTIPS = {
  systolic_bp: 'The top number when you check blood pressure. Normal is around 120.',
  diastolic_bp: 'The bottom number when you check blood pressure. Normal is around 80.',
  cholesterol: 'Total cholesterol level in your blood. Normal is below 200 mg/dL.',
  glucose: 'Blood sugar level. Normal fasting level is 70-100 mg/dL.',
}

// ─── RiskGauge Component (SVG radial arc) ───────────────────────────
function RiskGauge({ score, riskLevel }) {
  const [displayScore, setDisplayScore] = useState(0)
  const animRef = useRef(null)

  // Color based on score range
  const getColor = (s) => {
    if (s <= 33) return '#00E5C3'  // teal
    if (s <= 66) return '#FFB830'  // amber
    return '#FF3D5A'               // red
  }

  const color = getColor(score)
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75 // 270° arc
  const offset = arcLength - (arcLength * displayScore / 100)

  // Count-up animation
  useEffect(() => {
    const start = performance.now()
    const duration = 800
    const animate = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out curve
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(score * eased))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate)
      }
    }
    animRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animRef.current)
  }, [score])

  const glowMap = {
    Low: '0 0 30px rgba(0, 229, 195, 0.4)',
    Medium: '0 0 30px rgba(255, 184, 48, 0.4)',
    High: '0 0 30px rgba(255, 61, 90, 0.5)',
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 220, height: 190 }}>
        <svg width="220" height="190" viewBox="0 0 220 210" className="overflow-visible">
          {/* Background arc */}
          <circle
            cx="110" cy="110" r={radius}
            fill="none"
            stroke="#1A2040"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            transform="rotate(135 110 110)"
          />
          {/* Score arc */}
          <circle
            cx="110" cy="110" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={offset}
            transform="rotate(135 110 110)"
            style={{
              filter: `drop-shadow(${glowMap[riskLevel] || glowMap.Low})`,
              transition: 'stroke-dashoffset 0.1s linear'
            }}
          />
        </svg>
        {/* Center score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 10 }}>
          <span className="font-mono text-5xl font-bold" style={{ color }}>
            {displayScore}
          </span>
          <span className="text-[#8892B0] text-xs mt-1 font-dm tracking-wide">/ 100</span>
        </div>
      </div>
    </div>
  )
}

// ─── RiskBadge ──────────────────────────────────────────────────────
function RiskBadge({ level }) {
  const styles = {
    Low: 'bg-[#00E5C3]/10 text-[#00E5C3] border-[#00E5C3]/30 shadow-[0_0_20px_rgba(0,229,195,0.3)]',
    Medium: 'bg-[#FFB830]/10 text-[#FFB830] border-[#FFB830]/30 shadow-[0_0_20px_rgba(255,184,48,0.3)]',
    High: 'bg-[#FF3D5A]/10 text-[#FF3D5A] border-[#FF3D5A]/30 shadow-[0_0_20px_rgba(255,61,90,0.4)]',
  }
  return (
    <span className={`inline-flex px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border ${styles[level] || styles.Low}`}>
      {level} Risk
    </span>
  )
}

// ─── TipCard ────────────────────────────────────────────────────────
function TipCard({ tip, index }) {
  return (
    <div
      className="glass-card p-4 flex items-start gap-3 animate-fadeIn"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="w-6 h-6 rounded-full bg-[#00E5C3]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00E5C3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <p className="text-sm text-[#8892B0] font-dm leading-relaxed">{tip}</p>
    </div>
  )
}

// ─── StepProgress ───────────────────────────────────────────────────
function StepProgress({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isDone = stepNum < current
        return (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
              isDone
                ? 'bg-[#00E5C3] text-[#0B0E1A]'
                : isActive
                  ? 'bg-[#00E5C3]/20 text-[#00E5C3] border border-[#00E5C3]/50'
                  : 'bg-[#1A2040] text-[#4A5480]'
            }`}>
              {isDone ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : stepNum}
            </div>
            {i < total - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-colors duration-300 ${
                isDone ? 'bg-[#00E5C3]' : 'bg-[#1A2040]'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Validation ─────────────────────────────────────────────────────
const VALIDATION = {
  1: {
    age: { min: 18, max: 120, label: 'Age' },
    height: { min: 100, max: 250, label: 'Height (cm)' },
    weight: { min: 30, max: 300, label: 'Weight (kg)' },
    gender: { values: [0, 1], label: 'Gender' },
  },
  2: {
    smoking: { values: [0, 1], label: 'Smoking' },
    exercise: { values: [0, 1, 2], label: 'Exercise' },
    diet: { values: [0, 1, 2], label: 'Diet' },
    stress: { values: [0, 1, 2], label: 'Stress' },
  },
}

// Auto-estimate medical values from lifestyle for the backend
function estimateMedicalValues(formData) {
  const age = Number(formData.age)
  const bmi = Number(formData.weight) / ((Number(formData.height) / 100) ** 2)
  const smokes = Number(formData.smoking) === 1
  const exercise = Number(formData.exercise)   // 0=none, 1=some, 2=regular
  const diet = Number(formData.diet)           // 0=unhealthy, 1=okay, 2=healthy
  const stress = Number(formData.stress)       // 0=low, 1=moderate, 2=high

  // Base BP from age
  let systolic = 110 + (age - 25) * 0.5
  let diastolic = 70 + (age - 25) * 0.3
  // Adjust for lifestyle
  if (smokes) { systolic += 10; diastolic += 5 }
  if (bmi > 30) { systolic += 8; diastolic += 4 }
  if (exercise === 0) { systolic += 5; diastolic += 3 }
  if (exercise === 2) { systolic -= 5; diastolic -= 3 }
  if (stress === 2) { systolic += 8; diastolic += 5 }

  // Cholesterol from age + diet
  let cholesterol = 170 + (age - 25) * 0.8
  if (diet === 0) cholesterol += 30
  if (diet === 2) cholesterol -= 15
  if (smokes) cholesterol += 15
  if (bmi > 30) cholesterol += 20

  // Glucose from lifestyle
  let glucose = 85 + (age - 25) * 0.3
  if (diet === 0) glucose += 15
  if (exercise === 0) glucose += 10
  if (bmi > 30) glucose += 15
  if (stress === 2) glucose += 8

  return {
    systolic_bp: Math.round(Math.max(90, Math.min(200, systolic))),
    diastolic_bp: Math.round(Math.max(55, Math.min(120, diastolic))),
    cholesterol: Math.round(Math.max(120, Math.min(350, cholesterol))),
    glucose: Math.round(Math.max(65, Math.min(300, glucose))),
  }
}

function validateStep(step, data) {
  const rules = VALIDATION[step]
  const errors = {}
  for (const [field, rule] of Object.entries(rules)) {
    const val = Number(data[field])
    if (data[field] === '' || data[field] === null || data[field] === undefined) {
      errors[field] = `${rule.label} is required`
    } else if (rule.values && !rule.values.includes(val)) {
      errors[field] = `Invalid ${rule.label}`
    } else if (rule.min !== undefined && (val < rule.min || val > rule.max)) {
      errors[field] = `${rule.label} must be ${rule.min}–${rule.max}`
    }
  }
  return errors
}

// ─── Step Headers ───────────────────────────────────────────────────
const STEP_META = [
  { title: 'Tell us about you', desc: 'Basic personal information' },
  { title: 'Your daily habits', desc: 'Simple questions about your lifestyle' },
]

// ─── Result Messages ────────────────────────────────────────────────
const RESULT_COPY = {
  Low: "You're in good shape. Here's how to stay that way.",
  Medium: 'Some areas need attention. Small changes, big impact.',
  High: 'Your health needs immediate attention. Here\'s your action plan.',
}

// ─── Main Component ─────────────────────────────────────────────────
export default function Analyze() {
  const { user, profile } = useAuth()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    age: profile?.age || '',
    gender: profile?.gender ?? '',
    height: profile?.height || '',
    weight: profile?.weight || '',
    smoking: '',
    exercise: '',
    diet: '',
    stress: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState(null)
  const [slideDir, setSlideDir] = useState('left') // animation direction

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  const goNext = () => {
    const errs = validateStep(step, formData)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setErrors({})
    setSlideDir('left')
    setStep(s => s + 1)
  }

  const goBack = () => {
    setErrors({})
    setSlideDir('right')
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    const errs = validateStep(step, formData)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setLoading(true)
    setApiError(null)
    try {
      // Estimate medical values from lifestyle answers
      const estimated = estimateMedicalValues(formData)
      const bmi = Number((Number(formData.weight) / ((Number(formData.height) / 100) ** 2)).toFixed(1))
      // Map to the backend's /diabetes/predict endpoint fields
      const payload = {
        pregnancies: 0,
        glucose: estimated.glucose,
        blood_pressure: estimated.diastolic_bp,
        skin_thickness: 0,
        insulin: 0,
        bmi: bmi,
        diabetes_pedigree: 0.5,
        age: Number(formData.age),
        user_id: user?.id || null,
      }
      const res = await API.post('/diabetes/predict', payload)
      setResult(res.data)
      // Save to Supabase predictions table
      if (user) {
        await supabase.from('predictions').insert({
          user_id: user.id,
          risk_score: res.data.risk_score,
          risk_level: res.data.risk_level,
          message: res.data.message,
          age: payload.age,
          bmi,
          systolic_bp: estimated.systolic_bp,
          cholesterol: estimated.cholesterol,
          glucose: estimated.glucose,
          smoking: Number(formData.smoking),
        }).then(({ error }) => { if (error) console.warn('Save prediction:', error.message) })
      }
      setStep(3) // result step (step 1 = personal, step 2 = lifestyle, step 3 = results)
    } catch (e) {
      setApiError(e.response?.data?.detail || e.message || 'Prediction failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setStep(1)
    setResult(null)
    setApiError(null)
    setErrors({})
    setFormData({
      age: profile?.age || '',
      gender: profile?.gender ?? '',
      height: profile?.height || '',
      weight: profile?.weight || '',
      smoking: '',
      exercise: '',
      diet: '',
      stress: '',
    })
  }

  // ─── Input helper ─────────────────────────────────────────────────
  const renderInput = (field, label, placeholder, type = 'number') => (
    <div>
      <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">
        {label}
        {TOOLTIPS[field] && <Tooltip text={TOOLTIPS[field]} />}
      </label>
      <input
        type={type}
        value={formData[field]}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        className={`ag-input ${errors[field] ? 'border-b-[#FF3D5A]' : ''}`}
      />
      {errors[field] && (
        <p className="text-[#FF3D5A] text-xs mt-1.5 font-dm animate-fadeIn">{errors[field]}</p>
      )}
    </div>
  )

  // ─── Select helper for binary fields ──────────────────────────────
  const renderToggle = (field, label, options) => (
    <div>
      <label className="block text-xs font-medium text-[#8892B0] mb-3 tracking-wide uppercase font-dm">
        {label}
      </label>
      <div className="flex gap-3">
        {options.map(opt => {
          const isSelected = formData[field] !== '' && formData[field] !== null && formData[field] !== undefined && Number(formData[field]) === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateField(field, opt.value)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-[#00E5C3] text-[#0B0E1A]'
                  : 'bg-[#1A2040] text-[#8892B0] hover:text-[#F0F2FF] border border-white/[0.06]'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
      {errors[field] && (
        <p className="text-[#FF3D5A] text-xs mt-1.5 font-dm animate-fadeIn">{errors[field]}</p>
      )}
    </div>
  )

  // ─── Result View ──────────────────────────────────────────────────
  if (step === 3 && result) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] pb-28">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <h1 className="font-syne font-bold text-2xl text-[#F0F2FF]">Your Health Risk Analysis</h1>
          <p className="text-sm text-[#8892B0] mt-1 font-dm">
            {RESULT_COPY[result.risk_level] || RESULT_COPY.Low}
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-8 space-y-6 animate-fadeIn">
          {/* Gauge + Badge */}
          <div className="glass-card p-8 flex flex-col items-center">
            <RiskGauge score={result.risk_score} riskLevel={result.risk_level} />
            <div className="mt-4">
              <RiskBadge level={result.risk_level} />
            </div>
            <p className="text-[#8892B0] text-sm mt-4 text-center font-dm max-w-xs">
              {result.message}
            </p>
          </div>

          {/* BMI — the only accurately calculated stat */}
          {(() => {
            const bmi = (Number(formData.weight) / ((Number(formData.height) / 100) ** 2)).toFixed(1)
            const bmiCategory = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
            const bmiColor = bmi < 18.5 ? '#FFB830' : bmi < 25 ? '#00E5C3' : bmi < 30 ? '#FFB830' : '#FF3D5A'
            return (
              <div className="glass-card p-6 flex items-center gap-6">
                <div>
                  <p className="text-xs text-[#4A5480] mb-1 font-dm">Your BMI</p>
                  <p className="text-4xl font-bold font-mono" style={{ color: bmiColor }}>{bmi}</p>
                  <p className="text-sm font-medium mt-1" style={{ color: bmiColor }}>{bmiCategory}</p>
                </div>
                <div className="flex-1 h-3 bg-[#1A2040] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min((bmi / 40) * 100, 100)}%`,
                      backgroundColor: bmiColor,
                    }}
                  />
                </div>
              </div>
            )
          })()}

          {/* Tips */}
          {result.tips && result.tips.length > 0 && (
            <div>
              <h2 className="font-syne font-bold text-lg text-[#F0F2FF] mb-4">
                Recommended Actions
              </h2>
              <div className="space-y-3">
                {result.tips.map((tip, i) => (
                  <TipCard key={i} tip={tip} index={i} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex-1 bg-[#00E5C3] text-[#0B0E1A] font-semibold py-3.5 rounded-xl
                text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              Run Another Analysis
            </button>
            <Link
              to="/dashboard"
              className="flex-1 border border-[#00E5C3]/30 text-[#00E5C3] font-semibold py-3.5 rounded-xl
                text-sm text-center hover:bg-[#00E5C3]/5 transition-colors duration-200"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // ─── Form View ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-28">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h1 className="font-syne font-bold text-2xl text-[#F0F2FF]">Health Analysis</h1>
        <p className="text-sm text-[#8892B0] mt-1 font-dm">
          {STEP_META[step - 1]?.desc || 'Complete the analysis'}
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        <StepProgress current={step} total={2} />

        {/* Step Title */}
        <h2 className="font-syne font-bold text-xl text-[#F0F2FF] mb-6">
          {STEP_META[step - 1]?.title}
        </h2>

        {/* API Error Toast */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-[#FF3D5A]/10 border border-[#FF3D5A]/30 text-[#FF3D5A] text-sm font-dm animate-fadeIn">
            {apiError}
          </div>
        )}

        {/* Step 1 — Personal */}
        {step === 1 && (
          <div className={`glass-card p-6 space-y-6 ${slideDir === 'left' ? 'animate-slideLeft' : 'animate-slideRight'}`}
               key="step-1">
            {renderInput('age', 'Age', 'e.g. 35')}
            {renderToggle('gender', 'Gender', [
              { value: 0, label: 'Female' },
              { value: 1, label: 'Male' },
            ])}
            <div className="grid grid-cols-2 gap-4">
              {renderInput('height', 'Height (cm)', 'e.g. 170')}
              {renderInput('weight', 'Weight (kg)', 'e.g. 75')}
            </div>
          </div>
        )}

        {/* Step 2 — Lifestyle (simple questions) */}
        {step === 2 && (
          <div className={`glass-card p-6 space-y-6 ${slideDir === 'left' ? 'animate-slideLeft' : 'animate-slideRight'}`}
               key="step-2">
            {renderToggle('smoking', 'Do you smoke?', [
              { value: 0, label: '🚭 No' },
              { value: 1, label: '🚬 Yes' },
            ])}
            {renderToggle('exercise', 'How often do you exercise?', [
              { value: 0, label: '😴 Rarely' },
              { value: 1, label: '🚶 Sometimes' },
              { value: 2, label: '🏃 Regularly' },
            ])}
            {renderToggle('diet', 'How would you describe your diet?', [
              { value: 0, label: '🍔 Not great' },
              { value: 1, label: '🍳 Okay' },
              { value: 2, label: '🥗 Very healthy' },
            ])}
            {renderToggle('stress', 'How stressed are you day-to-day?', [
              { value: 0, label: '😌 Low' },
              { value: 1, label: '😐 Moderate' },
              { value: 2, label: '😰 High' },
            ])}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-8">
          {step > 1 && (
            <button
              type="button"
              onClick={goBack}
              className="flex-1 border border-white/[0.06] text-[#8892B0] font-medium py-3.5 rounded-xl
                text-sm hover:text-[#F0F2FF] hover:border-white/20 transition-all duration-200"
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 bg-[#00E5C3] text-[#0B0E1A] font-semibold py-3.5 rounded-xl
                text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[#00E5C3] text-[#0B0E1A] font-semibold py-3.5 rounded-xl
                text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="ag-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  <span>Analyzing...</span>
                </>
              ) : (
                'Get Your Risk Score'
              )}
            </button>
          )}
        </div>

        {/* Quick access to other analysis modules */}
        <div className="mt-12 pt-8 border-t border-white/[0.06]">
          <h3 className="font-syne font-semibold text-sm text-[#4A5480] mb-4 uppercase tracking-wider">
            Other Analysis Modules
          </h3>
          <div className="space-y-3">
            {[
              { to: '/analyze/mental', title: 'Mental Health Check', desc: 'PHQ-9 + GAD-7 questionnaire', dot: 'bg-[#7B61FF]' },
            ].map(m => (
              <Link
                key={m.to}
                to={m.to}
                className="glass-card block p-4 hover:shadow-[0_0_20px_rgba(0,229,195,0.15)] transition-shadow duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${m.dot} flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-[#F0F2FF]">{m.title}</p>
                    <p className="text-xs text-[#4A5480] mt-0.5">{m.desc}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}