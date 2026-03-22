/**
 * DASHBOARD PAGE  (pages/DashboardPage.jsx)
 * Main authenticated view — renders the Navbar and TodoList.
 */
import React from 'react'
import Navbar from '../components/Layout/Navbar'
import TodoList from '../components/Todo/TodoList'
import './DashboardPage.css'

const DashboardPage = () => (
  <div className="dashboard">
    <Navbar />
    <main className="dashboard-main">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <h2 className="dashboard-title">My Tasks</h2>
          <p className="dashboard-sub">Manage your todos with full CRUD operations</p>
        </header>
        <TodoList />
      </div>
    </main>
  </div>
)

export default DashboardPage
