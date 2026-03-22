/**
 * TODO API  (api/todoApi.js)
 * All HTTP calls for CRUD operations on todos.
 * Params mirror the REST API design from the backend.
 */
import axiosInstance from './axiosInstance'

// READ ALL — optional filter/sort via query params
export const fetchTodos = async (params = {}) => {
  const res = await axiosInstance.get('/todos', { params })
  return res.data
}

// READ ONE
export const fetchTodoById = async (id) => {
  const res = await axiosInstance.get(`/todos/${id}`)
  return res.data
}

// CREATE
export const createTodo = async (payload) => {
  const res = await axiosInstance.post('/todos', payload)
  return res.data
}

// UPDATE (full)
export const updateTodo = async (id, payload) => {
  const res = await axiosInstance.put(`/todos/${id}`, payload)
  return res.data
}

// TOGGLE complete
export const toggleTodo = async (id) => {
  const res = await axiosInstance.patch(`/todos/${id}/toggle`)
  return res.data
}

// DELETE one
export const deleteTodo = async (id) => {
  const res = await axiosInstance.delete(`/todos/${id}`)
  return res.data
}

// DELETE all completed
export const clearCompleted = async () => {
  const res = await axiosInstance.delete('/todos/completed')
  return res.data
}
