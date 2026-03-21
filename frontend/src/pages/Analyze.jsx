import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Analyze() {
  const { profile } = useAuth()

  const modules = [
    {
      to: '/analyze/mental',
      title: 'Mental health check',
      desc: 'PHQ-9 + GAD-7 questionnaire for anxiety and depression',
      time: '5 min',
      color: 'bg-purple-50 border-purple-200',
      dot: 'bg-purple-500'
    },
    {
      to: '/analyze/diabetes',
      title: 'Diabetes risk',
      desc: 'ML prediction based on glucose, BMI, family history',
      time: '2 min',
      color: 'bg-blue-50 border-blue-200',
      dot: 'bg-blue-500'
    },
    {
      to: '/analyze/heart',
      title: 'Heart disease risk',
      desc: 'ML prediction based on blood pressure, cholesterol, ECG',
      time: '3 min',
      color: 'bg-red-50 border-red-200',
      dot: 'bg-red-500'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Health Analysis</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Choose a module to analyze
        </p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {modules.map(m => (
          <Link key={m.to} to={m.to}
            className={`block p-6 rounded-2xl border ${m.color}
              hover:opacity-80 transition-opacity`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full ${m.dot} mt-1.5 flex-shrink-0`}/>
                <div>
                  <p className="font-medium text-gray-900">{m.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{m.desc}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500 whitespace-nowrap ml-4 mt-1">
                {m.time}
              </span>
            </div>
          </Link>
        ))}

        <div className="bg-white border border-gray-100 rounded-2xl p-5 mt-6">
          <p className="text-xs font-medium text-gray-500 mb-1">Your profile data</p>
          <p className="text-sm text-gray-700">
            {profile?.full_name || 'Profile'} —
            Age {profile?.age || '?'},
            BMI {profile?.height && profile?.weight
              ? (profile.weight / ((profile.height/100)**2)).toFixed(1)
              : '?'}
          </p>
          <Link to="/profile-setup"
            className="text-xs text-blue-600 hover:underline mt-1 inline-block">
            Update profile
          </Link>
        </div>
      </div>
    </div>
  )
}