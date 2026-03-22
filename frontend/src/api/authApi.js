/**
 * AUTH API  (api/authApi.js)
 * All HTTP calls related to authentication.
 * Each function returns the `data` field from the response envelope.
 */
import axiosInstance from './axiosInstance'

export const registerUser = async (payload) => {
  const res = await axiosInstance.post('/auth/register', payload)
  return res.data
}

export const loginUser = async (payload) => {
  const res = await axiosInstance.post('/auth/login', payload)
  return res.data
}

export const fetchCurrentUser = async () => {
  const res = await axiosInstance.get('/auth/me')
  return res.data
}
