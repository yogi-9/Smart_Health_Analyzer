import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { predictHeart } from '../api'

export default function Heart() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    age: profile?.age || '',
    sex: profile?.gender === 'male' ? 1 : profile?.gender === 'female' ? 0 : '',
    cp: '',
    trestbps: '',
    chol: '',
    fbs: '',
    restecg: 0,
    thalach: '',
    exang: '',
    oldpeak: '',
    slope: 1,
    ca: '',
    thal: ''
  })

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) =>
          [k, k === 'oldpeak' ? parseFloat(v) : parseInt(v)]
        )
      )
      const res = await predictHeart(payload)
      navigate('/results', { state: { type: 'heart', data: res.data } })
    } catch (err) {
      setError('Could not connect to backend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Toggle button helper
  const ToggleGroup = ({ field, options, columns = 2 }) => (
    <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map(opt => (
        <button key={opt.v} type="button"
          onClick={() => updateField(field, opt.v)}
          className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all duration-200 text-left ${
            form[field] === opt.v
              ? 'bg-[#FF3D5A] text-white border-[#FF3D5A]'
              : 'bg-[#1A2040] text-[#8892B0] border-white/[0.06] hover:border-white/20'
          }`}>
          {opt.l}
        </button>
      ))}
    </div>
  )

  // Input helper
  const InputField = ({ field, label, placeholder, help, step }) => (
    <div className="glass-card p-5">
      <label className="block text-xs font-medium text-[#8892B0] mb-1 tracking-wide uppercase font-dm">
        {label}
      </label>
      {help && <p className="text-[10px] text-[#4A5480] mb-3 font-dm">{help}</p>}
      <input
        type="number"
        step={step || '1'}
        value={form[field]}
        onChange={e => updateField(field, e.target.value)}
        placeholder={placeholder}
        className="ag-input"
      />
    </div>
  )

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
            <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Heart Disease Risk</h1>
            <p className="text-sm text-[#8892B0] mt-0.5 font-dm">
              ML model trained on UCI heart dataset
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4 animate-fadeIn">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF3D5A]/10 border border-[#FF3D5A]/30
            text-[#FF3D5A] text-sm font-dm animate-fadeIn">{error}</div>
        )}

        <InputField field="age" label="Age" placeholder="e.g. 45"
          help="Your age in years" />

        <div className="glass-card p-5">
          <label className="block text-xs font-medium text-[#8892B0] mb-1 tracking-wide uppercase font-dm">Sex</label>
          <p className="text-[10px] text-[#4A5480] mb-3 font-dm">Biological sex</p>
          <ToggleGroup field="sex" options={[{v:1,l:'Male'},{v:0,l:'Female'}]} />
        </div>

        <div className="glass-card p-5">
          <label className="block text-xs font-medium text-[#8892B0] mb-1 tracking-wide uppercase font-dm">
            Chest Pain Type
          </label>
          <p className="text-[10px] text-[#4A5480] mb-3 font-dm">What kind of chest pain do you experience?</p>
          <ToggleGroup field="cp" columns={2} options={[
            {v:0,l:'No pain'},
            {v:1,l:'Mild — typical angina'},
            {v:2,l:'Moderate — atypical'},
            {v:3,l:'Sharp — non-anginal'}
          ]} />
        </div>

        <InputField field="trestbps" label="Resting Blood Pressure (mm Hg)" placeholder="e.g. 130"
          help="Normal: below 120. Measured at rest." />

        <InputField field="chol" label="Cholesterol (mg/dL)" placeholder="e.g. 200"
          help="Total cholesterol. Normal: below 200" />

        <div className="glass-card p-5">
          <label className="block text-xs font-medium text-[#8892B0] mb-1 tracking-wide uppercase font-dm">
            Fasting Blood Sugar &gt; 120 mg/dL?
          </label>
          <p className="text-[10px] text-[#4A5480] mb-3 font-dm">Is your fasting blood sugar above 120?</p>
          <ToggleGroup field="fbs" options={[{v:1,l:'Yes'},{v:0,l:'No'}]} />
        </div>

        <InputField field="thalach" label="Maximum Heart Rate" placeholder="e.g. 150"
          help="Highest heart rate during exercise. Normal: 220 minus your age." />

        <div className="glass-card p-5">
          <label className="block text-xs font-medium text-[#8892B0] mb-1 tracking-wide uppercase font-dm">
            Chest Pain During Exercise?
          </label>
          <p className="text-[10px] text-[#4A5480] mb-3 font-dm">Do you get chest pain when exercising?</p>
          <ToggleGroup field="exang" options={[{v:1,l:'Yes'},{v:0,l:'No'}]} />
        </div>

        <InputField field="oldpeak" label="ST Depression (Oldpeak)" placeholder="e.g. 1.0 (enter 0 if unsure)"
          help="ECG reading. Enter 0 if you don't know this value." step="0.1" />

        <div className="glass-card p-5">
          <label className="block text-xs font-medium text-[#8892B0] mb-1 tracking-wide uppercase font-dm">
            Major Vessels (0-3)
          </label>
          <p className="text-[10px] text-[#4A5480] mb-3 font-dm">Number of major blood vessels colored by fluoroscopy</p>
          <ToggleGroup field="ca" columns={4} options={[
            {v:0,l:'0'},{v:1,l:'1'},{v:2,l:'2'},{v:3,l:'3'}
          ]} />
        </div>

        <div className="glass-card p-5">
          <label className="block text-xs font-medium text-[#8892B0] mb-1 tracking-wide uppercase font-dm">
            Thalassemia
          </label>
          <p className="text-[10px] text-[#4A5480] mb-3 font-dm">Blood disorder type, if known</p>
          <ToggleGroup field="thal" columns={3} options={[
            {v:0,l:'Normal'},{v:1,l:'Fixed defect'},{v:2,l:'Reversible'}
          ]} />
        </div>

        <button type="button" onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#FF3D5A] text-white py-4 rounded-2xl font-semibold text-sm
            hover:scale-[1.01] active:scale-[0.99] transition-transform duration-150
            disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
          {loading ? (
            <><span className="ag-spinner" style={{width:18,height:18,borderWidth:2}} /> Analyzing...</>
          ) : 'Check Heart Disease Risk'}
        </button>

        <p className="text-[10px] text-[#4A5480] text-center font-dm pt-2">
          This screening does not replace medical diagnosis.
          Consult your cardiologist for proper evaluation.
        </p>
      </div>
    </div>
  )
}