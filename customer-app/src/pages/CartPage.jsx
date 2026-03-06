import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../utils/api'

export default function CartPage() {
  const nav = useNavigate()
  const { items, add, remove, clear, subtotal } = useCart()
  const [coupon, setCoupon]   = useState('')
  const [applied, setApplied] = useState(null)
  const [cpErr, setCpErr]     = useState('')
  const [cpBusy, setCpBusy]   = useState(false)

  const deliveryFee = subtotal >= 500 ? 0 : (subtotal > 0 ? 30 : 0)
  const discount    = applied?.discount || 0
  const total       = subtotal + deliveryFee - discount

  const applyCoupon = async () => {
    if (!coupon.trim()) return
    setCpErr(''); setCpBusy(true)
    try {
      const r = await api.post('/api/coupons/validate', { code: coupon, subtotal })
      setApplied(r)
    } catch(e) { setCpErr(e.message); setApplied(null) }
    finally { setCpBusy(false) }
  }

  if (items.length === 0) return (
    <div style={{ minHeight:'100vh', background:'#090200', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
      <div style={{ fontSize:64 }}>🛒</div>
      <p style={{ color:'#7a3f2a', fontSize:18, fontWeight:600 }}>Your cart is empty</p>
      <p style={{ fontFamily:'Noto Sans Telugu,sans-serif', color:'#c0392b', fontSize:14 }}>కార్ట్ ఖాళీగా ఉంది</p>
      <button onClick={() => nav('/')} style={{ background:'#FF3008', color:'#fff', border:'none', borderRadius:12, padding:'12px 28px', fontWeight:700, fontSize:15, cursor:'pointer' }}>
        Browse Menu
      </button>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#090200' }}>
      <div style={{ position:'sticky', top:0, background:'rgba(9,2,0,.95)', borderBottom:'1px solid #1a0800', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => nav('/')} style={{ background:'#120500', border:'1px solid #1a0800', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>←</button>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>🛒 Your Cart</h1>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Items */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:18, overflow:'hidden', marginBottom:16 }}>
          {items.map((item, i) => (
            <div key={item.product_id} style={{ padding:'14px 16px', borderBottom: i < items.length-1 ? '1px solid #1a0800' : 'none', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:28 }}>{item.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:'#fff', fontSize:15 }}>{item.name}</div>
                <div style={{ fontFamily:'Noto Sans Telugu,sans-serif', color:'#c0392b', fontSize:12 }}>{item.name_te}</div>
                <div style={{ color:'#FF3008', fontWeight:700, fontSize:13, marginTop:2 }}>₹{item.price}/{item.unit}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:0, background:'#FF3008', borderRadius:8 }}>
                <button onClick={() => remove(item.product_id)} style={{ background:'transparent', border:'none', color:'#fff', padding:'6px 11px', fontSize:16, cursor:'pointer', fontWeight:700 }}>−</button>
                <span style={{ color:'#fff', fontWeight:800, minWidth:22, textAlign:'center', fontSize:14 }}>{item.qty}</span>
                <button onClick={() => add(item)} style={{ background:'transparent', border:'none', color:'#fff', padding:'6px 11px', fontSize:16, cursor:'pointer', fontWeight:700 }}>+</button>
              </div>
              <div style={{ color:'#fff', fontWeight:700, minWidth:52, textAlign:'right', fontSize:14 }}>₹{(item.price*item.qty).toFixed(0)}</div>
            </div>
          ))}
        </div>

        {/* Coupon */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:16, padding:'16px', marginBottom:16 }}>
          <p style={{ fontWeight:700, color:'#fff', marginBottom:10, fontSize:15 }}>🏷️ Coupon Code</p>
          {applied ? (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(34,197,94,.1)', border:'1px solid rgba(34,197,94,.3)', borderRadius:10, padding:'10px 14px' }}>
              <span style={{ color:'#22c55e', fontWeight:700, fontSize:14 }}>✅ {applied.code} — −₹{applied.discount}</span>
              <button onClick={() => { setApplied(null); setCoupon('') }} style={{ background:'rgba(255,68,68,.15)', border:'none', color:'#ff6b6b', borderRadius:6, padding:'4px 10px', cursor:'pointer', fontSize:12, fontWeight:700 }}>Remove</button>
            </div>
          ) : (
            <div style={{ display:'flex', gap:8 }}>
              <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())} onKeyDown={e => e.key==='Enter'&&applyCoupon()} placeholder="WELCOME10"
                style={{ flex:1, background:'#0d0300', border:'1px solid #2a0e00', borderRadius:10, padding:'10px 14px', color:'#fff', fontSize:14, outline:'none' }}/>
              <button onClick={applyCoupon} disabled={cpBusy||!coupon} style={{ background:'#FF3008', color:'#fff', border:'none', borderRadius:10, padding:'10px 18px', fontWeight:700, cursor:'pointer', opacity:(!coupon||cpBusy)?0.5:1 }}>
                {cpBusy ? '...' : 'Apply'}
              </button>
            </div>
          )}
          {cpErr && <p style={{ color:'#ff6b6b', fontSize:12, marginTop:6 }}>⚠️ {cpErr}</p>}
          <p style={{ color:'#5a2a1a', fontSize:11, marginTop:6 }}>Try: WELCOME10 · PYCSAVE20 · FLAT50</p>
        </div>

        {/* Bill */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:16, padding:'16px', marginBottom:80 }}>
          <p style={{ fontWeight:800, color:'#fff', marginBottom:14, fontSize:16 }}>📋 Bill Summary</p>
          {[
            { label:'Subtotal · సబ్‌టోటల్', val:`₹${subtotal.toFixed(0)}`, te:true },
            { label:'Delivery Fee · డెలివరీ ఛార్జ్', val: subtotal>=500 ? '🎉 FREE' : `₹${deliveryFee}`, te:true, free:subtotal>=500 },
            ...(discount > 0 ? [{ label:`Coupon (${applied?.code})`, val:`−₹${discount}`, green:true }] : []),
          ].map((r,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:10, fontSize:14 }}>
              <span style={{ color:'#7a3f2a', fontFamily: r.te ? 'inherit' : undefined }}>{r.label}</span>
              <span style={{ fontWeight:600, color: r.green ? '#22c55e' : r.free ? '#22c55e' : '#fff' }}>{r.val}</span>
            </div>
          ))}
          <div style={{ height:1, background:'#1a0800', margin:'12px 0' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:20, fontWeight:800 }}>
            <span style={{ color:'#fff' }}>Total</span>
            <span style={{ color:'#FF3008' }}>₹{Math.max(0,total).toFixed(0)}</span>
          </div>
          {subtotal < 500 && <p style={{ color:'#5a2a1a', fontSize:11, marginTop:6 }}>Add ₹{(500-subtotal).toFixed(0)} more for FREE delivery!</p>}
        </div>
      </div>

      {/* Checkout Button */}
      <div style={{ position:'fixed', bottom:20, left:16, right:16 }}>
        <button onClick={() => nav('/checkout')} style={{ width:'100%', background:'#FF3008', color:'#fff', border:'none', borderRadius:16, padding:'16px', fontWeight:800, fontSize:16, cursor:'pointer', boxShadow:'0 8px 32px rgba(255,48,8,.4)' }}>
          Proceed to Checkout → ₹{Math.max(0,total).toFixed(0)}
        </button>
      </div>
    </div>
  )
}
