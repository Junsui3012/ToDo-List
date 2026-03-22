/**
 * FORMATTERS UTILITY  (utils/formatters.js)
 * Pure helper functions for display formatting.
 * Pure = no side effects, same input always gives same output.
 */

export const formatDate = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export const isOverdue = (dateStr, completed) => {
  if (!dateStr || completed) return false
  return new Date(dateStr) < new Date()
}

export const getPriorityColor = (priority) => {
  const map = { low: 'var(--p-low)', medium: 'var(--p-medium)', high: 'var(--p-high)' }
  return map[priority] || map.medium
}

export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : ''

export const timeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (seconds < 60)   return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
