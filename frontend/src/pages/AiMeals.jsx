import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getHealthHistory, logMeal } from '../api'
import { supabase } from '../lib/supabase'
import BottomNav from '../components/BottomNav'

const MEAL_EMOJI = { breakfast: '🌅', lunch: '☀️', dinner: '🌙', snacks: '🍎' }

export default function AiMeals() {
  const { user } = useAuth()
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [toast, setToast] = useState(null)
  const [calorieGoal] = useState(2000)

  useEffect(() => {
    if (!user) return
    loadTodayPlan()
  }, [user])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadTodayPlan = async () => {
    const today = new Date().toISOString().split('T')[0]
    try {
      // Check Supabase for existing plan
      const { data } = await supabase.from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('created_at', { ascending: false })
        .limit(1)

      if (data && data.length > 0 && data[0].plan_json) {
        try {
          setPlan(JSON.parse(data[0].plan_json))
        } catch {
          setPlan(data[0].plan_json)
        }
        setLoading(false)
        return
      }

      // No plan exists — generate one
      await generatePlan()
    } catch (e) {
      console.error('Load meal plan error:', e)
      setLoading(false)
    }
  }

  const generatePlan = async () => {
    setGenerating(true)
    setLoading(true)
    try {
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
      if (!apiKey) {
        setPlan(getFallbackPlan())
        showToast('Using sample plan — add VITE_CLAUDE_API_KEY for AI-generated plans', 'info')
        setLoading(false)
        setGenerating(false)
        return
      }

      // Get user health context
      let healthCtx = ''
      try {
        const { data } = await getHealthHistory(user.id)
        if (data && data.length > 0) {
          const latest = data[0]
          healthCtx = `User's health: Risk ${latest.risk_level}, BMI ${latest.bmi || 'unknown'}.`
        }
      } catch {}

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 800,
          system: 'You are a nutritionist. Return ONLY valid JSON, no markdown, no explanation.',
          messages: [{
            role: 'user',
            content: `Generate a simple, healthy Indian meal plan for today.
Daily calorie target: ${calorieGoal} kcal.
${healthCtx}
Keep it simple, healthy, affordable.
Return ONLY this JSON format, no other text:
{"breakfast":{"name":"...","ingredients":["..."],"calories":0,"prep_time":"... min"},"lunch":{"name":"...","ingredients":["..."],"calories":0,"prep_time":"... min"},"dinner":{"name":"...","ingredients":["..."],"calories":0,"prep_time":"... min"},"snacks":{"name":"...","ingredients":["..."],"calories":0,"prep_time":"... min"}}`
          }],
        }),
      })

      if (!response.ok) throw new Error(`API error: ${response.status}`)

      const data = await response.json()
      let planText = data.content?.[0]?.text || ''
      // Clean markdown code fences if present
      planText = planText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsedPlan = JSON.parse(planText)
      setPlan(parsedPlan)

      // Save to Supabase
      const today = new Date().toISOString().split('T')[0]
      await supabase.from('meal_plans').insert({
        user_id: user.id,
        date: today,
        plan_json: JSON.stringify(parsedPlan),
      }).then(({ error }) => { if (error) console.warn('Save plan:', error.message) })

    } catch (e) {
      console.error('Generate plan error:', e)
      setPlan(getFallbackPlan())
      showToast('Used sample plan — AI generation failed', 'info')
    } finally {
      setLoading(false)
      setGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    // Delete today's plan
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('meal_plans')
      .delete()
      .eq('user_id', user.id)
      .eq('date', today)
    setPlan(null)
    await generatePlan()
  }

  const addToFoodLog = async (mealType, meal) => {
    try {
      await logMeal({
        meal_type: mealType === 'snacks' ? 'snack' : mealType,
        food_name: meal.name,
        calories: meal.calories || 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        quantity: 1,
        unit: 'serving',
      })
      showToast('Added to your food diary! ✅')
    } catch (e) {
      showToast('Failed to add — try again', 'error')
    }
  }

  const totalCalories = plan
    ? Object.values(plan).reduce((sum, m) => sum + (m?.calories || 0), 0)
    : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0E1A] pb-24">
        <div className="px-6 py-5 border-b border-white/[0.06]">
          <div className="h-5 w-40 rounded-lg skeleton-shimmer" />
          <div className="h-3 w-28 rounded-lg skeleton-shimmer mt-2" />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-6 space-y-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="glass-card h-32 skeleton-shimmer" />
          ))}
        </div>
        <BottomNav />
      </div>
    )
  }

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
            <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Today's Meal Plan</h1>
            <p className="text-sm text-[#8892B0] mt-0.5 font-dm">
              Goal: {calorieGoal.toLocaleString()} kcal
            </p>
          </div>
          <button type="button" onClick={handleRegenerate} disabled={generating}
            className="px-4 py-2 rounded-xl border border-[#7B61FF]/30 text-[#7B61FF] text-xs font-dm font-medium
              hover:bg-[#7B61FF]/10 transition-colors disabled:opacity-40">
            {generating ? 'Generating...' : '↻ Regenerate'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-4 animate-fadeIn">
        {/* Meal cards */}
        {plan && ['breakfast', 'lunch', 'dinner', 'snacks'].map(key => {
          const meal = plan[key]
          if (!meal) return null
          return (
            <div key={key} className="glass-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{MEAL_EMOJI[key]}</span>
                  <div>
                    <p className="text-xs text-[#4A5480] uppercase tracking-wide font-dm">
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </p>
                    <p className="text-base font-medium text-[#F0F2FF] font-dm">{meal.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-bold text-[#00E5C3]">{meal.calories}</span>
                  <p className="text-[10px] text-[#4A5480]">kcal</p>
                </div>
              </div>

              {/* Ingredients */}
              {meal.ingredients && (
                <ul className="space-y-1 mb-3">
                  {meal.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-[#8892B0] font-dm flex gap-2">
                      <span className="text-[#00E5C3]/60">•</span> {ing}
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between">
                {meal.prep_time && (
                  <span className="text-xs text-[#4A5480] font-dm">⏱ {meal.prep_time}</span>
                )}
                <button type="button" onClick={() => addToFoodLog(key, meal)}
                  className="px-3 py-1.5 rounded-lg bg-[#00E5C3]/10 border border-[#00E5C3]/20
                    text-xs text-[#00E5C3] font-dm font-medium hover:bg-[#00E5C3]/20 transition-colors">
                  + Add to Food Log
                </button>
              </div>
            </div>
          )
        })}

        {/* Nutritional summary */}
        <div className="glass-card p-5">
          <h2 className="text-sm font-medium text-[#F0F2FF] font-dm mb-3">Daily Total</h2>
          <div className="flex items-center justify-between">
            <span className="text-[#8892B0] text-sm font-dm">Total Calories</span>
            <span className="font-mono text-xl font-bold text-[#00E5C3]">
              {totalCalories.toLocaleString()} kcal
            </span>
          </div>
          <div className="mt-2 h-2 bg-[#1A2040] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((totalCalories / calorieGoal) * 100, 100)}%`,
                backgroundColor: totalCalories > calorieGoal ? '#FF3D5A' : '#00E5C3',
              }} />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

// Fallback plan when API key is missing or API fails
function getFallbackPlan() {
  return {
    breakfast: {
      name: "Oatmeal with Banana & Honey",
      ingredients: ["1 cup rolled oats", "1 sliced banana", "1 tbsp honey", "handful of almonds"],
      calories: 350,
      prep_time: "10 min"
    },
    lunch: {
      name: "Dal Rice with Raita",
      ingredients: ["1 cup yellow dal", "1 cup steamed rice", "mixed salad", "1 cup curd raita"],
      calories: 550,
      prep_time: "30 min"
    },
    dinner: {
      name: "Grilled Paneer with Roti",
      ingredients: ["200g paneer tikka", "2 whole wheat roti", "sautéed vegetables", "mint chutney"],
      calories: 500,
      prep_time: "25 min"
    },
    snacks: {
      name: "Fruits & Nuts Mix",
      ingredients: ["1 apple", "10 almonds", "herbal tea", "1 cup sprouts"],
      calories: 250,
      prep_time: "5 min"
    }
  }
}
