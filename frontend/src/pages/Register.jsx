import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'

export default function Register() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [shake, setShake] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  // Password strength calculator
  const getStrength = (pw) => {
    if (!pw) return { level: 0, label: '', color: '' }
    let score = 0
    if (pw.length >= 6) score++
    if (pw.length >= 10) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    if (score <= 2) return { level: 1, label: 'Weak', color: '#FF3D5A' }
    if (score <= 3) return { level: 2, label: 'Medium', color: '#FFB830' }
    return { level: 3, label: 'Strong', color: '#00E5C3' }
  }

  const strength = getStrength(password)

  const validate = () => {
    const errs = {}
    if (!fullName.trim()) errs.fullName = 'Full name is required'
    if (!email.trim()) errs.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Enter a valid email'
    if (!password) errs.password = 'Password is required'
    else if (password.length < 6) errs.password = 'Password must be at least 6 characters'
    if (!confirm) errs.confirm = 'Please confirm your password'
    else if (password !== confirm) errs.confirm = 'Passwords do not match'
    return errs
  }

  const handleSubmit = async () => {
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      setShake(true)
      setTimeout(() => setShake(false), 350)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const { error: signUpErr } = await signUp(email, password)
      if (signUpErr) {
        setErrors({ general: signUpErr.message })
        setShake(true)
        setTimeout(() => setShake(false), 350)
        setLoading(false)
        return
      }
      // Save full name to profiles table
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          full_name: fullName.trim(),
          updated_at: new Date().toISOString()
        })
      }
      navigate('/analyze')
    } catch (e) {
      setErrors({ general: e.message || 'Something went wrong' })
      setShake(true)
      setTimeout(() => setShake(false), 350)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  // Eye icon SVG
  const EyeIcon = ({ show, onClick }) => (
    <button type="button" onClick={onClick}
      className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-[#4A5480] hover:text-[#8892B0] transition-colors">
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
          <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
          <line x1="1" y1="1" x2="23" y2="23"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      )}
    </button>
  )

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative glow orbs */}
      <div className="absolute top-[-120px] right-[-80px] w-[300px] h-[300px] rounded-full bg-[#7B61FF]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[250px] h-[250px] rounded-full bg-[#00E5C3]/10 blur-[100px] pointer-events-none" />

      <div className={`w-full max-w-md animate-fadeIn ${shake ? 'animate-shakeX' : ''}`}>
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#7B61FF]/10 border border-[#7B61FF]/20 mb-5">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7B61FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
              <circle cx="8.5" cy="7" r="4"/>
              <line x1="20" y1="8" x2="20" y2="14"/>
              <line x1="23" y1="11" x2="17" y2="11"/>
            </svg>
          </div>
          <h1 className="font-syne font-bold text-[36px] leading-none tracking-tight text-[#F0F2FF]">
            Join Smart Health
          </h1>
          <p className="font-dm text-[#8892B0] text-base mt-2">
            Create your account. It takes 30 seconds.
          </p>
        </div>

        {/* Card */}
        <div className="glass-card p-8">
          {/* General error */}
          {errors.general && (
            <div className="mb-6 p-3 rounded-xl bg-[#FF3D5A]/10 border border-[#FF3D5A]/30 text-[#FF3D5A] text-sm font-dm animate-fadeIn">
              {errors.general}
            </div>
          )}

          <div className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={e => { setFullName(e.target.value); if (errors.fullName) setErrors(p => ({...p, fullName: ''})) }}
                onKeyDown={handleKeyDown}
                placeholder="Yogi Panchal"
                className={`ag-input ${errors.fullName ? 'border-b-[#FF3D5A]' : ''}`}
              />
              {errors.fullName && <p className="text-[#FF3D5A] text-xs mt-1 font-dm animate-fadeIn">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); if (errors.email) setErrors(p => ({...p, email: ''})) }}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className={`ag-input ${errors.email ? 'border-b-[#FF3D5A]' : ''}`}
                autoComplete="email"
              />
              {errors.email && <p className="text-[#FF3D5A] text-xs mt-1 font-dm animate-fadeIn">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (errors.password) setErrors(p => ({...p, password: ''})) }}
                  onKeyDown={handleKeyDown}
                  placeholder="Min 6 characters"
                  className={`ag-input pr-10 ${errors.password ? 'border-b-[#FF3D5A]' : ''}`}
                  autoComplete="new-password"
                />
                <EyeIcon show={showPass} onClick={() => setShowPass(!showPass)} />
              </div>
              {errors.password && <p className="text-[#FF3D5A] text-xs mt-1 font-dm animate-fadeIn">{errors.password}</p>}
              {/* Strength bar */}
              {password && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex-1 h-1 rounded-full transition-colors duration-300"
                        style={{ backgroundColor: i <= strength.level ? strength.color : '#1A2040' }} />
                    ))}
                  </div>
                  <span className="text-xs font-dm" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => { setConfirm(e.target.value); if (errors.confirm) setErrors(p => ({...p, confirm: ''})) }}
                  onKeyDown={handleKeyDown}
                  placeholder="••••••••"
                  className={`ag-input pr-10 ${errors.confirm ? 'border-b-[#FF3D5A]' : ''}`}
                  autoComplete="new-password"
                />
                <EyeIcon show={showConfirm} onClick={() => setShowConfirm(!showConfirm)} />
              </div>
              {errors.confirm && <p className="text-[#FF3D5A] text-xs mt-1 font-dm animate-fadeIn">{errors.confirm}</p>}
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-8 bg-[#00E5C3] text-[#0B0E1A] font-semibold py-3.5 rounded-xl
              text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="ag-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>Creating account...</span>
              </>
            ) : 'Get Your Risk Score'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#4A5480] mt-6 font-dm">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00E5C3] font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
