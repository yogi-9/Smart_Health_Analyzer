import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { predictDiabetes } from '../api'

export default function Diabetes() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    pregnancies: '',
    glucose: '',
    blood_pressure: '',
    skin_thickness: '',
    insulin: '',
    bmi: profile?.weight && profile?.height
      ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
      : '',
    diabetes_pedigree: '',
    age: profile?.age || '',
  })

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        pregnancies: parseInt(form.pregnancies) || 0,
        glucose: parseFloat(form.glucose),
        blood_pressure: parseFloat(form.blood_pressure),
        skin_thickness: parseFloat(form.skin_thickness) || 0,
        insulin: parseFloat(form.insulin) || 0,
        bmi: parseFloat(form.bmi),
        diabetes_pedigree: parseFloat(form.diabetes_pedigree) || 0.5,
        age: parseInt(form.age),
      }
      const res = await predictDiabetes(payload)
      navigate('/results', { state: { type: 'diabetes', data: res.data } })
    } catch (err) {
      setError('Could not connect to backend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const FIELDS = [
    { key: 'age', label: 'Age', placeholder: 'e.g. 35', type: 'number',
      help: 'Your current age in years' },
    { key: 'glucose', label: 'Glucose Level (mg/dL)', placeholder: 'e.g. 120', type: 'number',
      help: 'Fasting blood sugar. Normal: 70-100, Pre-diabetic: 100-125' },
    { key: 'blood_pressure', label: 'Blood Pressure (mm Hg)', placeholder: 'e.g. 80', type: 'number',
      help: 'Diastolic blood pressure (bottom number). Normal: below 80' },
    { key: 'bmi', label: 'BMI', placeholder: 'e.g. 25.4', type: 'number',
      help: 'Body Mass Index. Normal: 18.5-24.9' },
    { key: 'insulin', label: 'Insulin Level (mu U/ml)', placeholder: 'e.g. 80 (enter 0 if unsure)', type: 'number',
      help: 'Fasting insulin level. Enter 0 if you don\'t know' },
    { key: 'skin_thickness', label: 'Skin Fold Thickness (mm)', placeholder: 'e.g. 20 (enter 0 if unsure)', type: 'number',
      help: 'Triceps skin fold thickness. Enter 0 if unknown' },
    { key: 'pregnancies', label: 'Number of Pregnancies', placeholder: 'e.g. 0', type: 'number',
      help: 'Total number of pregnancies. Enter 0 for males or none' },
    { key: 'diabetes_pedigree', label: 'Diabetes Family History Score', placeholder: 'e.g. 0.5', type: 'number',
      help: '0.0 = no family history, 0.5 = average, 1.0+ = strong family history' },
  ]

  const isValid = form.age && form.glucose && form.blood_pressure && form.bmi

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Link to="/analyze" className="text-[#4A5480] hover:text-[#8892B0] transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
          <div>
            <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Diabetes Risk Check</h1>
            <p className="text-sm text-[#8892B0] mt-0.5 font-dm">
              ML model trained on clinical data
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4 animate-fadeIn">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF3D5A]/10 border border-[#FF3D5A]/30
            text-[#FF3D5A] text-sm font-dm animate-fadeIn">{error}</div>
        )}

        {FIELDS.map(field => (
          <div key={field.key} className="glass-card p-5">
            <label className="block text-xs font-medium text-[#8892B0] mb-1 tracking-wide uppercase font-dm">
              {field.label}
            </label>
            <p className="text-[10px] text-[#4A5480] mb-3 font-dm">{field.help}</p>
            <input
              type={field.type}
              step={field.key === 'diabetes_pedigree' || field.key === 'bmi' ? '0.1' : '1'}
              value={form[field.key]}
              onChange={e => updateField(field.key, e.target.value)}
              placeholder={field.placeholder}
              className="ag-input"
            />
          </div>
        ))}

        <button type="button" onClick={handleSubmit}
          disabled={!isValid || loading}
          className="w-full bg-[#00E5C3] text-[#0B0E1A] py-4 rounded-2xl font-semibold text-sm
            hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150
            disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (
            <><span className="ag-spinner" style={{width:18,height:18,borderWidth:2}} /> Analyzing...</>
          ) : 'Check Diabetes Risk'}
        </button>

        <p className="text-[10px] text-[#4A5480] text-center font-dm pt-2">
          This is a screening tool, not a medical diagnosis.
          Consult your doctor for proper testing.
        </p>
      </div>
    </div>
  )
}