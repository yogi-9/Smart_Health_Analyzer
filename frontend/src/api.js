 import axios from 'axios'

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export const checkHealth = () => API.get('/health')

export const predictRisk = (healthData) => API.post('/predict', healthData)

export default API