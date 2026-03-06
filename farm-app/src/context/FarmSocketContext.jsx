import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useFarmAuth } from './FarmAuthContext'
const Ctx = createContext(null)
export const useFarmSocket = () => useContext(Ctx)
export function FarmSocketProvider({ children }) {
  const { owner }            = useFarmAuth()
  const ref                  = useRef(null)
  const [connected, setCon]  = useState(false)
  const [newOrders, setNew]  = useState([])
  const [unread, setUnread]  = useState(0)

  useEffect(() => {
    if (!owner) return
    ref.current = io(window.location.origin, { path: '/socket.io', reconnectionAttempts: 10 })
    const s = ref.current
    s.on('connect',    () => { setCon(true); s.emit('join-farm') })
    s.on('disconnect', () => setCon(false))
    s.on('new-order',  o  => {
      setNew(p => [o, ...p.slice(0,9)])
      setUnread(p => p + 1)
      // browser notification
      if (Notification.permission === 'granted')
        new Notification('🐔 New Order!', { body: `${o.customer_name} · ₹${parseFloat(o.total).toFixed(0)}` })
      // Beep sound
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain); gain.connect(ctx.destination)
        osc.frequency.value = 880; gain.gain.value = 0.3
        osc.start(); osc.stop(ctx.currentTime + 0.2)
      } catch {}
    })
    s.on('order-updated', o => setNew(p => p.map(x => x.id===o.id ? o : x)))
    return () => s.disconnect()
  }, [owner?.id])

  const clearUnread = () => setUnread(0)
  const requestNotif = () => Notification.requestPermission?.()

  return <Ctx.Provider value={{ socket:ref.current, connected, newOrders, unread, clearUnread, requestNotif }}>{children}</Ctx.Provider>
}
