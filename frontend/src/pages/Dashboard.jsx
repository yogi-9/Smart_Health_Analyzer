import { useAuth } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export default function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

 const handleLogout = async () => {
  try {
    await signOut()
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    navigate('/', { replace: true })
  }
}

if (!user) {
  navigate('/', { replace: true })
  return null
}

  const bmi = profile?.height && profile?.weight
    ? (profile.weight / ((profile.height / 100) ** 2)).toFixed(1)
    : null

  const bmiCategory = bmi
    ? bmi < 18.5 ? 'Underweight'
      : bmi < 25 ? 'Normal'
      : bmi < 30 ? 'Overweight'
      : 'Obese'
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg"/>
          <h1 className="text-lg font-semibold text-gray-900">Smart Health</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{profile?.full_name || user?.email}</span>
          <button onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700 font-medium">
            Sign out
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900">
            Hello, {profile?.full_name?.split(' ')[0] || 'there'}
          </h2>
          <p className="text-gray-500 text-sm mt-1">Here's your health overview</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">BMI</p>
            <p className="text-2xl font-semibold text-gray-900">{bmi ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-1">{bmiCategory ?? 'No data'}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">Last score</p>
            <p className="text-2xl font-semibold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">No analysis yet</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-medium text-gray-500 mb-1">Risk level</p>
            <p className="text-2xl font-semibold text-gray-900">—</p>
            <p className="text-xs text-gray-400 mt-1">No analysis yet</p>
          </div>
        </div>

        <Link to="/analyze"
          className="block w-full bg-blue-600 text-white text-center py-4 rounded-2xl
            font-medium hover:bg-blue-700 transition-colors mb-4">
          Run health analysis
        </Link>

        <div className="bg-white border border-gray-100 rounded-2xl p-5">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Your profile</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium text-gray-900">{profile?.age ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Gender</p>
              <p className="font-medium text-gray-900 capitalize">{profile?.gender ?? '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Height</p>
              <p className="font-medium text-gray-900">{profile?.height ? `${profile.height} cm` : '—'}</p>
            </div>
            <div>
              <p className="text-gray-500">Weight</p>
              <p className="font-medium text-gray-900">{profile?.weight ? `${profile.weight} kg` : '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}