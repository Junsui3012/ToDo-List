/**
 * AXIOS INSTANCE  (api/axiosInstance.js)
 * Pre-configured Axios instance shared across all API modules.
 * - Base URL defined once
 * - Request interceptor auto-attaches Bearer token from localStorage
 * - Response interceptor handles 401 (expired token) by redirecting to /login
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
})

// Attach token before every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Handle 401 globally — force logout on expired/invalid token
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authUser')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
