/**
 * TODO ITEM  (components/Todo/TodoItem.jsx)
 * Renders a single todo row with inline edit support.
 * State: isEditing toggles between view and edit mode for that row.
 */
import React, { useState } from 'react'
import TodoForm from './TodoForm'
import { formatDate, isOverdue, getPriorityColor, timeAgo } from '../../utils/formatters'
import './TodoItem.css'

const TodoItem = ({ todo, onToggle, onEdit, onDelete }) => {
  const [isEditing, setIsEditing]   = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const overdue = isOverdue(todo.dueDate, todo.completed)

  const handleEdit = async (payload) => {
    await onEdit(todo._id, payload)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try { await onDelete(todo._id) }
    catch { setIsDeleting(false) }
  }

  if (isEditing) {
    return (
      <li className="todo-item todo-item--editing fade-in">
        <TodoForm
          editTodo={todo}
          onSubmit={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      </li>
    )
  }

  return (
    <li className={`todo-item fade-in ${todo.completed ? 'todo-item--done' : ''} ${overdue ? 'todo-item--overdue' : ''}`}>
      {/* Checkbox */}
      <button
        className={`todo-check ${todo.completed ? 'todo-check--done' : ''}`}
        onClick={() => onToggle(todo._id)}
        aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
        title={todo.completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.completed ? '✓' : ''}
      </button>

      {/* Content */}
      <div className="todo-content">
        <span className="todo-title">{todo.title}</span>
        <div className="todo-meta">
          <span
            className="todo-priority"
            style={{ color: getPriorityColor(todo.priority) }}
          >
            {todo.priority}
          </span>
          {todo.dueDate && (
            <span className={`todo-due ${overdue ? 'todo-due--overdue' : ''}`}>
              {overdue ? '⚠ ' : ''}Due {formatDate(todo.dueDate)}
            </span>
          )}
          <span className="todo-age">{timeAgo(todo.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="todo-actions">
        <button
          className="todo-btn todo-btn--edit"
          onClick={() => setIsEditing(true)}
          disabled={todo.completed}
          title="Edit"
        >
          ✎
        </button>
        <button
          className="todo-btn todo-btn--delete"
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete"
        >
          {isDeleting ? '…' : '✕'}
        </button>
      </div>
    </li>
  )
}

export default TodoItem
