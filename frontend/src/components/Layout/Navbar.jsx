/**
 * NAVBAR  (components/Layout/Navbar.jsx)
 * Top navigation bar — shows app name, user info, logout button.
 */
import React from 'react'
import { useAuth } from '../../context/AuthContext'
import './Navbar.css'

const Navbar = () => {
  const { user, logout } = useAuth()

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo mono">▸ TODO</span>
        <span className="navbar-tagline">MERN Stack</span>
      </div>
      {user && (
        <div className="navbar-user">
          <div className="user-badge">
            <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="user-name">{user.name}</span>
          </div>
          <button className="btn-logout" onClick={logout}>
            Sign Out
          </button>
        </div>
      )}
    </nav>
  )
}

export default Navbar
