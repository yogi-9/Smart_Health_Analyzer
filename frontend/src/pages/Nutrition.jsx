import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logMeal, getNutritionLogs, getNutritionSummary } from '../api'
import BottomNav from '../components/BottomNav'

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snack: '🍎' }
const MEAL_LABEL = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snacks' }

const CALORIE_GOAL = 2000

// Common foods quick-pick
const QUICK_FOODS = [
  { name: 'Rice (1 cup)', cal: 206, protein: 4, carbs: 45, fat: 0.4 },
  { name: 'Roti (1 piece)', cal: 120, protein: 3, carbs: 20, fat: 3.5 },
  { name: 'Dal (1 cup)', cal: 180, protein: 12, carbs: 30, fat: 2 },
  { name: 'Chicken Curry (1 cup)', cal: 250, protein: 28, carbs: 8, fat: 12 },
  { name: 'Paneer (100g)', cal: 265, protein: 18, carbs: 4, fat: 20 },
  { name: 'Egg (1 boiled)', cal: 78, protein: 6, carbs: 0.6, fat: 5 },
  { name: 'Banana (1 medium)', cal: 105, protein: 1, carbs: 27, fat: 0.4 },
  { name: 'Apple (1 medium)', cal: 95, protein: 0.5, carbs: 25, fat: 0.3 },
  { name: 'Milk (1 glass)', cal: 150, protein: 8, carbs: 12, fat: 8 },
  { name: 'Chai (1 cup)', cal: 60, protein: 2, carbs: 8, fat: 2 },
  { name: 'Idli (2 pieces)', cal: 130, protein: 4, carbs: 26, fat: 0.5 },
  { name: 'Dosa (1 plain)', cal: 168, protein: 4, carbs: 28, fat: 4 },
  { name: 'Poha (1 bowl)', cal: 180, protein: 3, carbs: 32, fat: 5 },
  { name: 'Upma (1 bowl)', cal: 200, protein: 5, carbs: 30, fat: 6 },
  { name: 'Samosa (1 piece)', cal: 260, protein: 4, carbs: 24, fat: 16 },
  { name: 'Biryani (1 plate)', cal: 400, protein: 15, carbs: 50, fat: 16 },
  { name: 'Salad (1 bowl)', cal: 60, protein: 2, carbs: 10, fat: 1 },
  { name: 'Yogurt/Curd (1 cup)', cal: 100, protein: 8, carbs: 8, fat: 4 },
  { name: 'Almonds (10 pieces)', cal: 70, protein: 2.5, carbs: 2.5, fat: 6 },
  { name: 'Oatmeal (1 bowl)', cal: 150, protein: 5, carbs: 27, fat: 3 },
]

