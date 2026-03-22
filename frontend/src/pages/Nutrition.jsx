// frontend/src/pages/Nutrition.jsx
import { useState, useEffect } from 'react'
import { logMeal, getNutritionLogs, getNutritionSummary } from '../api/nutrition'
import { useNavigate } from 'react-router-dom'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']

export default function Nutrition() {
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(false)
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
  const navigate = useNavigate()

  // Get token from supabase session
  const getToken = () => {
    const raw = localStorage.getItem(
      Object.keys(localStorage).find(k => k.includes('auth-token')) || ''
    )
    if (!raw) return null
    try { return JSON.parse(raw)?.access_token } catch { return null }
  }

  const fetchData = async () => {
    const token = getToken()
    if (!token) return navigate('/')
    try {
      const [logsRes, summaryRes] = await Promise.all([
        getNutritionLogs(token),
        getNutritionSummary(token),
      ])
      setLogs(logsRes.data.data || [])
      setSummary(summaryRes.data.data?.[0] || null)
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async () => {
    const token = getToken()
    if (!token || !form.food_name) return
    setLoading(true)
    try {
      await logMeal(token, {
        ...form,
        calories: Number(form.calories) || 0,
        protein: Number(form.protein) || 0,
        carbs: Number(form.carbs) || 0,
        fat: Number(form.fat) || 0,
        quantity: Number(form.quantity) || 1,
      })
      setForm({ ...form, food_name: '', calories: '', protein: '',
                carbs: '', fat: '', meal_time: '' })
      fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const mealColor = {
    breakfast: 'bg-yellow-50 text-yellow-700',
    lunch: 'bg-green-50 text-green-700',
    dinner: 'bg-blue-50 text-blue-700',
    snack: 'bg-purple-50 text-purple-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-gray-900 mb-1">Nutrition Tracker</h1>
      <p className="text-gray-500 text-sm mb-6">Log your meals and track macros</p>

      {/* Daily Summary */}
      {summary && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Calories', value: summary.total_calories, unit: 'kcal' },
            { label: 'Protein', value: `${summary.total_protein}g`, unit: '' },
            { label: 'Carbs', value: `${summary.total_carbs}g`, unit: '' },
            { label: 'Fat', value: `${summary.total_fat}g`, unit: '' },
          ].map(({ label, value, unit }) => (
            <div key={label}
              className="bg-white rounded-xl border border-gray-100 p-3 text-center">
              <div className="text-xs text-gray-400 mb-1">{label}</div>
              <div className="text-lg font-semibold text-gray-800">
                {value}<span className="text-xs text-gray-400"> {unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Meal Form */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Log a Meal</h2>
        <div className="grid grid-cols-2 gap-3">

          {/* Meal Type */}
          <div className="col-span-2">
            <div className="flex gap-2">
              {MEAL_TYPES.map(type => (
                <button key={type}
                  onClick={() => setForm({ ...form, meal_type: type })}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize
                    transition-colors
                    ${form.meal_type === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Food Name */}
          <div className="col-span-2">
            <input
              placeholder="Food name (e.g. Oatmeal with banana)"
              value={form.food_name}
              onChange={e => setForm({ ...form, food_name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2
                text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Macros */}
          {[
            { key: 'calories', label: 'Calories (kcal)' },
            { key: 'protein', label: 'Protein (g)' },
            { key: 'carbs', label: 'Carbs (g)' },
            { key: 'fat', label: 'Fat (g)' },
          ].map(({ key, label }) => (
            <input key={key}
              type="number" placeholder={label}
              value={form[key]}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          ))}

          {/* Meal Time */}
          <input type="time"
            value={form.meal_time}
            onChange={e => setForm({ ...form, meal_time: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Submit */}
          <button onClick={handleSubmit} disabled={loading}
            className="col-span-2 bg-blue-600 text-white py-2.5 rounded-xl
              text-sm font-medium hover:bg-blue-700 disabled:opacity-50
              transition-colors">
            {loading ? 'Logging...' : 'Log Meal'}
          </button>
        </div>
      </div>

      {/* Today's Logs */}
      <div className="space-y-2">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Today's Meals</h2>
        {logs.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-8">
            No meals logged today
          </p>
        )}
        {logs.map(log => (
          <div key={log.id}
            className="bg-white rounded-xl border border-gray-100 p-4
              flex items-center justify-between">
            <div>
              <span className={`text-xs px-2 py-0.5 rounded-full capitalize
                font-medium mr-2 ${mealColor[log.meal_type]}`}>
                {log.meal_type}
              </span>
              <span className="text-sm font-medium text-gray-800">
                {log.food_name}
              </span>
              {log.meal_time && (
                <span className="text-xs text-gray-400 ml-2">{log.meal_time}</span>
              )}
            </div>
            <div className="text-sm font-semibold text-gray-700">
              {log.calories} <span className="text-xs text-gray-400">kcal</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}