/**
 * TODO FORM  (components/Todo/TodoForm.jsx)
 * Used for both creating new todos and editing existing ones.
 * When `editTodo` prop is provided, the form pre-fills with its values.
 */
import React, { useState, useEffect } from 'react'
import './TodoForm.css'

const PRIORITIES = ['low', 'medium', 'high']

const TodoForm = ({ onSubmit, editTodo, onCancel }) => {
  const isEditing = Boolean(editTodo)
  const [values, setValues] = useState({ title: '', priority: 'medium', dueDate: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Pre-fill form when editing
  useEffect(() => {
    if (editTodo) {
      setValues({
        title: editTodo.title || '',
        priority: editTodo.priority || 'medium',
        dueDate: editTodo.dueDate ? editTodo.dueDate.substring(0, 10) : '',
      })
    }
  }, [editTodo])

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    if (error) setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!values.title.trim()) { setError('Title is required'); return }
    setLoading(true)
    try {
      await onSubmit({ ...values, title: values.title.trim() })
      if (!isEditing) setValues({ title: '', priority: 'medium', dueDate: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save todo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className={`todo-form ${isEditing ? 'todo-form--edit' : ''}`} onSubmit={handleSubmit} noValidate>
      <div className="todo-form-row">
        <div className="todo-form-main">
          <input
            name="title"
            type="text"
            className={`todo-input ${error ? 'todo-input--error' : ''}`}
            placeholder={isEditing ? 'Edit task…' : 'Add a new task…'}
            value={values.title}
            onChange={handleChange}
            maxLength={200}
            autoFocus={isEditing}
          />
          {error && <span className="todo-input-error">{error}</span>}
        </div>

        <select name="priority" className="todo-select" value={values.priority} onChange={handleChange}>
          {PRIORITIES.map(p => (
            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
          ))}
        </select>

        <input
          name="dueDate"
          type="date"
          className="todo-date"
          value={values.dueDate}
          onChange={handleChange}
          title="Due date (optional)"
        />

        <div className="todo-form-actions">
          <button type="submit" className="btn-add" disabled={loading}>
            {loading ? <span className="spinner" style={{width:14,height:14}} /> : (isEditing ? '✓ Save' : '+ Add')}
          </button>
          {isEditing && (
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </form>
  )
}

export default TodoForm