export default function Nutrition() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [summary, setSummary] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expandedMeal, setExpandedMeal] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addMealType, setAddMealType] = useState('breakfast')
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    meal_type: 'breakfast',
    food_name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    quantity: 1,
    unit: 'serving',
  })

  useEffect(() => {
    if (!loading && !user) { navigate('/'); return }
    if (user) fetchData()
  }, [user, loading])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchData = async () => {
    try {
      const [logsRes, summaryRes] = await Promise.all([
        getNutritionLogs(),
        getNutritionSummary(),
      ])
      // Backend returns { success: true, data: [...] }
      // Axios wraps it in .data, so logsRes.data = { success, data }
      const logsData = logsRes.data?.data || logsRes.data || []
      setLogs(Array.isArray(logsData) ? logsData : [])

      const summaryData = summaryRes.data?.data || summaryRes.data || []
      const summaryItem = Array.isArray(summaryData) ? summaryData[0] : summaryData
      setSummary(summaryItem || null)
    } catch (e) {
      console.error('Nutrition fetch error:', e)
      // Don't crash — just show empty state
      setLogs([])
      setSummary(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
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
      })
      setForm({ meal_type: form.meal_type, food_name: '', calories: '', protein: '', carbs: '', fat: '', quantity: 1, unit: 'serving' })
      setShowAddModal(false)
      showToast(`Added "${form.food_name}" to ${MEAL_LABEL[form.meal_type]}! ✅`)
      await fetchData()
    } catch (e) {
      console.error('Add meal error:', e?.response?.data || e)
      const detail = e?.response?.data?.detail || e?.message || ''
      if (detail.includes('column') || detail.includes('schema')) {
        showToast('Database schema issue — contact support', 'error')
      } else {
        showToast(`Failed to add food: ${detail || 'Try again'}`, 'error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const selectQuickFood = (food) => {
    setForm({
      ...form,
      meal_type: addMealType,
      food_name: food.name,
      calories: String(food.cal),
      protein: String(food.protein),
      carbs: String(food.carbs),
      fat: String(food.fat),
    })
  }

  const totalCalories = summary?.total_calories || 0
  const caloriePercent = Math.min(Math.round((totalCalories / CALORIE_GOAL) * 100), 100)
  const remaining = Math.max(CALORIE_GOAL - totalCalories, 0)
  const overGoal = totalCalories > CALORIE_GOAL

  // SVG ring values
  const ringR = 70
  const ringC = 2 * Math.PI * ringR
  const ringOffset = ringC * (1 - caloriePercent / 100)
  const ringColor = overGoal ? '#FF3D5A' : '#00E5C3'

  // Group logs by meal type
  const groupedLogs = MEAL_TYPES.reduce((acc, type) => {
    acc[type] = logs.filter(l => l.meal_type === type)
    return acc
  }, {})

  const filteredFoods = QUICK_FOODS.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading || isLoading) return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="h-5 w-32 rounded-lg skeleton-shimmer" />
        <div className="h-3 w-24 rounded-lg skeleton-shimmer mt-2" />
      </div>
      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
        {[1,2,3].map(i => (
          <div key={i} className="glass-card h-20 skeleton-shimmer" />
        ))}
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border text-sm font-dm animate-fadeIn ${
          toast.type === 'error'
            ? 'bg-[#FF3D5A]/10 border-[#FF3D5A]/30 text-[#FF3D5A]'
            : 'bg-[#00E5C3]/10 border-[#00E5C3]/30 text-[#00E5C3]'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Food Logger</h1>
            <p className="text-sm text-[#8892B0] mt-0.5 font-dm">Track your meals today</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/ai-meals" className="px-3 py-1.5 rounded-xl border border-[#7B61FF]/30 text-[#7B61FF] text-xs font-dm font-medium hover:bg-[#7B61FF]/10 transition-colors">
              🤖 AI Meals
            </Link>
            <Link to="/dashboard" className="text-xs text-[#00E5C3] hover:underline font-dm">
              Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5 animate-fadeIn">

        {/* Calorie Ring */}
        <div className="glass-card p-6 flex flex-col items-center">
          <div className="relative" style={{ width: 180, height: 180 }}>
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r={ringR} fill="none" stroke="#1A2040" strokeWidth="10" />
              <circle cx="90" cy="90" r={ringR} fill="none"
                stroke={ringColor} strokeWidth="10" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringOffset}
                transform="rotate(-90 90 90)"
                style={{ transition: 'stroke-dashoffset 0.5s ease',
                         filter: `drop-shadow(0 0 8px ${ringColor}40)` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-3xl font-bold" style={{ color: ringColor }}>
                {totalCalories.toLocaleString()}
              </span>
              <span className="text-[#4A5480] text-xs font-dm">/ {CALORIE_GOAL.toLocaleString()} kcal</span>
            </div>
          </div>
          <p className="text-sm font-dm mt-3" style={{ color: overGoal ? '#FF3D5A' : '#00E5C3' }}>
            {overGoal
              ? `You've exceeded today's goal by ${(totalCalories - CALORIE_GOAL).toLocaleString()} kcal`
              : `Great job! ${remaining.toLocaleString()} kcal remaining`
            }
          </p>

          {/* Macro bars */}
          {summary && (
            <div className="grid grid-cols-3 gap-4 mt-4 w-full max-w-xs">
              {[
                { label: 'Protein', val: `${Math.round(summary.total_protein || 0)}g`, color: '#00E5C3' },
                { label: 'Carbs', val: `${Math.round(summary.total_carbs || 0)}g`, color: '#7B61FF' },
                { label: 'Fat', val: `${Math.round(summary.total_fat || 0)}g`, color: '#FFB830' },
              ].map(m => (
                <div key={m.label} className="text-center">
                  <p className="text-xs text-[#4A5480] font-dm">{m.label}</p>
                  <p className="font-mono font-bold text-sm" style={{ color: m.color }}>{m.val}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Meal sections */}
        {MEAL_TYPES.map(type => {
          const items = groupedLogs[type]
          const mealCals = items.reduce((s, l) => s + (l.calories || 0), 0)
          const isExpanded = expandedMeal === type

          return (
            <div key={type} className="glass-card overflow-hidden">
              {/* Meal header — clickable to expand */}
              <button
                type="button"
                onClick={() => setExpandedMeal(isExpanded ? null : type)}
                className="w-full flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{MEAL_EMOJI[type]}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#F0F2FF] font-dm">{MEAL_LABEL[type]}</p>
                    <p className="text-xs text-[#4A5480] font-dm">
                      {items.length} items · {mealCals} kcal
                    </p>
                  </div>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4A5480" strokeWidth="2"
                  className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-5 pb-5 border-t border-white/[0.06] animate-fadeIn">
                  {items.length === 0 ? (
                    <p className="text-[#4A5480] text-sm text-center py-4 font-dm">
                      No items logged yet
                    </p>
                  ) : (
                    <div className="space-y-2 mt-3">
                      {items.map(log => (
                        <div key={log.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                          <div>
                            <p className="text-sm text-[#F0F2FF] font-dm">{log.food_name}</p>
                            <p className="text-xs text-[#4A5480]">
                              {log.protein ? `P: ${log.protein}g` : ''} 
                              {log.carbs ? ` C: ${log.carbs}g` : ''} 
                              {log.fat ? ` F: ${log.fat}g` : ''}
                            </p>
                          </div>
                          <span className="font-mono text-sm font-bold text-[#8892B0]">{log.calories} kcal</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { setAddMealType(type); setForm({...form, meal_type: type}); setShowAddModal(true) }}
                    className="mt-3 w-full py-2.5 rounded-xl border border-[#00E5C3]/30 text-[#00E5C3] text-sm
                      font-medium hover:bg-[#00E5C3]/5 transition-colors font-dm"
                  >
                    + Add Food
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Add Food Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#12172B] border border-white/[0.06] rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto animate-fadeIn">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-syne font-bold text-lg text-[#F0F2FF]">
                Add to {MEAL_LABEL[addMealType]}
              </h3>
              <button type="button" onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-lg bg-[#1A2040] flex items-center justify-center text-[#8892B0] hover:text-[#F0F2FF]">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search common foods..."
                className="ag-input"
              />

              {/* Quick picks */}
              {searchQuery && filteredFoods.length > 0 && (
                <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl bg-[#0B0E1A] p-2">
                  {filteredFoods.map(food => (
                    <button key={food.name} type="button"
                      onClick={() => { selectQuickFood(food); setSearchQuery('') }}
                      className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-[#1A2040] text-left transition-colors">
                      <span className="text-sm text-[#F0F2FF] font-dm">{food.name}</span>
                      <span className="text-xs font-mono text-[#00E5C3]">{food.cal} kcal</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Manual entry */}
              <div>
                <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">Food Name</label>
                <input value={form.food_name} onChange={e => setForm({...form, food_name: e.target.value})}
                  placeholder="e.g. Oatmeal with banana" className="ag-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'calories', placeholder: 'Calories (kcal)' },
                  { key: 'protein', placeholder: 'Protein (g)' },
                  { key: 'carbs', placeholder: 'Carbs (g)' },
                  { key: 'fat', placeholder: 'Fat (g)' },
                ].map(({ key, placeholder }) => (
                  <input key={key} type="number" placeholder={placeholder}
                    value={form[key]}
                    onChange={e => setForm({...form, [key]: e.target.value})}
                    className="ag-input" />
                ))}
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !form.food_name.trim()}
                className="w-full bg-[#00E5C3] text-[#0B0E1A] py-3.5 rounded-xl text-sm font-semibold
                  hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150
                  disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <><span className="ag-spinner" style={{width:18,height:18,borderWidth:2}} /> Adding...</>
                ) : `Add to ${MEAL_LABEL[addMealType]}`}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}