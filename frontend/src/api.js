import axios from 'axios'
import { supabase } from './lib/supabase.js'

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

export const getUserId = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

export const analyzeMentalHealth = async (answers) => {
  const user_id = await getUserId()
  return API.post('/mental/analyze', { ...answers, user_id })
}

export const predictDiabetes = async (data) => {
  const user_id = await getUserId()
  return API.post('/diabetes/predict', { ...data, user_id })
}

export const predictHeart = async (data) => {
  const user_id = await getUserId()
  return API.post('/heart/predict', { ...data, user_id })
}

export const getHealthHistory = async (userId) => {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return { data: data ?? [], error }
}

export const getMentalHistory = async (userId) => {
  const { data, error } = await supabase
    .from('mental_health_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return { data: data ?? [], error }
}

export const logWater = async (glasses) => {
  const user_id = await getUserId()
  if (!user_id) return null
  return API.post('/water/log', { user_id, glasses })
}

export const getTodayWater = async (userId) => {
  return API.get(`/water/today/${userId}`)
}

export const getWaterHistory = async (userId) => {
  return API.get(`/water/history/${userId}`)
}

export const logMeal = async (data) => {
  const user_id = await getUserId()
  if (!user_id) throw new Error('User not authenticated')
  return API.post('/nutrition/log', { ...data, user_id })
}

export const getNutritionLogs = async (date = null) => {
  const user_id = await getUserId()
  if (!user_id) throw new Error('User not authenticated')
  const params = new URLSearchParams({ user_id })
  if (date) params.append('log_date', date)
  return API.get(`/nutrition/logs?${params.toString()}`)
}

export const getNutritionSummary = async (date = null) => {
  const user_id = await getUserId()
  if (!user_id) throw new Error('User not authenticated')
  return API.get(`/nutrition/summary?user_id=${user_id}${date ? `&log_date=${date}` : ''}`)
}

export const getStreaks = async () => {
  const user_id = await getUserId()
  return API.get(`/streaks/?user_id=${user_id}`)
}

export const recordLoginStreak = async () => {
  const user_id = await getUserId()
  return API.post('/streaks/login', { user_id })
}

export const recordStreak = async (streak_type) => {
  const user_id = await getUserId()
  return API.post('/streaks/record', { user_id, streak_type })
}

export const getBadges = async () => {
  const user_id = await getUserId()
  return API.get(`/streaks/badges?user_id=${user_id}`)
}

export const getHeatmap = async () => {
  const user_id = await getUserId()
  return API.get(`/streaks/heatmap?user_id=${user_id}`)
}

export default API