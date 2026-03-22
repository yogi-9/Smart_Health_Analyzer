// frontend/src/api/nutrition.js
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const getAuthHeader = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
})

// Log a meal
export const logMeal = (token, data) =>
  axios.post(`${BASE_URL}/nutrition/log`, data, getAuthHeader(token))

// Get today's logs
export const getNutritionLogs = (token, date = null) =>
  axios.get(`${BASE_URL}/nutrition/logs${date ? `?log_date=${date}` : ''}`,
    getAuthHeader(token))

// Get today's summary
export const getNutritionSummary = (token, date = null) =>
  axios.get(`${BASE_URL}/nutrition/summary${date ? `?log_date=${date}` : ''}`,
    getAuthHeader(token))

// Get all streaks
export const getStreaks = (token) =>
  axios.get(`${BASE_URL}/streaks/`, getAuthHeader(token))

// Record login streak
export const recordLoginStreak = (token) =>
  axios.post(`${BASE_URL}/streaks/login`, {}, getAuthHeader(token))