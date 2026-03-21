import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuth()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    age: profile?.age || '',
    gender: profile?.gender || '',
    height: profile?.height || '',
    weight: profile?.weight || '',
  })

  const bmi = profile?.height && profile?.weight
    ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
    : null

  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight'
      : bmi < 25 ? 'Normal'
      : bmi < 30 ? 'Overweight'
      : 'Obese'
    : null

  const bmiColor = bmi
    ? bmi < 18.5 ? 'text-blue-600'
      : bmi < 25 ? 'text-green-600'
      : bmi < 30 ? 'text-yellow-600'
      : 'text-red-600'
    : 'text-gray-400'

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await updateProfile({
      full_name: form.full_name,
      age: parseInt(form.age),
      gender: form.gender,
      height: parseFloat(form.height),
      weight: parseFloat(form.weight),
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setEditing(false)
      setTimeout(() => setSuccess(false), 2000)
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-xl
            text-green-700 text-sm text-center">
            Profile updated successfully
          </div>
        )}

        {/* BMI card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-gray-900">Body metrics</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">BMI</p>
              <p className={`text-2xl font-semibold ${bmiColor}`}>{bmi ?? '—'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{bmiCategory ?? 'No data'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Height</p>
              <p className="text-2xl font-semibold text-gray-900">
                {profile?.height ?? '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">cm</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Weight</p>
              <p className="text-2xl font-semibold text-gray-900">
                {profile?.weight ?? '—'}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">kg</p>
            </div>
          </div>
        </div>

        {/* Profile details */}
        {!editing ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-900">Personal info</h2>
              <button onClick={() => setEditing(true)}
                className="text-sm text-blue-600 font-medium hover:underline">
                Edit
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Full name', value: profile?.full_name },
                { label: 'Age', value: profile?.age ? `${profile.age} years` : null },
                { label: 'Gender', value: profile?.gender },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2
                  border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-500">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {item.value ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-6">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Edit profile</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl
                text-red-600 text-sm">{error}</div>
            )}
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full name
                </label>
                <input value={form.full_name}
                  onChange={e => setForm({...form, full_name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200
                    text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Age
                  </label>
                  <input type="number" value={form.age}
                    onChange={e => setForm({...form, age: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gender
                  </label>
                  <select value={form.gender}
                    onChange={e => setForm({...form, gender: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Height (cm)
                  </label>
                  <input type="number" value={form.height}
                    onChange={e => setForm({...form, height: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <input type="number" value={form.weight}
                    onChange={e => setForm({...form, weight: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                      text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200
                    text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white
                    text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sign out */}
        <button onClick={handleLogout}
          className="w-full py-4 rounded-2xl border border-red-200 text-red-500
            text-sm font-medium hover:bg-red-50 transition-colors">
          Sign out
        </button>
      </div>
      <BottomNav />
    </div>
  )
}