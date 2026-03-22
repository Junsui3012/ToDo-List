/**
 * AUTH FORM  (components/Auth/AuthForm.jsx)
 * Reusable form for both login and registration.
 * Props control whether it renders in "login" or "register" mode.
 */
import React, { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import './AuthForm.css'

const AuthForm = ({ mode }) => {
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const isLogin = mode === 'login'

  const [values, setValues]       = useState({ name: '', email: '', password: '' })
  const [errors, setErrors]       = useState({})
  const [serverError, setServerError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!isLogin && (!values.name || values.name.trim().length < 2)) errs.name = 'Name must be at least 2 characters'
    if (!values.email || !/\S+@\S+\.\S+/.test(values.email))          errs.email = 'Valid email required'
    if (!values.password || values.password.length < 6)                errs.password = 'Password must be 6+ characters'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setServerError(null)
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setIsLoading(true)
    try {
      if (isLogin) await login(values.email, values.password)
      else         await register(values.name, values.email, values.password)
      navigate('/dashboard')
    } catch (err) {
      setServerError(err.response?.data?.message || 'Authentication failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-wrapper fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title mono">
            {isLogin ? '> LOGIN' : '> REGISTER'}
          </h1>
          <p className="auth-subtitle">
            {isLogin ? 'Welcome back. Sign in to continue.' : 'Create an account to get started.'}
          </p>
        </div>

        {serverError && (
          <div className="auth-error slide-down">
            <span>⚠</span> {serverError}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div className="field-group">
              <label className="field-label" htmlFor="name">Name</label>
              <input
                id="name" name="name" type="text"
                className={`field-input ${errors.name ? 'field-input--error' : ''}`}
                placeholder="John Doe"
                value={values.name}
                onChange={handleChange}
                autoComplete="name"
              />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>
          )}

          <div className="field-group">
            <label className="field-label" htmlFor="email">Email</label>
            <input
              id="email" name="email" type="email"
              className={`field-input ${errors.email ? 'field-input--error' : ''}`}
              placeholder="you@example.com"
              value={values.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </div>

          <div className="field-group">
            <label className="field-label" htmlFor="password">Password</label>
            <input
              id="password" name="password" type="password"
              className={`field-input ${errors.password ? 'field-input--error' : ''}`}
              placeholder="••••••••"
              value={values.password}
              onChange={handleChange}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {errors.password && <span className="field-error">{errors.password}</span>}
          </div>

          <button type="submit" className="btn-primary btn-full" disabled={isLoading}>
            {isLoading ? <span className="spinner" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <Link to={isLogin ? '/register' : '/login'}>
            {isLogin ? 'Register' : 'Sign in'}
          </Link>
        </p>
      </div>
    </div>
  )
}

export default AuthForm
