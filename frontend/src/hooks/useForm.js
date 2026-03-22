/**
 * useForm HOOK  (hooks/useForm.js)
 * Reusable form state management.
 * Handles values, errors, loading state and submission flow.
 */
import { useState, useCallback } from 'react'

const useForm = (initialValues, validate) => {
  const [values, setValues]   = useState(initialValues)
  const [errors, setErrors]   = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError]   = useState(null)

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    // Clear field error on change
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }))
  }, [errors])

  const handleSubmit = useCallback((onSubmit) => async (e) => {
    e.preventDefault()
    setServerError(null)

    // Run client-side validation if a validate function was provided
    if (validate) {
      const validationErrors = validate(values)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong'
      setServerError(msg)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validate])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setServerError(null)
  }, [initialValues])

  return { values, errors, isSubmitting, serverError, handleChange, handleSubmit, reset, setValues }
}

export default useForm
