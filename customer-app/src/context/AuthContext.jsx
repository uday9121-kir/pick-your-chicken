import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = localStorage.getItem('pyc_token')
    if (t) api.get('/api/auth/me').then(setUser).catch(() => localStorage.removeItem('pyc_token')).finally(() => setLoading(false))
    else setLoading(false)
  }, [])

  const login    = async d => { const r = await api.post('/api/auth/login', d);    localStorage.setItem('pyc_token', r.token); setUser(r.user); return r }
  const register = async d => { const r = await api.post('/api/auth/register', d); localStorage.setItem('pyc_token', r.token); setUser(r.user); return r }
  const logout   = ()      => { localStorage.removeItem('pyc_token'); setUser(null) }

  return <Ctx.Provider value={{ user, loading, login, register, logout }}>{children}</Ctx.Provider>
}
