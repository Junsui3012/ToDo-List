/**
 * TODO LIST  (components/Todo/TodoList.jsx)
 * Orchestrates the full todo UI: form, filters, list, empty states.
 * Consumes the useTodos hook and passes data/handlers down to child components.
 */
import React from 'react'
import useTodos from '../../hooks/useTodos'
import TodoForm from './TodoForm'
import TodoItem from './TodoItem'
import TodoFilters from './TodoFilters'
import './TodoList.css'

const TodoList = () => {
  const { todos, isLoading, error, filter, stats,
          setFilter, addTodo, editTodo, toggle, removeTodo, clearDone } = useTodos()

  return (
    <div className="todo-list-wrapper">
      {/* Stats bar */}
      <div className="todo-stats">
        <div className="stat-chip">
          <span className="stat-num mono">{stats.total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-chip stat-chip--active">
          <span className="stat-num mono">{stats.pending}</span>
          <span className="stat-label">Active</span>
        </div>
        <div className="stat-chip stat-chip--done">
          <span className="stat-num mono">{stats.completed}</span>
          <span className="stat-label">Done</span>
        </div>
        {stats.total > 0 && (
          <div className="stat-progress">
            <div
              className="stat-progress-bar"
              style={{ width: `${(stats.completed / stats.total) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Add todo form */}
      <TodoForm onSubmit={addTodo} />

      {/* Filters */}
      <TodoFilters
        filter={filter}
        onFilterChange={setFilter}
        stats={stats}
        onClearCompleted={clearDone}
      />

      {/* Error state */}
      {error && (
        <div className="todo-error slide-down">
          <span>⚠</span> {error}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="todo-loading">
          <span className="spinner" />
          <span>Loading tasks…</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && todos.length === 0 && (
        <div className="todo-empty fade-in">
          <div className="todo-empty-icon">◉</div>
          <p className="todo-empty-title">No tasks found</p>
          <p className="todo-empty-sub">
            {filter.completed !== undefined || filter.priority
              ? 'Try adjusting your filters'
              : 'Add your first task above to get started'}
          </p>
        </div>
      )}

      {/* Todo list */}
      {!isLoading && todos.length > 0 && (
        <ul className="todo-list">
          {todos.map(todo => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={toggle}
              onEdit={editTodo}
              onDelete={removeTodo}
            />
          ))}
        </ul>
      )}
    </div>
  )
}

export default TodoList
