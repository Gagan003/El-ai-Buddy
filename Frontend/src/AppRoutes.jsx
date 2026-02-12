import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import Home from './pages/Home'
import Register from './pages/Register'
import Login from './pages/Login'
import axios from 'axios'
import { API_BASE } from './config.js'

const checkAuth = () =>
  axios.get(`${API_BASE}/api/auth/me`, { withCredentials: true })

const AppRoutes = () => {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)

  const recheckAuth = () => {
    setChecking(true)
    checkAuth()
      .then(() => setAuthed(true))
      .catch(() => setAuthed(false))
      .finally(() => setChecking(false))
  }

  useEffect(() => {
    let mounted = true
    checkAuth()
      .then(() => { if (mounted) setAuthed(true) })
      .catch(() => { if (mounted) setAuthed(false) })
      .finally(() => { if (mounted) setChecking(false) })

    const onAuth = () => { if (mounted) recheckAuth() }
    window.addEventListener('auth-changed', onAuth)
    return () => {
      mounted = false
      window.removeEventListener('auth-changed', onAuth)
    }
  }, [])

  if (checking) {
    return (
      <div className="center-min-h-screen">
        <div>Checking authentication…</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={authed ? <Home /> : <Navigate to="/login" replace />} />
        <Route path='/register' element={authed ? <Navigate to="/" replace /> : <Register />} />
        <Route path='/login' element={authed ? <Navigate to="/" replace /> : <Login />} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes