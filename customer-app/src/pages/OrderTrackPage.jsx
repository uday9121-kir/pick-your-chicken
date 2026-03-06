import { useState, useEffect } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import api from '../utils/api'

const STATUS_STEPS = ['placed','confirmed','preparing','out_for_delivery','delivered']
const STATUS_LABELS = {
  placed:            { en:'Order Placed!',       te:'ఆర్డర్ చేశారు!',          icon:'✅', msg:'Your order is confirmed. Farm will start processing soon.' },
  confirmed:         { en:'Order Confirmed!',    te:'ధృవీకరించారు!',            icon:'👍', msg:'Farm has confirmed your order.' },
  preparing:         { en:'Being Prepared',      te:'సిద్ధం చేస్తున్నారు',       icon:'🔪', msg:'Your chicken is being cut and packed fresh.' },
  out_for_delivery:  { en:'On the Way!',         te:'వస్తున్నారు!',              icon:'🛵', msg:'Your order is out for delivery.' },
  delivered:         { en:'Delivered!',          te:'డెలివర్ అయింది!',           icon:'🎉', msg:'Your order has been delivered. Enjoy your meal!' },
  cancelled:         { en:'Order Cancelled',     te:'రద్దు చేశారు',              icon:'❌', msg:'This order was cancelled.' },
}

export default function OrderTrackPage() {
  const { id }        = useParams()
  const [sp]          = useSearchParams()
  const nav           = useNavigate()
  const { orderUpdates } = useSocket()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rating, setRating]   = useState(0)
  const [rated, setRated]     = useState(false)

  useEffect(() => {
    api.get(`/api/orders/${id}`).then(setOrder).catch(()=>nav('/orders')).finally(()=>setLoading(false))
  }, [id])

  // Real-time updates
  useEffect(() => {
    const u = orderUpdates.find(u => u.order_id === id)
    if (u?.order) setOrder(u.order)
  }, [orderUpdates, id])

  const submitRating = async () => {
    await api.post(`/api/orders/${id}/rate`, { rating })
    setRated(true)
  }

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#090200', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontSize:48, textAlign:'center' }} className="anim-float">🐔<br/><span style={{ color:'#7a3f2a', fontSize:14 }}>Loading...</span></div>
    </div>
  )
  if (!order) return null

  const sl       = STATUS_LABELS[order.status] || STATUS_LABELS.placed
  const stepIdx  = STATUS_STEPS.indexOf(order.status)
  const isNew    = sp.get('new') === '1'

  return (
    <div style={{ minHeight:'100vh', background:'#090200' }}>
      <div style={{ position:'sticky', top:0, background:'rgba(9,2,0,.95)', borderBottom:'1px solid #1a0800', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => nav('/orders')} style={{ background:'#120500', border:'1px solid #1a0800', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>←</button>
        <div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:18, color:'#fff' }}>Order #{order.order_number}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:order.status!=='delivered'&&order.status!=='cancelled'?'ping2 1s infinite':undefined }}/>
            <span style={{ color:'#22c55e', fontSize:12, fontWeight:700 }}>LIVE</span>
          </div>
        </div>
      </div>

      <div style={{ padding:16 }}>
        {isNew && (
          <div style={{ background:'rgba(34,197,94,.1)', border:'1.5px solid rgba(34,197,94,.3)', borderRadius:16, padding:'14px 16px', marginBottom:16, textAlign:'center' }}>
            <p style={{ color:'#22c55e', fontWeight:800, fontSize:16 }}>🎉 Order Placed Successfully!</p>
            <p style={{ fontFamily:'Noto Sans Telugu,sans-serif', color:'#86efac', fontSize:13, marginTop:4 }}>ఆర్డర్ విజయవంతంగా చేశారు!</p>
          </div>
        )}

        {/* Status hero */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:20, padding:24, textAlign:'center', marginBottom:16 }}>
          <div style={{ fontSize:56, marginBottom:12 }} className="anim-float">{sl.icon}</div>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:24, fontWeight:900, color:'#fff', marginBottom:4 }}>{sl.en}</h2>
          <p style={{ fontFamily:'Noto Sans Telugu,sans-serif', color:'#c0392b', fontSize:15, marginBottom:8 }}>{sl.te}</p>
          <p style={{ color:'#7a3f2a', fontSize:13 }}>{sl.msg}</p>
        </div>

        {/* Progress steps */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:18, padding:'16px', marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', position:'relative' }}>
            {/* Connecting line */}
            <div style={{ position:'absolute', top:18, left:'10%', right:'10%', height:3, background:'#1a0800', borderRadius:4 }}/>
            <div style={{ position:'absolute', top:18, left:'10%', height:3, background:'#FF3008', borderRadius:4, width:`${Math.min(100,(stepIdx/(STATUS_STEPS.length-1))*100)}%`, transition:'width .5s ease' }}/>

            {STATUS_STEPS.map((s,i) => {
              const done    = i <= stepIdx
              const current = i === stepIdx
              const labels  = { placed:'Placed', confirmed:'Confirmed', preparing:'Preparing', out_for_delivery:'On Way', delivered:'Delivered' }
              const icons   = { placed:'✅', confirmed:'👍', preparing:'🔪', out_for_delivery:'🛵', delivered:'🎉' }
              return (
                <div key={s} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, zIndex:1 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background: done?'#FF3008':'#0d0300', border:`2.5px solid ${done?'#FF3008':'#2a0e00'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, transition:'all .3s', boxShadow: current?'0 0 0 4px rgba(255,48,8,.2)':undefined }}>
                    {done ? icons[s] : <span style={{ color:'#2a0e00', fontSize:10 }}>○</span>}
                  </div>
                  <span style={{ fontSize:9, color: done?'#FF3008':'#5a2a1a', fontWeight:700, textAlign:'center', maxWidth:52 }}>{labels[s]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Driver info */}
        {order.driver_name && order.status === 'out_for_delivery' && (
          <div style={{ background:'#120500', border:'1.5px solid rgba(168,85,247,.3)', borderRadius:18, padding:'16px', marginBottom:16 }}>
            <p style={{ fontWeight:800, color:'#a855f7', fontSize:15, marginBottom:10 }}>🛵 Your Delivery Partner</p>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <p style={{ color:'#fff', fontWeight:700, fontSize:16 }}>{order.driver_name}</p>
                <p style={{ color:'#7a3f2a', fontSize:13 }}>{order.driver_phone}</p>
                {order.eta_minutes && <p style={{ color:'#22c55e', fontSize:12, marginTop:4 }}>⏱ ETA: ~{order.eta_minutes} mins</p>}
              </div>
              {order.driver_phone && (
                <a href={`tel:${order.driver_phone}`} style={{ background:'rgba(34,197,94,.15)', border:'1.5px solid rgba(34,197,94,.3)', color:'#22c55e', borderRadius:12, padding:'10px 18px', textDecoration:'none', fontWeight:700, fontSize:14 }}>
                  📞 Call
                </a>
              )}
            </div>
          </div>
        )}

        {/* Items */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:18, padding:'16px', marginBottom:16 }}>
          <p style={{ fontWeight:800, color:'#fff', fontSize:15, marginBottom:12 }}>🛒 Your Order</p>
          {order.items?.map((item,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom: i<order.items.length-1?'1px solid #1a0800':'none' }}>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span style={{ fontSize:20 }}>{item.icon}</span>
                <div>
                  <p style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{item.name}</p>
                  <p style={{ fontFamily:'Noto Sans Telugu,sans-serif', color:'#c0392b', fontSize:11 }}>{item.name_te}</p>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <p style={{ color:'#fff', fontWeight:700, fontSize:13 }}>₹{parseFloat(item.total).toFixed(0)}</p>
                <p style={{ color:'#7a3f2a', fontSize:11 }}>{item.quantity}{item.unit} × ₹{item.price}</p>
              </div>
            </div>
          ))}
          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid #1a0800', display:'flex', justifyContent:'space-between' }}>
            <span style={{ color:'#7a3f2a', fontSize:14 }}>Total Paid</span>
            <span style={{ color:'#FF3008', fontWeight:800, fontSize:16 }}>₹{parseFloat(order.total).toFixed(0)}</span>
          </div>
        </div>

        {/* Rating */}
        {order.status === 'delivered' && !order.is_rated && !rated && (
          <div style={{ background:'#120500', border:'1.5px solid rgba(255,184,0,.3)', borderRadius:18, padding:'16px', marginBottom:16, textAlign:'center' }}>
            <p style={{ fontWeight:800, color:'#FFB800', fontSize:15, marginBottom:4 }}>⭐ Rate Your Order</p>
            <p style={{ color:'#7a3f2a', fontSize:12, marginBottom:14 }}>Earn +5 loyalty points!</p>
            <div style={{ display:'flex', justifyContent:'center', gap:8, marginBottom:14 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setRating(n)} style={{ fontSize:30, background:'transparent', border:'none', cursor:'pointer', opacity: n<=rating?1:.3, transition:'all .15s' }}>⭐</button>
              ))}
            </div>
            {rating > 0 && (
              <button onClick={submitRating} style={{ background:'#FFB800', color:'#000', border:'none', borderRadius:10, padding:'10px 28px', fontWeight:800, fontSize:14, cursor:'pointer' }}>
                Submit Rating
              </button>
            )}
          </div>
        )}
        {rated && (
          <div style={{ background:'rgba(34,197,94,.1)', border:'1.5px solid rgba(34,197,94,.3)', borderRadius:16, padding:'14px', marginBottom:16, textAlign:'center' }}>
            <p style={{ color:'#22c55e', fontWeight:700 }}>✅ Thanks! +5 loyalty points added!</p>
          </div>
        )}
      </div>
    </div>
  )
}
