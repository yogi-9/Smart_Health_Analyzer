import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { logMeal, getNutritionLogs, getNutritionSummary } from '../api.js'
import BottomNav from './components/BottomNav'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

const mealColor = {
  breakfast: 'bg-yellow-50 text-yellow-700',
  lunch: 'bg-green-50 text-green-700',
  dinner: 'bg-blue-50 text-blue-700',
  snack: 'bg-purple-50 text-purple-700',
}

export default function App() {  
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    meal_type: 'breakfast',
    food_name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    quantity: 1,
    unit: 'serving',
    meal_time: '',
  })

  useEffect(() => {
    if (!loading && !user) {
      navigate('/')
      return
    }
    if (user) fetchData()
  }, [user, loading, navigate])

  const fetchData = async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        getNutritionLogs(),
        getNutritionSummary(),
      ])
      setLogs(logsRes.data.data || [])
      setSummary(summaryRes.data.data?.[0] || null)
    } catch (e) {
      console.error('Failed to fetch nutrition data:', e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!form.food_name.trim()) return
    
    setSubmitting(true)
    try {
      await logMeal({
        meal_type: form.meal_type,
        food_name: form.food_name,
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
        quantity: Number(form.quantity) || 1,
        unit: form.unit,
        meal_time: form.meal_time || null,
      })
      
      // Reset form but keep meal_type
      setForm({
        meal_type: form.meal_type,
        food_name: '',
        calories: '',
        protein: '',
        carbs: '',
        fat: '',
        quantity: 1,
        unit: 'serving',
        meal_time: '',
      })
      
      await fetchData()
    } catch (e) {
      console.error('Failed to log meal:', e)
      alert('Failed to log meal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-24">
        <div className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="h-5 w-32 bg-gray-100 rounded-lg animate-pulse" />
          <div className="h-3 w-24 bg-gray-100 rounded-lg mt-2 animate-pulse" />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        <BottomNav />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Nutrition</h1>
            <p className="text-sm text-gray-500 mt-0.5">Track your meals today</p>
          </div>
          <Link to="/dashboard" className="text-xs text-blue-600 hover:underline">
            Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5">
        {/* Daily Summary */}
        {summary ? (
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Calories', value: summary.total_calories, unit: 'kcal' },
              { label: 'Protein', value: `${summary.total_protein}g`, unit: '' },
              { label: 'Carbs', value: `${summary.total_carbs}g`, unit: '' },
              { label: 'Fat', value: `${summary.total_fat}g`, unit: '' },
            ].map(({ label, value, unit }) => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-center"
              >
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-lg font-semibold text-gray-900">
                  {value}
                  {unit && <span className="text-xs text-gray-400"> {unit}</span>}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {['Calories', 'Protein', 'Carbs', 'Fat'].map(label => (
              <div
                key={label}
                className="bg-white rounded-2xl border border-gray-100 p-4 text-center"
              >
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className="text-lg font-semibold text-gray-400">—</p>
              </div>
            ))}
          </div>
        )}

        {/* Log Meal Form */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Log a Meal</h2>

          <div className="flex gap-2 mb-4">
            {MEAL_TYPES.map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, meal_type: type })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium capitalize
                  transition-colors ${
                    form.meal_type === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
              >
                {type}
              </button>
            ))}
          </div>

          <input
            type="text"
            placeholder="Food name (e.g. Oatmeal with banana)"
            value={form.food_name}
            onChange={e => setForm({ ...form, food_name: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5
              text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
          />

          <div className="grid grid-cols-2 gap-3 mb-3">
            {[
              { key: 'calories', placeholder: 'Calories (kcal)' },
              { key: 'protein', placeholder: 'Protein (g)' },
              { key: 'carbs', placeholder: 'Carbs (g)' },
              { key: 'fat', placeholder: 'Fat (g)' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                type="number"
                min="0"
                step="0.1"
                placeholder={placeholder}
                value={form[key]}
                onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>

          <input
            type="time"
            value={form.meal_time}
            onChange={e => setForm({ ...form, meal_time: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5
              text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
          />

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !form.food_name.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-xl text-sm
              font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            {submitting ? 'Logging...' : 'Log Meal'}
          </button>
        </div>

        {/* Today's Logs */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">Today's Meals</h2>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">
              No meals logged today
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-3
                    border-b border-gray-50 last:border-0"
                >
                  <div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full
                        capitalize font-medium mr-2 ${mealColor[log.meal_type]}`}
                    >
                      {log.meal_type}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {log.food_name}
                    </span>
                    {log.meal_time && (
                      <p className="text-xs text-gray-400 mt-0.5">{log.meal_time}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {log.calories}
                    </p>
                    <p className="text-xs text-gray-400">kcal</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}