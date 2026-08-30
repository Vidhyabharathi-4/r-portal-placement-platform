import axios from 'axios'

const apiBaseUrl = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000')).replace(/\/$/, '')
const api = axios.create({ baseURL: `${apiBaseUrl}/api` })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rportal_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
