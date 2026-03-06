import { createContext, useContext, useState } from 'react'

const Ctx = createContext(null)
export const useCart = () => useContext(Ctx)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const add = p => setItems(prev => {
    const ex = prev.find(i => i.product_id === p.id)
    if (ex) return prev.map(i => i.product_id === p.id ? { ...i, qty: i.qty + 1 } : i)
    return [...prev, { product_id:p.id, name:p.name, name_te:p.name_te, icon:p.icon, price:parseFloat(p.price), unit:p.unit, qty:1 }]
  })

  const remove = pid => setItems(prev => {
    const ex = prev.find(i => i.product_id === pid)
    if (!ex || ex.qty <= 1) return prev.filter(i => i.product_id !== pid)
    return prev.map(i => i.product_id === pid ? { ...i, qty: i.qty - 1 } : i)
  })

  const clear    = ()  => setItems([])
  const count    = items.reduce((s,i) => s + i.qty, 0)
  const subtotal = items.reduce((s,i) => s + i.price * i.qty, 0)

  return <Ctx.Provider value={{ items, add, remove, clear, count, subtotal }}>{children}</Ctx.Provider>
}
