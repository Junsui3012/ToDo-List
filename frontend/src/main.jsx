/**
 * main.jsx — React application entry point
 *
 * React 18's createRoot API replaces the old ReactDOM.render().
 * It enables concurrent rendering features (Suspense, transitions, etc.)
 * StrictMode renders every component twice in dev to surface side-effects.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
