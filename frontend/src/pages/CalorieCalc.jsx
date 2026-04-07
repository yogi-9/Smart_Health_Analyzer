import { useState, useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import BottomNav from '../components/BottomNav'

// ─── Mifflin-St Jeor Equation (most accurate clinically validated formula) ───
function calcBMR(weight, height, age, gender) {
  // gender: 'male' | 'female'
  const base = 10 * weight + 6.25 * height - 5 * age
  return gender === 'male' ? base + 5 : base - 161
}

const ACTIVITY_LEVELS = [
  { id: 'sedentary',  label: 'Sedentary',         emoji: '🪑', desc: 'Little or no exercise',          factor: 1.2 },
  { id: 'light',      label: 'Lightly Active',     emoji: '🚶', desc: 'Exercise 1–3 days/week',         factor: 1.375 },
  { id: 'moderate',   label: 'Moderately Active',  emoji: '🏃', desc: 'Exercise 3–5 days/week',         factor: 1.55 },
  { id: 'active',     label: 'Very Active',        emoji: '🏋️', desc: 'Hard exercise 6–7 days/week',    factor: 1.725 },
  { id: 'extreme',    label: 'Extremely Active',   emoji: '⚡', desc: 'Athlete / physical job',          factor: 1.9 },
]

const GOALS = [
  { id: 'lose',     label: 'Lose Weight',    emoji: '📉', offset: -500, desc: '~0.5 kg/week loss' },
  { id: 'maintain', label: 'Maintain',       emoji: '⚖️', offset: 0,    desc: 'Stay at current weight' },
  { id: 'gain',     label: 'Gain Weight',    emoji: '📈', offset: 500,  desc: '~0.5 kg/week gain' },
]

// ─── Dynamic suggestions based on results ────────────────────────────
function getSuggestions(targetCals, goal, activityId, bmi) {
  const tips = []

  // Calorie-based tips
  if (targetCals < 1200) {
    tips.push({ icon: '⚠️', text: 'Your calorie target is very low. Consult a dietitian before going below 1,200 kcal/day.' })
  }
  if (targetCals > 3500) {
    tips.push({ icon: '💪', text: 'High calorie needs! Focus on nutrient-dense meals rather than junk food to hit your target.' })
  }

  // Goal-based tips
  if (goal === 'lose') {
    tips.push({ icon: '🥗', text: 'Prioritize protein (1.6–2.2g/kg) to preserve muscle mass during weight loss.' })
    tips.push({ icon: '🚰', text: 'Drink water before meals — it helps reduce appetite and boosts metabolism by 24–30%.' })
    tips.push({ icon: '🍽️', text: 'Eat slowly and mindfully. It takes ~20 minutes for your brain to register fullness.' })
    if (activityId === 'sedentary') {
      tips.push({ icon: '🏃', text: 'Adding just 30 min of walking daily burns ~150 extra calories — that\'s 5 kg/year!' })
    }
  } else if (goal === 'gain') {
    tips.push({ icon: '🥜', text: 'Add calorie-dense healthy foods: nuts, avocado, olive oil, dried fruits, whole milk.' })
    tips.push({ icon: '💪', text: 'Pair your surplus with strength training to build muscle instead of just fat.' })
    tips.push({ icon: '🍌', text: 'Eat a protein + carb meal within 1 hour after your workout for best recovery.' })
  } else {
    tips.push({ icon: '✅', text: 'Great choice! Maintaining weight is about consistency — aim for ±100 kcal daily.' })
    tips.push({ icon: '📊', text: 'Track your weight weekly (same time, same conditions) to catch trends early.' })
  }

  // BMI-based tips
  if (bmi > 30) {
    tips.push({ icon: '❤️', text: 'Focus on fiber-rich foods (25–30g/day) — they improve satiety and gut health.' })
  } else if (bmi < 18.5) {
    tips.push({ icon: '🍎', text: 'Underweight? Add 2–3 healthy snacks between meals to boost daily intake.' })
  }

  // Activity-based tips
  if (activityId === 'active' || activityId === 'extreme') {
    tips.push({ icon: '💧', text: 'At your activity level, aim for 3–4 liters of water daily to stay hydrated.' })
    tips.push({ icon: '⏰', text: 'Consider nutrient timing — eat carbs before workouts and protein after.' })
  }

  // General tips
  tips.push({ icon: '🌙', text: 'Sleep 7–9 hours nightly — poor sleep increases hunger hormones by up to 28%.' })

  return tips
}

export default function CalorieCalc() {
  const { profile } = useAuth()

  const [form, setForm] = useState({
    age: profile?.age || '',
    gender: profile?.gender === 'male' || profile?.gender === 1 ? 'male' : profile?.gender === 'female' || profile?.gender === 0 ? 'female' : '',
    height: profile?.height || '',
    weight: profile?.weight || '',
    activity: '',
    goal: 'maintain',
  })

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }))

  // All calculations are derived reactively
  const results = useMemo(() => {
    const age = Number(form.age)
    const height = Number(form.height)
    const weight = Number(form.weight)
    const activityObj = ACTIVITY_LEVELS.find(a => a.id === form.activity)
    const goalObj = GOALS.find(g => g.id === form.goal)

    if (!age || !height || !weight || !form.gender || !activityObj || !goalObj) return null

    const bmr = Math.round(calcBMR(weight, height, age, form.gender))
    const tdee = Math.round(bmr * activityObj.factor)
    const target = Math.max(1000, tdee + goalObj.offset)
    const bmi = Number((weight / ((height / 100) ** 2)).toFixed(1))

    // Macro breakdown (balanced split)
    const proteinRatio = form.goal === 'lose' ? 0.35 : form.goal === 'gain' ? 0.30 : 0.30
    const fatRatio = 0.25
    const carbRatio = 1 - proteinRatio - fatRatio

    const protein = Math.round((target * proteinRatio) / 4)   // 4 cal/g
    const fat = Math.round((target * fatRatio) / 9)            // 9 cal/g
    const carbs = Math.round((target * carbRatio) / 4)         // 4 cal/g

    const suggestions = getSuggestions(target, form.goal, form.activity, bmi)

    return { bmr, tdee, target, bmi, protein, fat, carbs, suggestions }
  }, [form])

  // Ring values for the calorie display
  const ringR = 80
  const ringC = 2 * Math.PI * ringR
  const ringPercent = results ? Math.min(results.target / 4000, 1) : 0
  const ringOffset = ringC * (1 - ringPercent)

  return (
    <div className="min-h-screen bg-[#0B0E1A] pb-24">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/[0.06]">
        <h1 className="font-syne font-bold text-xl text-[#F0F2FF]">Calorie Calculator</h1>
        <p className="text-sm text-[#8892B0] mt-0.5 font-dm">Science-based daily calorie needs</p>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-6 space-y-5 animate-fadeIn">

        {/* Input Card */}
        <div className="glass-card p-6 space-y-5">
          <h2 className="font-syne font-bold text-base text-[#F0F2FF]">Your Details</h2>

          {/* Age & Gender */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">Age</label>
              <input type="number" value={form.age} onChange={e => update('age', e.target.value)}
                placeholder="e.g. 25" className="ag-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">Gender</label>
              <div className="flex gap-2">
                {[
                  { value: 'male', label: '♂ Male' },
                  { value: 'female', label: '♀ Female' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => update('gender', opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      form.gender === opt.value
                        ? 'bg-[#00E5C3] text-[#0B0E1A]'
                        : 'bg-[#1A2040] text-[#8892B0] hover:text-[#F0F2FF] border border-white/[0.06]'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Height & Weight */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">Height (cm)</label>
              <input type="number" value={form.height} onChange={e => update('height', e.target.value)}
                placeholder="e.g. 170" className="ag-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#8892B0] mb-2 tracking-wide uppercase font-dm">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={e => update('weight', e.target.value)}
                placeholder="e.g. 70" className="ag-input" />
            </div>
          </div>

          {/* Activity Level */}
          <div>
            <label className="block text-xs font-medium text-[#8892B0] mb-3 tracking-wide uppercase font-dm">Activity Level</label>
            <div className="grid grid-cols-1 gap-2">
              {ACTIVITY_LEVELS.map(level => (
                <button key={level.id} type="button" onClick={() => update('activity', level.id)}
                  className={`flex items-center gap-3 p-3.5 rounded-xl text-left transition-all duration-200 ${
                    form.activity === level.id
                      ? 'bg-[#00E5C3]/15 border border-[#00E5C3]/40 text-[#00E5C3]'
                      : 'bg-[#1A2040] border border-white/[0.06] text-[#8892B0] hover:text-[#F0F2FF] hover:border-white/10'
                  }`}>
                  <span className="text-xl w-8 text-center">{level.emoji}</span>
                  <div>
                    <p className="text-sm font-medium font-dm">{level.label}</p>
                    <p className="text-xs opacity-60 font-dm">{level.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-medium text-[#8892B0] mb-3 tracking-wide uppercase font-dm">Your Goal</label>
            <div className="flex gap-3">
              {GOALS.map(goal => (
                <button key={goal.id} type="button" onClick={() => update('goal', goal.id)}
                  className={`flex-1 py-3.5 rounded-xl text-center transition-all duration-200 ${
                    form.goal === goal.id
                      ? 'bg-[#7B61FF]/15 border border-[#7B61FF]/40 text-[#7B61FF]'
                      : 'bg-[#1A2040] border border-white/[0.06] text-[#8892B0] hover:text-[#F0F2FF]'
                  }`}>
                  <span className="text-xl block">{goal.emoji}</span>
                  <p className="text-xs font-medium font-dm mt-1">{goal.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results (shown dynamically when all inputs are filled) */}
        {results && (
          <>
            {/* Calorie Target Ring */}
            <div className="glass-card p-6 flex flex-col items-center animate-fadeIn">
              <p className="text-xs text-[#4A5480] uppercase tracking-wider font-dm mb-4">Your Daily Calorie Target</p>
              <div className="relative" style={{ width: 200, height: 200 }}>
                <svg width="200" height="200" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r={ringR} fill="none" stroke="#1A2040" strokeWidth="12" />
                  <circle cx="100" cy="100" r={ringR} fill="none"
                    stroke="#00E5C3" strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={ringC} strokeDashoffset={ringOffset}
                    transform="rotate(-90 100 100)"
                    style={{ transition: 'stroke-dashoffset 0.6s ease', filter: 'drop-shadow(0 0 10px rgba(0,229,195,0.4))' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-4xl font-bold text-[#00E5C3]">
                    {results.target.toLocaleString()}
                  </span>
                  <span className="text-[#4A5480] text-xs font-dm mt-1">kcal / day</span>
                </div>
              </div>

              {/* BMR & TDEE breakdown */}
              <div className="flex gap-6 mt-5">
                <div className="text-center">
                  <p className="text-xs text-[#4A5480] font-dm">BMR</p>
                  <p className="font-mono text-lg font-bold text-[#F0F2FF]">{results.bmr.toLocaleString()}</p>
                  <p className="text-[10px] text-[#4A5480] font-dm">at rest</p>
                </div>
                <div className="w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-xs text-[#4A5480] font-dm">TDEE</p>
                  <p className="font-mono text-lg font-bold text-[#F0F2FF]">{results.tdee.toLocaleString()}</p>
                  <p className="text-[10px] text-[#4A5480] font-dm">with activity</p>
                </div>
                <div className="w-px bg-white/[0.06]" />
                <div className="text-center">
                  <p className="text-xs text-[#4A5480] font-dm">BMI</p>
                  <p className="font-mono text-lg font-bold text-[#F0F2FF]">{results.bmi}</p>
                  <p className="text-[10px] text-[#4A5480] font-dm">
                    {results.bmi < 18.5 ? 'Under' : results.bmi < 25 ? 'Normal' : results.bmi < 30 ? 'Over' : 'Obese'}
                  </p>
                </div>
              </div>
            </div>

            {/* Macro Breakdown */}
            <div className="glass-card p-6 animate-fadeIn" style={{ animationDelay: '100ms' }}>
              <h2 className="font-syne font-bold text-base text-[#F0F2FF] mb-4">Daily Macro Breakdown</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Protein', grams: results.protein, color: '#00E5C3', icon: '🥩' },
                  { label: 'Carbs', grams: results.carbs, color: '#7B61FF', icon: '🍚' },
                  { label: 'Fat', grams: results.fat, color: '#FFB830', icon: '🥑' },
                ].map(macro => (
                  <div key={macro.label} className="text-center">
                    <span className="text-2xl">{macro.icon}</span>
                    <p className="font-mono text-2xl font-bold mt-1" style={{ color: macro.color }}>
                      {macro.grams}g
                    </p>
                    <p className="text-xs text-[#4A5480] font-dm mt-1">{macro.label}</p>
                    <p className="text-[10px] text-[#4A5480] font-dm">
                      {Math.round(macro.grams * (macro.label === 'Fat' ? 9 : 4))} kcal
                    </p>
                  </div>
                ))}
              </div>

              {/* Macro bar */}
              <div className="flex h-3 rounded-full overflow-hidden mt-4 bg-[#1A2040]">
                <div style={{ width: `${(results.protein * 4 / results.target) * 100}%`, backgroundColor: '#00E5C3' }}
                  className="transition-all duration-500" />
                <div style={{ width: `${(results.carbs * 4 / results.target) * 100}%`, backgroundColor: '#7B61FF' }}
                  className="transition-all duration-500" />
                <div style={{ width: `${(results.fat * 9 / results.target) * 100}%`, backgroundColor: '#FFB830' }}
                  className="transition-all duration-500" />
              </div>
              <div className="flex justify-between mt-2">
                {[
                  { label: 'Protein', color: '#00E5C3' },
                  { label: 'Carbs', color: '#7B61FF' },
                  { label: 'Fat', color: '#FFB830' },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                    <span className="text-[10px] text-[#4A5480] font-dm">{m.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Meal Split Suggestion */}
            <div className="glass-card p-6 animate-fadeIn" style={{ animationDelay: '200ms' }}>
              <h2 className="font-syne font-bold text-base text-[#F0F2FF] mb-4">Suggested Meal Split</h2>
              <div className="space-y-3">
                {[
                  { meal: 'Breakfast', emoji: '🌅', pct: 0.25 },
                  { meal: 'Lunch', emoji: '☀️', pct: 0.35 },
                  { meal: 'Snacks', emoji: '🍎', pct: 0.10 },
                  { meal: 'Dinner', emoji: '🌙', pct: 0.30 },
                ].map(m => {
                  const cals = Math.round(results.target * m.pct)
                  return (
                    <div key={m.meal} className="flex items-center gap-3">
                      <span className="text-lg w-7 text-center">{m.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm text-[#F0F2FF] font-dm">{m.meal}</p>
                          <span className="text-xs font-mono text-[#00E5C3]">{cals} kcal</span>
                        </div>
                        <div className="h-1.5 bg-[#1A2040] rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-[#00E5C3]/60 transition-all duration-500"
                            style={{ width: `${m.pct * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Personalized Suggestions */}
            <div className="animate-fadeIn" style={{ animationDelay: '300ms' }}>
              <h2 className="font-syne font-bold text-base text-[#F0F2FF] mb-4">
                Personalized Tips
              </h2>
              <div className="space-y-3">
                {results.suggestions.map((tip, i) => (
                  <div key={i} className="glass-card p-4 flex items-start gap-3"
                    style={{ animationDelay: `${300 + i * 60}ms` }}>
                    <span className="text-lg flex-shrink-0 mt-0.5">{tip.icon}</span>
                    <p className="text-sm text-[#8892B0] font-dm leading-relaxed">{tip.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Formula disclaimer */}
            <p className="text-[10px] text-[#4A5480] text-center font-dm">
              Calculated using the Mifflin-St Jeor equation — the most accurate clinically validated formula for estimating metabolic rate.
            </p>
          </>
        )}

        {/* Empty state when inputs are incomplete */}
        {!results && (
          <div className="glass-card p-8 text-center">
            <span className="text-4xl block mb-3">⚡</span>
            <p className="text-[#8892B0] text-sm font-dm">
              Fill in all fields above to see your personalized calorie target and suggestions
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
