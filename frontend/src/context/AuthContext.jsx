/**
 * AUTH CONTEXT  (context/AuthContext.jsx)
 * ─────────────────────────────────────────
 * React Context provides a way to share state deeply through the component
 * tree without prop-drilling (passing props through many intermediate layers).
 *
 * This context manages:
 *   - user      : current user object (null if logged out)
 *   - isLoading : true while we verify a stored token on page load
 *   - login()   : saves credentials, updates state
 *   - logout()  : clears credentials, redirects
 *   - register(): creates account then auto-logs in
 *
 * "Remembering sessions" mechanism:
 *   On mount, the context reads localStorage for a saved token/user.
 *   If found, it calls GET /api/auth/me to verify the token is still valid.
 *   If valid → restore session silently (user stays logged in across refreshes).
 *   If invalid → clear storage and show login.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { registerUser, loginUser, fetchCurrentUser } from '../api/authApi'
import { saveAuthData, getToken, getStoredUser, clearAuthData } from '../utils/storage'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser]         = useState(null)
  const [isLoading, setIsLoading] = useState(true)  // true while bootstrapping

  /* ── Bootstrap: restore session on app load ───────────────────────────── */
  useEffect(() => {
    const bootstrap = async () => {
      const token = getToken()
      if (!token) { setIsLoading(false); return }

      try {
        // Verify the stored token is still valid with the server
        const data = await fetchCurrentUser()
        setUser(data.data)
      } catch {
        // Token invalid or expired — clear and show login
        clearAuthData()
      } finally {
        setIsLoading(false)
      }
    }
    bootstrap()
  }, [])

  /* ── login ────────────────────────────────────────────────────────────── */
  const login = useCallback(async (email, password) => {
    const data = await loginUser({ email, password })
    saveAuthData(data.data.token, data.data)
    setUser(data.data)
    return data
  }, [])

  /* ── register ─────────────────────────────────────────────────────────── */
  const register = useCallback(async (name, email, password) => {
    const data = await registerUser({ name, email, password })
    saveAuthData(data.data.token, data.data)
    setUser(data.data)
    return data
  }, [])

  /* ── logout ───────────────────────────────────────────────────────────── */
  const logout = useCallback(() => {
    clearAuthData()
    setUser(null)
  }, [])

  const value = { user, isLoading, login, logout, register, isAuthenticated: Boolean(user) }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Custom hook — abstracts the context consumption, throws if used outside provider
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
