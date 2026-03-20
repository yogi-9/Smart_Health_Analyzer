 import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProfileSetup() {
  const { updateProfile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({
    full_name: '', age: '', gender: '', height: '', weight: ''
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await updateProfile({
      full_name: form.full_name,
      age: parseInt(form.age),
      gender: form.gender,
      height: parseFloat(form.height),
      weight: parseFloat(form.weight),
    })
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-2xl border border-gray-100 w-full max-w-md">
        <div className="mb-8">
          <div className="w-10 h-10 bg-green-500 rounded-xl mb-4"/>
          <h1 className="text-2xl font-semibold text-gray-900">Set up your profile</h1>
          <p className="text-gray-500 text-sm mt-1">
            This helps us give you accurate health predictions
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input name="full_name" value={form.full_name} onChange={handleChange}
              required placeholder="Yogi Panchal"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input name="age" type="number" value={form.age} onChange={handleChange}
                required placeholder="25" min="1" max="120"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white">
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
              <input name="height" type="number" value={form.height} onChange={handleChange}
                required placeholder="170" min="100" max="250"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input name="weight" type="number" value={form.weight} onChange={handleChange}
                required placeholder="70" min="20" max="300"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm font-medium
              hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2">
            {loading ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}