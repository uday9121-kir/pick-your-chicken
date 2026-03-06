import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const Ctx = createContext(null)
export const useSocket = () => useContext(Ctx)

export function SocketProvider({ children }) {
  const { user }          = useAuth()
  const ref               = useRef(null)
  const [connected, setCon] = useState(false)
  const [orderUpdates, setOU] = useState([])

  useEffect(() => {
    ref.current = io(window.location.origin, { path: '/socket.io', reconnectionAttempts: 10 })
    const s = ref.current
    s.on('connect',    () => { setCon(true); if (user?.id) s.emit('join-customer', user.id) })
    s.on('disconnect', () => setCon(false))
    s.on('order-update', d => setOU(p => [d, ...p.slice(0,19)]))
    return () => s.disconnect()
  }, [user?.id])

  return <Ctx.Provider value={{ socket: ref.current, connected, orderUpdates }}>{children}</Ctx.Provider>
}
