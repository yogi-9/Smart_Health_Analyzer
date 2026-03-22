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
    ? bmi < 18.5 ? '#7B61FF'
      : bmi < 25 ? '#00E5C3'
      : bmi < 30 ? '#FFB830'
      : '#FF3D5A'
    : '#4A5480'

  const handleSave = async () => {
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
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Profile</h1>
        <p className="text-sm text-[#8892B0] mt-0.5 font-dm">{user?.email}</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4 animate-fadeIn">

        {/* Success toast */}
        {success && (
          <div className="p-3 rounded-xl bg-[#00E5C3]/10 border border-[#00E5C3]/30
            text-[#00E5C3] text-sm text-center font-dm animate-fadeIn">
            Profile updated successfully
          </div>
        )}

        {/* BMI card */}
        <div className="glass-card p-6">
          <h2 className="text-sm font-medium text-[#F0F2FF] mb-4 font-dm">Body Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-[#4A5480] mb-1 font-dm">BMI</p>
              <p className="text-2xl font-bold font-mono" style={{ color: bmiColor }}>{bmi ?? '—'}</p>
              <p className="text-xs mt-0.5 font-dm" style={{ color: bmiColor }}>{bmiCategory ?? 'No data'}</p>
            </div>
            <div>
              <p className="text-xs text-[#4A5480] mb-1 font-dm">Height</p>
              <p className="text-2xl font-bold font-mono text-[#F0F2FF]">
                {profile?.height ?? '—'}
              </p>
              <p className="text-xs text-[#4A5480] mt-0.5 font-dm">cm</p>
            </div>
            <div>
              <p className="text-xs text-[#4A5480] mb-1 font-dm">Weight</p>
              <p className="text-2xl font-bold font-mono text-[#F0F2FF]">
                {profile?.weight ?? '—'}
              </p>
              <p className="text-xs text-[#4A5480] mt-0.5 font-dm">kg</p>
            </div>
          </div>
        </div>

        {/* Profile details */}
        {!editing ? (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-[#F0F2FF] font-dm">Personal Info</h2>
              <button type="button" onClick={() => setEditing(true)}
                className="text-sm text-[#00E5C3] font-medium hover:underline font-dm">
                Edit
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Full name', value: profile?.full_name },
                { label: 'Age', value: profile?.age ? `${profile.age} years` : null },
                { label: 'Gender', value: profile?.gender },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-white/[0.04] last:border-0">
                  <span className="text-sm text-[#8892B0] font-dm">{item.label}</span>
                  <span className="text-sm font-medium text-[#F0F2FF] capitalize font-dm">
                    {item.value ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-6">
            <h2 className="text-sm font-medium text-[#F0F2FF] mb-4 font-dm">Edit Profile</h2>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-[#FF3D5A]/10 border border-[#FF3D5A]/30 text-[#FF3D5A] text-sm font-dm">
                {error}
              </div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-2 uppercase tracking-wide font-dm">
                  Full name
                </label>
                <input value={form.full_name}
                  onChange={e => setForm({...form, full_name: e.target.value})}
                  className="ag-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8892B0] mb-2 uppercase tracking-wide font-dm">Age</label>
                  <input type="number" value={form.age}
                    onChange={e => setForm({...form, age: e.target.value})}
                    className="ag-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8892B0] mb-2 uppercase tracking-wide font-dm">Gender</label>
                  <div className="flex gap-2">
                    {['male', 'female', 'other'].map(g => (
                      <button key={g} type="button"
                        onClick={() => setForm({...form, gender: g})}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-medium capitalize transition-all ${
                          form.gender === g
                            ? 'bg-[#00E5C3] text-[#0B0E1A]'
                            : 'bg-[#1A2040] text-[#8892B0] border border-white/[0.06]'
                        }`}>
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8892B0] mb-2 uppercase tracking-wide font-dm">Height (cm)</label>
                  <input type="number" value={form.height}
                    onChange={e => setForm({...form, height: e.target.value})}
                    className="ag-input" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8892B0] mb-2 uppercase tracking-wide font-dm">Weight (kg)</label>
                  <input type="number" value={form.weight}
                    onChange={e => setForm({...form, weight: e.target.value})}
                    className="ag-input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl border border-white/[0.06] text-sm font-medium text-[#8892B0]
                    hover:text-[#F0F2FF] hover:border-white/20 transition-colors font-dm">
                  Cancel
                </button>
                <button type="button" onClick={handleSave} disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#00E5C3] text-[#0B0E1A] text-sm font-semibold
                    hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 font-dm">
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sign out (mobile only — desktop has sidebar) */}
        <button type="button" onClick={handleLogout}
          className="w-full py-4 rounded-2xl border border-[#FF3D5A]/30 text-[#FF3D5A]
            text-sm font-medium hover:bg-[#FF3D5A]/10 transition-colors md:hidden font-dm">
          Sign out
        </button>
      </div>
      <BottomNav />
    </div>
  )
}