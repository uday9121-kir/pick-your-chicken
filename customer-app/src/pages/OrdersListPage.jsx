import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

const STATUS_COLORS = {
  placed:           { bg:'rgba(255,184,0,.15)', color:'#FFB800',  label:'Placed' },
  confirmed:        { bg:'rgba(59,130,246,.15)', color:'#60a5fa', label:'Confirmed' },
  preparing:        { bg:'rgba(168,85,247,.15)', color:'#c084fc', label:'Preparing' },
  out_for_delivery: { bg:'rgba(34,197,94,.15)', color:'#22c55e',  label:'On the Way' },
  delivered:        { bg:'rgba(34,197,94,.1)',  color:'#22c55e',  label:'Delivered' },
  cancelled:        { bg:'rgba(255,68,68,.1)',  color:'#f87171',  label:'Cancelled' },
}

export default function OrdersListPage() {
  const nav = useNavigate()
  const { user, logout } = useAuth()
  const [orders, setOrders]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/orders/my').then(setOrders).finally(() => setLoading(false))
  }, [])

  const active = ['placed','confirmed','preparing','out_for_delivery']

  return (
    <div style={{ minHeight:'100vh', background:'#090200' }}>
      <div style={{ position:'sticky', top:0, background:'rgba(9,2,0,.95)', borderBottom:'1px solid #1a0800', padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => nav('/')} style={{ background:'#120500', border:'1px solid #1a0800', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>←</button>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>📦 My Orders</h1>
        </div>
        <button onClick={logout} style={{ background:'transparent', border:'1px solid #2a0e00', color:'#7a3f2a', borderRadius:8, padding:'6px 10px', fontSize:12, cursor:'pointer' }}>Logout</button>
      </div>

      <div style={{ padding:'16px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#7a3f2a' }}>
            <div style={{ fontSize:36 }} className="anim-float">📦</div>
            <p style={{ marginTop:12 }}>Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign:'center', padding:60 }}>
            <div style={{ fontSize:48 }}>📭</div>
            <p style={{ color:'#7a3f2a', marginTop:16, fontSize:16, fontWeight:600 }}>No orders yet</p>
            <button onClick={() => nav('/')} style={{ background:'#FF3008', color:'#fff', border:'none', borderRadius:12, padding:'12px 28px', fontWeight:700, fontSize:15, cursor:'pointer', marginTop:16 }}>
              Order Now 🐔
            </button>
          </div>
        ) : orders.map(o => {
          const sc      = STATUS_COLORS[o.status] || STATUS_COLORS.placed
          const isActive= active.includes(o.status)
          const preview = o.items?.slice(0,2).map(i => i.name).join(', ')
          return (
            <div key={o.id} onClick={() => nav(`/orders/${o.id}`)} style={{ background:'#120500', border:`1.5px solid ${isActive?'rgba(255,48,8,.3)':'#1a0800'}`, borderRadius:18, padding:'16px', marginBottom:12, cursor:'pointer', transition:'border-color .2s' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'#fff', fontSize:16 }}>#{o.order_number}</span>
                  {isActive && (
                    <span style={{ marginLeft:8, fontSize:10, background:'rgba(255,48,8,.15)', color:'#FF3008', padding:'2px 8px', borderRadius:6, fontWeight:800 }}>
                      🔴 LIVE
                    </span>
                  )}
                </div>
                <span style={{ fontSize:11, fontWeight:800, padding:'3px 10px', borderRadius:20, ...sc }}>{sc.label}</span>
              </div>
              <p style={{ color:'#7a3f2a', fontSize:13, marginBottom:4 }}>🐔 {preview}{(o.items?.length||0) > 2 ? ` +${o.items.length-2} more` : ''}</p>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:10 }}>
                <span style={{ color:'#FF3008', fontWeight:800, fontSize:15 }}>₹{parseFloat(o.total).toFixed(0)}</span>
                <span style={{ color:'#5a2a1a', fontSize:12 }}>{new Date(o.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
              </div>
              {isActive && <p style={{ color:'#22c55e', fontSize:12, marginTop:6, fontWeight:600 }}>Tap to track live →</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
