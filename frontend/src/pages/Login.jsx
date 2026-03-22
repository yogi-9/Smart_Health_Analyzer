import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [shake, setShake] = useState(false)
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      triggerError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError(null)

    try {
      if (mode === 'register') {
        const { error: err } = await signUp(email, password)
        if (err) { triggerError(err.message); return }
        // After signup, navigate to profile-setup or dashboard
        navigate('/profile-setup')
      } else {
        const { error: err } = await signIn(email, password)
        if (err) { triggerError(err.message); return }
        navigate('/dashboard')
      }
    } catch (e) {
      triggerError(e.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const triggerError = (msg) => {
    setError(msg)
    setLoading(false)
    setShake(true)
    setTimeout(() => setShake(false), 350)
  }

  // Handle Enter key
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative glow orbs */}
      <div className="absolute top-[-120px] left-[-80px] w-[300px] h-[300px] rounded-full bg-[#00E5C3]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[250px] h-[250px] rounded-full bg-[#7B61FF]/10 blur-[100px] pointer-events-none" />

      <div className={`w-full max-w-md animate-fadeIn ${shake ? 'animate-shakeX' : ''}`}>
        {/* Brand & Hero Copy */}
        <div className="text-center mb-10">
          {/* Logo mark */}
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#00E5C3]/10 border border-[#00E5C3]/20 mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00E5C3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </div>
          <h1 className="font-syne font-bold text-[48px] leading-none tracking-tight text-[#F0F2FF]">
            Know Your Risk.
          </h1>
          <p className="font-dm text-[#8892B0] text-base mt-3">
            AI-powered health analysis in under 2 minutes.
          </p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8">
          {/* Tab Toggle */}
          <div className="flex rounded-xl bg-[#0B0E1A] p-1 mb-8">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-[#00E5C3] text-[#0B0E1A]'
                  : 'text-[#8892B0] hover:text-[#F0F2FF]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null) }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-[#00E5C3] text-[#0B0E1A]'
                  : 'text-[#8892B0] hover:text-[#F0F2FF]'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-[#FF3D5A]/10 border border-[#FF3D5A]/30 text-[#FF3D5A] text-sm font-dm animate-fadeIn">
              {error}
            </div>
          )}

          {/* Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="you@example.com"
                className="ag-input"
                autoComplete="email"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="••••••••"
                className="ag-input"
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full mt-8 bg-[#00E5C3] text-[#0B0E1A] font-semibold py-3.5 rounded-xl
              text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
              flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="ag-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                <span>{mode === 'register' ? 'Creating account...' : 'Signing in...'}</span>
              </>
            ) : (
              mode === 'register' ? 'Get Your Risk Score' : 'Sign In'
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#4A5480] mt-6 font-dm">
          {mode === 'login' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null) }}
                className="text-[#00E5C3] font-medium hover:underline"
              >
                Create one
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null) }}
                className="text-[#00E5C3] font-medium hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}