/**
 * TODO FILTERS  (components/Todo/TodoFilters.jsx)
 * Filter/sort controls bar — drives the `filter` state in useTodos hook.
 */
import React from 'react'
import './TodoFilters.css'

const TodoFilters = ({ filter, onFilterChange, stats, onClearCompleted }) => {
  const set = (key, val) => onFilterChange({ ...filter, [key]: val === 'all' ? undefined : val })

  return (
    <div className="filters-bar">
      <div className="filters-left">
        {/* Status filter */}
        <div className="filter-group">
          {[
            { label: 'All',       value: 'all'   },
            { label: 'Active',    value: 'false'  },
            { label: 'Completed', value: 'true'   },
          ].map(({ label, value }) => {
            const active = (filter.completed === undefined && value === 'all') ||
                           String(filter.completed) === value
            return (
              <button
                key={value}
                className={`filter-btn ${active ? 'filter-btn--active' : ''}`}
                onClick={() => set('completed', value)}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Priority filter */}
        <select
          className="filter-select"
          value={filter.priority || 'all'}
          onChange={e => set('priority', e.target.value)}
          title="Filter by priority"
        >
          <option value="all">All Priorities</option>
          <option value="high">🔴 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">⚪ Low</option>
        </select>

        {/* Sort */}
        <select
          className="filter-select"
          value={filter.sort || '-createdAt'}
          onChange={e => onFilterChange({ ...filter, sort: e.target.value })}
          title="Sort by"
        >
          <option value="-createdAt">Newest First</option>
          <option value="createdAt">Oldest First</option>
          <option value="dueDate">Due Date</option>
          <option value="-priority">Priority</option>
        </select>
      </div>

      <div className="filters-right">
        <span className="filter-stats">
          <span className="filter-stats-num">{stats.pending}</span> remaining
        </span>
        {stats.completed > 0 && (
          <button className="btn-clear" onClick={onClearCompleted}>
            Clear completed ({stats.completed})
          </button>
        )}
      </div>
    </div>
  )
}

export default TodoFilters
