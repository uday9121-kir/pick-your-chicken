import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import api from '../utils/api'

const SLOTS = ['6:00 AM – 8:00 AM', '8:00 AM – 10:00 AM', '3:00 PM – 5:00 PM', '5:00 PM – 7:00 PM']
const SLOT_TE = ['ఉదయం 6-8', 'ఉదయం 8-10', 'సాయంత్రం 3-5', 'సాయంత్రం 5-7']

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart()
  const nav = useNavigate()
  const [addresses, setAddresses] = useState([])
  const [selAddr, setSelAddr]     = useState(null)
  const [showAddForm, setShowForm]= useState(false)
  const [slot, setSlot]           = useState(0)
  const [payment, setPayment]     = useState('cod')
  const [busy, setBusy]           = useState(false)
  const [err, setErr]             = useState('')
  const [form, setForm]           = useState({ label:'Home', line1:'', area:'Madhapur', city:'Hyderabad', state:'Telangana', pin:'500081' })

  const deliveryFee = subtotal >= 500 ? 0 : 30
  const total       = subtotal + deliveryFee

  useEffect(() => {
    api.get('/api/addresses').then(d => { setAddresses(d); if(d[0]) setSelAddr(d[0].id) }).catch(()=>{})
  }, [])

  const saveAddr = async () => {
    if (!form.line1) return alert('Enter address')
    try {
      const r = await api.post('/api/addresses', { ...form, is_default: true })
      setAddresses(p => [r, ...p])
      setSelAddr(r.id); setShowForm(false)
    } catch(e) { alert(e.message) }
  }

  const placeOrder = async () => {
    if (!selAddr) return setErr('Please add delivery address')
    setErr(''); setBusy(true)
    try {
      const addr = addresses.find(a => a.id === selAddr)
      const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1)
      const r = await api.post('/api/orders', {
        items: items.map(i => ({ product_id: i.product_id, qty: i.qty })),
        address_snapshot: addr,
        delivery_date: tomorrow.toISOString().split('T')[0],
        delivery_slot: SLOTS[slot],
        payment_method: payment,
      })
      clear()
      nav(`/orders/${r.id}?new=1`)
    } catch(e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  const row = (label, val, bold) => (
    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:14 }}>
      <span style={{ color:'#7a3f2a' }}>{label}</span>
      <span style={{ fontWeight: bold?800:600, color: bold?'#FF3008':'#fff' }}>{val}</span>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#090200' }}>
      <div style={{ position:'sticky', top:0, background:'rgba(9,2,0,.95)', borderBottom:'1px solid #1a0800', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <button onClick={() => nav('/cart')} style={{ background:'#120500', border:'1px solid #1a0800', color:'#fff', borderRadius:8, padding:'6px 12px', cursor:'pointer', fontSize:18 }}>←</button>
        <h1 style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:20, color:'#fff' }}>📋 Checkout</h1>
      </div>

      <div style={{ padding:'16px', paddingBottom:100 }}>
        {/* Delivery Address */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:18, padding:'16px', marginBottom:14 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ fontWeight:800, color:'#fff', fontSize:16 }}>📍 Delivery Address</p>
            <button onClick={() => setShowForm(p=>!p)} style={{ background:'#FF3008', color:'#fff', border:'none', borderRadius:8, padding:'5px 12px', fontSize:12, cursor:'pointer', fontWeight:700 }}>
              {showAddForm ? 'Cancel' : '+ Add New'}
            </button>
          </div>
          {showAddForm && (
            <div style={{ background:'#0d0300', borderRadius:12, padding:14, marginBottom:14 }}>
              {[['line1','Street Address *','12-3 Main St, Apartment 5'],['area','Area','Madhapur'],['pin','PIN Code','500081']].map(([k,lbl,ph]) => (
                <div key={k} style={{ marginBottom:10 }}>
                  <label style={{ fontSize:11, color:'#7a3f2a', fontWeight:700, display:'block', marginBottom:4 }}>{lbl}</label>
                  <input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                    style={{ width:'100%', background:'#120500', border:'1px solid #2a0e00', borderRadius:8, padding:'9px 12px', color:'#fff', fontSize:13, outline:'none' }}/>
                </div>
              ))}
              <button onClick={saveAddr} style={{ background:'#22c55e', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', fontWeight:700, fontSize:14, cursor:'pointer' }}>Save Address</button>
            </div>
          )}
          {addresses.length === 0 ? (
            <p style={{ color:'#5a2a1a', fontSize:13, textAlign:'center', padding:'12px 0' }}>No addresses saved. Add one above.</p>
          ) : addresses.map(a => (
            <div key={a.id} onClick={() => setSelAddr(a.id)} style={{ padding:'12px 14px', borderRadius:12, border:`1.5px solid ${selAddr===a.id?'#FF3008':'#1a0800'}`, background: selAddr===a.id?'rgba(255,48,8,.08)':'transparent', cursor:'pointer', marginBottom:8, transition:'all .2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${selAddr===a.id?'#FF3008':'#5a2a1a'}`, background:selAddr===a.id?'#FF3008':'transparent', flexShrink:0 }}/>
                <span style={{ fontWeight:700, color:'#fff', fontSize:14 }}>{a.label}</span>
              </div>
              <p style={{ color:'#7a3f2a', fontSize:13, paddingLeft:24 }}>{a.line1}{a.area?', '+a.area:''}, {a.city} – {a.pin}</p>
            </div>
          ))}
        </div>

        {/* Delivery Slot */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:18, padding:'16px', marginBottom:14 }}>
          <p style={{ fontWeight:800, color:'#fff', fontSize:16, marginBottom:12 }}>⏰ Delivery Slot (Tomorrow)</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            {SLOTS.map((s,i) => (
              <div key={i} onClick={() => setSlot(i)} style={{ padding:'10px 12px', borderRadius:10, border:`1.5px solid ${slot===i?'#FF3008':'#1a0800'}`, background:slot===i?'rgba(255,48,8,.08)':'transparent', cursor:'pointer', transition:'all .2s' }}>
                <div style={{ fontWeight:700, fontSize:13, color:slot===i?'#FF3008':'#fff' }}>{s}</div>
                <div style={{ fontFamily:'Noto Sans Telugu,sans-serif', fontSize:11, color:'#7a3f2a', marginTop:2 }}>{SLOT_TE[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:18, padding:'16px', marginBottom:14 }}>
          <p style={{ fontWeight:800, color:'#fff', fontSize:16, marginBottom:12 }}>💳 Payment Method</p>
          {[{ id:'cod', label:'Cash on Delivery', sub:'Pay when your order arrives', icon:'💵' },{ id:'upi', label:'UPI / Online', sub:'Pay now via UPI, Card, NetBanking', icon:'📱', badge:'POPULAR' }].map(m => (
            <div key={m.id} onClick={() => setPayment(m.id)} style={{ padding:'12px 14px', borderRadius:12, border:`1.5px solid ${payment===m.id?'#FF3008':'#1a0800'}`, background:payment===m.id?'rgba(255,48,8,.08)':'transparent', cursor:'pointer', marginBottom:8, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${payment===m.id?'#FF3008':'#5a2a1a'}`, background:payment===m.id?'#FF3008':'transparent', flexShrink:0 }}/>
              <span style={{ fontSize:22 }}>{m.icon}</span>
              <div style={{ flex:1 }}>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontWeight:700, color:'#fff', fontSize:14 }}>{m.label}</span>
                  {m.badge && <span style={{ background:'rgba(255,48,8,.2)', color:'#FF3008', fontSize:9, fontWeight:800, padding:'2px 6px', borderRadius:4 }}>{m.badge}</span>}
                </div>
                <p style={{ color:'#7a3f2a', fontSize:12, marginTop:1 }}>{m.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div style={{ background:'#120500', border:'1.5px solid #1a0800', borderRadius:16, padding:'16px', marginBottom:14 }}>
          {row('Subtotal', `₹${subtotal.toFixed(0)}`)}
          {row('Delivery', subtotal>=500?'🎉 FREE':`₹${deliveryFee}`)}
          <div style={{ height:1, background:'#1a0800', margin:'8px 0' }}/>
          {row('Total Amount', `₹${total.toFixed(0)}`, true)}
        </div>

        {err && <div style={{ background:'rgba(255,48,8,.1)', border:'1px solid rgba(255,48,8,.3)', borderRadius:10, padding:'10px 14px', marginBottom:12, color:'#ff6b4a', fontSize:13 }}>⚠️ {err}</div>}
      </div>

      {/* Place Order */}
      <div style={{ position:'fixed', bottom:20, left:16, right:16 }}>
        <button onClick={placeOrder} disabled={busy} style={{ width:'100%', background:busy?'#5a1a08':'#FF3008', color:'#fff', border:'none', borderRadius:16, padding:'16px', fontWeight:800, fontSize:16, cursor:busy?'not-allowed':'pointer', boxShadow:'0 8px 32px rgba(255,48,8,.4)' }}>
          {busy ? '⏳ Placing Order...' : `🐔 Place Order · ₹${total.toFixed(0)}`}
        </button>
      </div>
    </div>
  )
}
