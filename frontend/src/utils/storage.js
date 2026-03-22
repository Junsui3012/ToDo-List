/**
 * STORAGE UTILITY  (utils/storage.js)
 * ─────────────────────────────────────
 * Wraps localStorage so the rest of the app never touches it directly.
 *
 * Why abstract localStorage?
 *   1. Safe JSON parse/stringify in one place — no scattered try/catch
 *   2. Easy to swap to sessionStorage or a cookie-based solution
 *   3. Unit tests can mock this module instead of mocking window.localStorage
 *
 * "Remembering previous conversations" / persistent login:
 *   When a user logs in, we store their token and profile here.
 *   On the next visit, AuthContext reads this storage to auto-restore the session
 *   without requiring a new login — this is the mechanism behind "remember me".
 */

const TOKEN_KEY = 'authToken'
const USER_KEY  = 'authUser'

export const saveAuthData = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const isAuthenticated = () => Boolean(getToken())
