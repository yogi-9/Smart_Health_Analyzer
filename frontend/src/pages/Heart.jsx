import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) =>
          [k, k === 'oldpeak' ? parseFloat(v) : parseInt(v)]
        )
      )
      const res = await predictHeart(payload)
      navigate('/results', {
        state: { type: 'heart', data: res.data }
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
        <h1 className="text-lg font-semibold text-gray-900">Heart Disease Risk Check</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          ML model trained on UCI heart disease dataset
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl
            text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
            <input name="age" type="number" value={form.age} onChange={handleChange}
              required placeholder="e.g. 45"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Sex</label>
            <div className="grid grid-cols-2 gap-3">
              {[{v:1,l:'Male'},{v:0,l:'Female'}].map(opt => (
                <button type="button" key={opt.v}
                  onClick={() => setForm({...form, sex: opt.v})}
                  className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                    form.sex === opt.v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chest pain type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {v:0,l:'No pain'},
                {v:1,l:'Mild — typical angina'},
                {v:2,l:'Moderate — atypical'},
                {v:3,l:'Sharp — non-anginal'}
              ].map(opt => (
                <button type="button" key={opt.v}
                  onClick={() => setForm({...form, cp: opt.v})}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors text-left ${
                    form.cp === opt.v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resting blood pressure (mm Hg)
            </label>
            <input name="trestbps" type="number" value={form.trestbps}
              onChange={handleChange} required placeholder="e.g. 130"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cholesterol (mg/dL)
            </label>
            <input name="chol" type="number" value={form.chol}
              onChange={handleChange} required placeholder="e.g. 200"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fasting blood sugar above 120 mg/dL?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[{v:1,l:'Yes'},{v:0,l:'No'}].map(opt => (
                <button type="button" key={opt.v}
                  onClick={() => setForm({...form, fbs: opt.v})}
                  className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                    form.fbs === opt.v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum heart rate achieved
            </label>
            <input name="thalach" type="number" value={form.thalach}
              onChange={handleChange} required placeholder="e.g. 150"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chest pain during exercise?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[{v:1,l:'Yes'},{v:0,l:'No'}].map(opt => (
                <button type="button" key={opt.v}
                  onClick={() => setForm({...form, exang: opt.v})}
                  className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                    form.exang === opt.v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ST depression (oldpeak)
            </label>
            <input name="oldpeak" type="number" step="0.1" value={form.oldpeak}
              onChange={handleChange} required placeholder="e.g. 1.0 (enter 0 if unsure)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of major vessels (0-3)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[0,1,2,3].map(v => (
                <button type="button" key={v}
                  onClick={() => setForm({...form, ca: v})}
                  className={`py-3 rounded-xl text-sm font-medium border transition-colors ${
                    form.ca === v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thalassemia
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[{v:0,l:'Normal'},{v:1,l:'Fixed defect'},{v:2,l:'Reversible'}].map(opt => (
                <button type="button" key={opt.v}
                  onClick={() => setForm({...form, thal: opt.v})}
                  className={`py-2 px-3 rounded-xl text-sm font-medium border transition-colors ${
                    form.thal === opt.v
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium
              hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Analyzing...' : 'Check heart disease risk'}
          </button>
        </form>
      </div>
    </div>
  )
}