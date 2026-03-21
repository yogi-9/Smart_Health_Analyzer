import axios from 'axios'
import { supabase } from './lib/supabase'

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
  return { data, error }
}

export const getMentalHistory = async (userId) => {
  const { data, error } = await supabase
    .from('mental_health_records')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)
  return { data, error }
}

export default API