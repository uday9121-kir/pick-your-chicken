import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'
const Ctx = createContext(null)
export const useFarmAuth = () => useContext(Ctx)
export function FarmAuthProvider({ children }) {
  const [owner, setOwner]     = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    const t = localStorage.getItem('pyc_farm_token')
    if (t) api.get('/api/farm/auth/me').then(setOwner).catch(() => localStorage.removeItem('pyc_farm_token')).finally(() => setLoading(false))
    else setLoading(false)
  }, [])
  const login  = async d => { const r = await api.post('/api/farm/auth/login', d); localStorage.setItem('pyc_farm_token', r.token); setOwner(r.owner); return r }
  const logout = ()     => { localStorage.removeItem('pyc_farm_token'); setOwner(null) }
  const toggleOpen = async () => { const r = await api.patch('/api/farm/auth/toggle-open'); setOwner(p => ({ ...p, is_open: r.is_open })); return r }
  return <Ctx.Provider value={{ owner, loading, login, logout, toggleOpen }}>{children}</Ctx.Provider>
}
