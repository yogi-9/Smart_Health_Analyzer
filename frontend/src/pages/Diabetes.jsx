import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import API from '../api'

export default function Diabetes() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [form, setForm] = useState({
    pregnancies: 0,
    glucose: '',
    blood_pressure: profile?.diastolic_bp || '',
    skin_thickness: 20,
    insulin: 0,
    bmi: profile?.height && profile?.weight
      ? parseFloat((profile.weight / ((profile.height/100)**2)).toFixed(1))
      : '',
    diabetes_pedigree: '',
    age: profile?.age || ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        pregnancies: parseInt(form.pregnancies) || 0,
        glucose: parseFloat(form.glucose),
        blood_pressure: parseFloat(form.blood_pressure),
        skin_thickness: parseFloat(form.skin_thickness) || 20,
        insulin: parseFloat(form.insulin) || 0,
        bmi: parseFloat(form.bmi),
        diabetes_pedigree: parseFloat(form.diabetes_pedigree),
        age: parseInt(form.age)
      }
      const res = await API.post('/diabetes/predict', payload)
      navigate('/results', {
        state: { type: 'diabetes', data: res.data }
      })
    } catch (err) {
      setError('Could not connect to backend. Is it running?')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { name: 'pregnancies', label: 'Number of pregnancies', placeholder: '0 (enter 0 if male)', type: 'number' },
    { name: 'glucose', label: 'Glucose level (mg/dL)', placeholder: 'e.g. 120', type: 'number', required: true },
    { name: 'blood_pressure', label: 'Blood pressure — diastolic (mm Hg)', placeholder: 'e.g. 80', type: 'number', required: true },
    { name: 'bmi', label: 'BMI (auto-filled from profile)', placeholder: 'e.g. 24.5', type: 'number', required: true },
    { name: 'diabetes_pedigree', label: 'Family diabetes history score', placeholder: '0.5 = some history, 1.0 = strong history', type: 'number', required: true },
    { name: 'age', label: 'Age', placeholder: 'e.g. 30', type: 'number', required: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Diabetes Risk Check</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          ML model trained on Pima Indians diabetes dataset
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl
            text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(field => (
            <div key={field.name} className="bg-white border border-gray-100 rounded-2xl p-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
              </label>
              <input
                name={field.name}
                type={field.type}
                value={form[field.name]}
                onChange={handleChange}
                required={field.required}
                placeholder={field.placeholder}
                step="any"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  focus:border-transparent"
              />
            </div>
          ))}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-medium
              hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? 'Analyzing...' : 'Check diabetes risk'}
          </button>
        </form>
      </div>
    </div>
  )
}