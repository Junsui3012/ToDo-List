/**
 * APP  (App.jsx)
 * ──────────────
 * Root component: wraps the app in AuthProvider and sets up client-side routing.
 *
 * React Router v6
 * ───────────────
 * <BrowserRouter>   — uses the HTML5 History API for clean URLs (no hash)
 * <Routes>          — renders the first <Route> that matches the current URL
 * <Route>           — maps a path to a component
 * <Navigate>        — programmatic redirect as a component
 *
 * PrivateRoute pattern:
 *   If not authenticated, redirect to /login.
 *   If still loading (bootstrapping session), show a spinner.
 *   Otherwise, render the protected component.
 */
import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage    from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'

/* ── Private Route Guard ──────────────────────────────────────────────────── */
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return (
    <div className="page-loader">
      <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Restoring session…</span>
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

/* ── Public Route Guard (redirect if already logged in) ──────────────────── */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children
}

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        {/* Catch-all → redirect home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
)

export default App
