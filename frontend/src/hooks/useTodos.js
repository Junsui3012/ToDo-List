/**
 * useTodos HOOK  (hooks/useTodos.js)
 * ────────────────────────────────────
 * Custom hook that encapsulates ALL todo state and operations.
 * Components consume this hook and get back clean state + action functions —
 * they never call the API directly.
 *
 * Custom hooks = reusable stateful logic extracted from components.
 * Rule: if you find yourself copying useState + useEffect patterns across
 * components, extract them into a custom hook.
 */
import { useState, useEffect, useCallback } from 'react'
import * as todoApi from '../api/todoApi'

const useTodos = () => {
  const [todos, setTodos]       = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState(null)
  const [filter, setFilter]     = useState({ completed: undefined, priority: undefined, sort: '-createdAt' })

  /* ── Fetch todos ───────────────────────────────────────────────────────── */
  const loadTodos = useCallback(async (params = filter) => {
    setIsLoading(true)
    setError(null)
    try {
      // Remove undefined keys so they aren't sent as query params
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      )
      const data = await todoApi.fetchTodos(cleanParams)
      setTodos(data.data.todos)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load todos')
    } finally {
      setIsLoading(false)
    }
  }, [filter])

  // Reload when filter changes
  useEffect(() => { loadTodos(filter) }, [filter])

  /* ── CREATE ────────────────────────────────────────────────────────────── */
  const addTodo = useCallback(async (payload) => {
    const data = await todoApi.createTodo(payload)
    // Optimistic-style: prepend to state immediately
    setTodos(prev => [data.data, ...prev])
    return data
  }, [])

  /* ── UPDATE ────────────────────────────────────────────────────────────── */
  const editTodo = useCallback(async (id, payload) => {
    const data = await todoApi.updateTodo(id, payload)
    setTodos(prev => prev.map(t => t._id === id ? data.data : t))
    return data
  }, [])

  /* ── TOGGLE ────────────────────────────────────────────────────────────── */
  const toggle = useCallback(async (id) => {
    const data = await todoApi.toggleTodo(id)
    setTodos(prev => prev.map(t => t._id === id ? data.data : t))
    return data
  }, [])

  /* ── DELETE ONE ─────────────────────────────────────────────────────────  */
  const removeTodo = useCallback(async (id) => {
    await todoApi.deleteTodo(id)
    setTodos(prev => prev.filter(t => t._id !== id))
  }, [])

  /* ── DELETE COMPLETED ───────────────────────────────────────────────────  */
  const clearDone = useCallback(async () => {
    await todoApi.clearCompleted()
    setTodos(prev => prev.filter(t => !t.completed))
  }, [])

  // Derived stats
  const stats = {
    total:     todos.length,
    completed: todos.filter(t => t.completed).length,
    pending:   todos.filter(t => !t.completed).length,
  }

  return {
    todos, isLoading, error, filter, stats,
    setFilter, loadTodos,
    addTodo, editTodo, toggle, removeTodo, clearDone,
  }
}

export default useTodos
