import { useState, useEffect, useCallback } from 'react'
import { useFarmAuth } from '../context/FarmAuthContext'
import { useFarmSocket } from '../context/FarmSocketContext'
import api from '../utils/api'

const G = '#22c55e'
const STATUS_NEXT = { placed:'confirmed', confirmed:'preparing', preparing:'out_for_delivery', out_for_delivery:'delivered' }
const STATUS_LABELS = { placed:'New Order!', confirmed:'Confirmed', preparing:'Preparing', out_for_delivery:'Out for Delivery', delivered:'Delivered', cancelled:'Cancelled' }
const STATUS_COLORS = {
  placed:           { bg:'rgba(255,184,0,.15)', color:'#FFB800' },
  confirmed:        { bg:'rgba(59,130,246,.15)', color:'#60a5fa' },
  preparing:        { bg:'rgba(168,85,247,.15)', color:'#c084fc' },
  out_for_delivery: { bg:'rgba(34,197,94,.15)', color:'#22c55e' },
  delivered:        { bg:'rgba(34,197,94,.1)', color:'#22c55e' },
  cancelled:        { bg:'rgba(255,68,68,.1)', color:'#f87171' },
}
const BTN_LABELS = { placed:'✅ Accept Order', confirmed:'🔪 Start Cutting', preparing:'🛵 Send for Delivery', out_for_delivery:'✅ Mark Delivered' }

export default function FarmDashboard() {
  const { owner, logout, toggleOpen } = useFarmAuth()
  const { connected, newOrders, unread, clearUnread } = useFarmSocket()
  const [tab, setTab]       = useState('orders')
  const [orders, setOrders] = useState([])
  const [products, setProds]= useState([])
  const [stats, setStats]   = useState(null)
  const [filter, setFilter] = useState('active')
  const [expanded, setExp]  = useState(null)
  const [driver, setDriver] = useState({ name:'', phone:'', eta:30 })
  const [editPrice, setEditP]= useState({})
  const [busy, setBusy]     = useState({})

  const loadOrders = useCallback(() =>
    api.get('/api/orders/farm/all').then(d => setOrders(d)).catch(()=>{}),
  [])

  useEffect(() => { loadOrders() }, [])
  useEffect(() => { if (newOrders.length) { loadOrders() } }, [newOrders])
  useEffect(() => {
    if (tab==='products') api.get('/api/products/all').then(setProds).catch(()=>{})
    if (tab==='analytics') api.get('/api/orders/farm/stats').then(setStats).catch(()=>{})
  }, [tab])

  const filteredOrders = orders.filter(o => {
    if (filter === 'active')   return ['placed','confirmed','preparing'].includes(o.status)
    if (filter === 'delivery') return o.status === 'out_for_delivery'
    if (filter === 'done')     return ['delivered','cancelled'].includes(o.status)
    return true
  })

  const updateStatus = async (orderId, status) => {
    setBusy(p => ({ ...p, [orderId]: true }))
    try {
      const payload = { status }
      if (status === 'out_for_delivery') {
        payload.driver_name  = driver.name  || 'Farm Delivery'
        payload.driver_phone = driver.phone || owner?.phone || ''
        payload.eta_minutes  = parseInt(driver.eta) || 30
      }
      await api.patch(`/api/orders/farm/${orderId}/status`, payload)
      loadOrders()
    } catch(e) { alert(e.message) }
    finally { setBusy(p => ({ ...p, [orderId]: false })) }
  }

  const toggleProduct = async (pid) => {
    await api.patch(`/api/products/${pid}/toggle`)
    setProds(p => p.map(x => x.id===pid ? { ...x, is_available:!x.is_available } : x))
  }

  const savePrice = async (pid) => {
    await api.patch(`/api/products/${pid}`, { price: editPrice[pid] })
    setProds(p => p.map(x => x.id===pid ? { ...x, price:editPrice[pid] } : x))
    setEditP(p => { const n={...p}; delete n[pid]; return n })
  }

  const BtnRow = ({ label, active, onClick }) => (
    <button onClick={onClick} style={{ padding:'7px 16px', borderRadius:50, border:`1.5px solid`, fontWeight:700, fontSize:12, cursor:'pointer', transition:'all .2s', whiteSpace:'nowrap',
      background:active?G:'#030e03', borderColor:active?G:'#0a2a0a', color:active?'#000':'#22c55e'
    }}>{label}</button>
  )

  return (
    <div style={{ minHeight:'100vh', background:'#020d02' }}>
      {/* Header */}
      <div style={{ background:'rgba(2,13,2,.95)', borderBottom:'1px solid #0a2a0a', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:28 }}>🌾</span>
          <div>
            <p style={{ fontFamily:'Syne,sans-serif', fontWeight:800, fontSize:17, color:'#fff' }}>{owner?.farm_name}</p>
            <div style={{ display:'flex', gap:6, alignItems:'center' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:connected?G:'#ef4444', display:'inline-block' }}/>
              <span style={{ fontSize:11, color:connected?G:'#ef4444', fontWeight:600 }}>{connected?'Live':'Reconnecting...'}</span>
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <button onClick={toggleOpen} style={{ background:owner?.is_open?'rgba(34,197,94,.15)':'rgba(255,68,68,.1)', border:`1.5px solid ${owner?.is_open?G:'#ef4444'}`, color:owner?.is_open?G:'#ef4444', borderRadius:10, padding:'7px 14px', fontWeight:800, fontSize:13, cursor:'pointer' }}>
            {owner?.is_open ? '🟢 OPEN' : '🔴 CLOSED'}
          </button>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #0a2a0a', color:'#166534', borderRadius:8, padding:'7px 10px', fontSize:12, cursor:'pointer' }}>Out</button>
        </div>
      </div>

      {/* New order banner */}
      {unread > 0 && (
        <div style={{ background:'rgba(34,197,94,.1)', border:'1.5px solid rgba(34,197,94,.3)', margin:'12px 16px', borderRadius:14, padding:'12px 16px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ color:G, fontWeight:700, fontSize:14 }}>🔔 {unread} new order{unread>1?'s':''} arrived!</p>
          <button onClick={() => { setTab('orders'); setFilter('active'); clearUnread() }}
            style={{ background:G, color:'#000', border:'none', borderRadius:8, padding:'6px 14px', fontWeight:800, cursor:'pointer', fontSize:13 }}>View Now</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', background:'#030e03', borderBottom:'1px solid #0a2a0a', padding:'0 16px' }}>
        {[['orders','📦 Orders',unread],['products','🐔 Products',0],['analytics','📊 Analytics',0]].map(([t,l,badge]) => (
          <button key={t} onClick={() => { setTab(t); if(t==='orders') clearUnread() }} style={{ padding:'12px 16px', border:'none', background:'transparent', cursor:'pointer', fontWeight:700, fontSize:14, transition:'all .2s', borderBottom:`2.5px solid ${tab===t?G:'transparent'}`, color:tab===t?G:'#166534', position:'relative' }}>
            {l}
            {badge>0 && <span style={{ position:'absolute', top:6, right:4, background:'#ef4444', color:'#fff', borderRadius:'50%', width:16, height:16, fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800 }}>{badge}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding:'16px' }}>
        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <>
            <div style={{ display:'flex', gap:8, marginBottom:16, overflowX:'auto', paddingBottom:4 }}>
              {[['active','🔥 Active'],['delivery','🛵 On Way'],['done','✅ Done'],['all','📋 All']].map(([f,l]) => (
                <BtnRow key={f} label={l} active={filter===f} onClick={() => setFilter(f)}/>
              ))}
            </div>

            {filteredOrders.length === 0 ? (
              <div style={{ textAlign:'center', padding:60, color:'#166534' }}>
                <div style={{ fontSize:40 }}>📭</div>
                <p style={{ marginTop:12 }}>No {filter} orders</p>
              </div>
            ) : filteredOrders.map(o => {
              const sc = STATUS_COLORS[o.status] || STATUS_COLORS.placed
              const isNew = o.status === 'placed'
              const nextStatus = STATUS_NEXT[o.status]
              const isExpanded = expanded === o.id
              return (
                <div key={o.id} style={{ background:'#051505', border:`1.5px solid ${isNew?'rgba(255,184,0,.4)':'#0a2a0a'}`, borderRadius:18, overflow:'hidden', marginBottom:12 }}>
                  <div onClick={() => setExp(isExpanded ? null : o.id)} style={{ padding:'14px 16px', cursor:'pointer' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                      <div>
                        <span style={{ fontFamily:'Syne,sans-serif', fontWeight:800, color:'#fff', fontSize:16 }}>#{o.order_number}</span>
                        {isNew && <span style={{ marginLeft:8, background:'rgba(255,184,0,.2)', color:'#FFB800', padding:'2px 8px', borderRadius:6, fontSize:10, fontWeight:800 }}>NEW!</span>}
                      </div>
                      <span style={{ ...sc, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:800 }}>{STATUS_LABELS[o.status]}</span>
                    </div>
                    <p style={{ color:'#fff', fontWeight:600, fontSize:14, marginBottom:2 }}>👤 {o.customer_name} · 📱 {o.customer_phone}</p>
                    <p style={{ color:'#166534', fontSize:12 }}>🐔 {o.items?.slice(0,2).map(i=>i.name).join(', ')}{o.items?.length>2?` +${o.items.length-2} more`:''}</p>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                      <span style={{ color:G, fontWeight:800, fontSize:16 }}>₹{parseFloat(o.total).toFixed(0)}</span>
                      <span style={{ color:'#166534', fontSize:12 }}>{new Date(o.created_at).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</span>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ borderTop:'1px solid #0a2a0a', padding:'14px 16px' }}>
                      {/* Items */}
                      <p style={{ color:G, fontWeight:700, fontSize:13, marginBottom:8 }}>Order Items:</p>
                      {o.items?.map((item,i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', marginBottom:6, fontSize:13 }}>
                          <span style={{ color:'#e2e8f0' }}>{item.icon} {item.name} × {item.quantity}{item.unit}</span>
                          <span style={{ color:'#fff', fontWeight:700 }}>₹{parseFloat(item.total).toFixed(0)}</span>
                        </div>
                      ))}

                      {/* Delivery info */}
                      {o.address_snapshot && (
                        <div style={{ background:'#030e03', borderRadius:10, padding:'10px 12px', margin:'10px 0', fontSize:12 }}>
                          <p style={{ color:G, fontWeight:700, marginBottom:4 }}>📍 Delivery Address</p>
                          <p style={{ color:'#94a3b8' }}>{o.address_snapshot.line1}{o.address_snapshot.area?', '+o.address_snapshot.area:''}, {o.address_snapshot.city}</p>
                        </div>
                      )}

                      {/* Delivery slot */}
                      {o.delivery_slot && (
                        <p style={{ color:'#94a3b8', fontSize:12, marginBottom:10 }}>⏰ Slot: {o.delivery_slot}</p>
                      )}

                      {/* Driver form when going to delivery */}
                      {o.status === 'preparing' && (
                        <div style={{ background:'#030e03', borderRadius:12, padding:'12px', margin:'10px 0' }}>
                          <p style={{ color:G, fontWeight:700, fontSize:13, marginBottom:10 }}>🛵 Driver Details (before sending)</p>
                          {[['name','Driver Name','Ravi'],['phone','Driver Phone','9876500001'],['eta','ETA (minutes)','30']].map(([k,l,ph]) => (
                            <div key={k} style={{ marginBottom:8 }}>
                              <label style={{ fontSize:11, color:'#166534', display:'block', marginBottom:3 }}>{l}</label>
                              <input value={driver[k]} onChange={e=>setDriver(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                                style={{ width:'100%', background:'#051505', border:'1px solid #0a2a0a', borderRadius:8, padding:'8px 12px', color:'#fff', fontSize:13, outline:'none' }}/>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action button */}
                      {nextStatus && o.status !== 'cancelled' && (
                        <button onClick={() => updateStatus(o.id, nextStatus)} disabled={busy[o.id]} style={{ width:'100%', background:busy[o.id]?'#0a2a0a':G, color:busy[o.id]?G:'#000', border:'none', borderRadius:12, padding:'12px', fontWeight:800, fontSize:15, cursor:busy[o.id]?'not-allowed':'pointer', marginTop:6, transition:'all .2s' }}>
                          {busy[o.id] ? '⏳ Updating...' : BTN_LABELS[o.status]}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        )}

        {/* ── PRODUCTS TAB ── */}
        {tab === 'products' && (
          <>
            <p style={{ color:'#166534', fontSize:13, marginBottom:14 }}>Toggle availability · Tap price to edit</p>
            {products.map(p => (
              <div key={p.id} style={{ background:'#051505', border:'1.5px solid #0a2a0a', borderRadius:16, padding:'14px 16px', marginBottom:10, display:'flex', alignItems:'center', gap:14 }}>
                <span style={{ fontSize:32 }}>{p.icon}</span>
                <div style={{ flex:1 }}>
                  <p style={{ fontWeight:700, color:'#fff', fontSize:15 }}>{p.name}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4 }}>
                    {editPrice[p.id] !== undefined ? (
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <span style={{ color:'#166534', fontSize:13 }}>₹</span>
                        <input value={editPrice[p.id]} onChange={e=>setEditP(prev=>({...prev,[p.id]:e.target.value}))} style={{ width:72, background:'#030e03', border:'1px solid #0a2a0a', borderRadius:6, padding:'4px 8px', color:G, fontSize:14, fontWeight:700, outline:'none' }}/>
                        <button onClick={()=>savePrice(p.id)} style={{ background:G, color:'#000', border:'none', borderRadius:6, padding:'4px 10px', fontWeight:700, cursor:'pointer', fontSize:12 }}>Save</button>
                        <button onClick={()=>setEditP(prev=>{const n={...prev};delete n[p.id];return n})} style={{ background:'transparent', border:'1px solid #0a2a0a', color:'#166534', borderRadius:6, padding:'4px 8px', cursor:'pointer', fontSize:12 }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={()=>setEditP(prev=>({...prev,[p.id]:p.price}))} style={{ background:'transparent', border:'none', color:G, fontWeight:800, fontSize:15, cursor:'pointer', padding:0 }}>
                        ₹{p.price}/{p.unit} ✏️
                      </button>
                    )}
                  </div>
                </div>
                <div onClick={()=>toggleProduct(p.id)} style={{ width:44, height:24, borderRadius:12, background:p.is_available?G:'#0a2a0a', position:'relative', cursor:'pointer', transition:'all .2s', border:`1.5px solid ${p.is_available?G:'#166534'}` }}>
                  <div style={{ position:'absolute', top:2, left:p.is_available?22:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s' }}/>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ── ANALYTICS TAB ── */}
        {tab === 'analytics' && (
          <>
            {!stats ? (
              <div style={{ textAlign:'center', padding:60, color:'#166534' }}>
                <div style={{ fontSize:36 }} className="anim-float">📊</div>
                <p style={{ marginTop:12 }}>Loading stats...</p>
              </div>
            ) : (
              <>
                {/* Today stats */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
                  {[
                    { label:"Today's Orders", val:stats.today.orders, icon:'📦', color:G },
                    { label:"Today's Revenue", val:`₹${stats.today.revenue?.toFixed(0)||0}`, icon:'💰', color:'#FFB800' },
                    { label:'Pending Orders', val:stats.pending, icon:'⏳', color:'#f87171' },
                    { label:'Total Customers', val:stats.total_customers, icon:'👥', color:'#60a5fa' },
                  ].map((s,i) => (
                    <div key={i} style={{ background:'#051505', border:'1.5px solid #0a2a0a', borderRadius:16, padding:'16px', textAlign:'center' }}>
                      <div style={{ fontSize:28, marginBottom:6 }}>{s.icon}</div>
                      <div style={{ fontSize:24, fontWeight:900, color:s.color, fontFamily:'Syne,sans-serif' }}>{s.val}</div>
                      <div style={{ fontSize:11, color:'#166534', marginTop:2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* 7-day chart */}
                <div style={{ background:'#051505', border:'1.5px solid #0a2a0a', borderRadius:18, padding:16, marginBottom:16 }}>
                  <p style={{ fontWeight:800, color:'#fff', fontSize:15, marginBottom:16 }}>📈 Last 7 Days Revenue</p>
                  {stats.weekly.length === 0 ? (
                    <p style={{ color:'#166534', textAlign:'center', padding:20 }}>No data yet — start getting orders!</p>
                  ) : (
                    <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:100 }}>
                      {stats.weekly.map((d,i) => {
                        const maxRev = Math.max(...stats.weekly.map(x=>parseFloat(x.revenue)||0), 1)
                        const h = Math.max(8, (parseFloat(d.revenue)/maxRev)*100)
                        const day = new Date(d.day).toLocaleDateString('en-IN',{weekday:'short'})
                        return (
                          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                            <span style={{ color:G, fontSize:10, fontWeight:700 }}>₹{parseInt(parseFloat(d.revenue)/1000)}k</span>
                            <div style={{ width:'100%', background:G, borderRadius:'4px 4px 0 0', height:`${h}%`, transition:'height .5s', minHeight:8 }}/>
                            <span style={{ color:'#166534', fontSize:10 }}>{day}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Top products */}
                {stats.top_products.length > 0 && (
                  <div style={{ background:'#051505', border:'1.5px solid #0a2a0a', borderRadius:18, padding:16 }}>
                    <p style={{ fontWeight:800, color:'#fff', fontSize:15, marginBottom:12 }}>🏆 Top Selling (30 days)</p>
                    {stats.top_products.map((p,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom: i<stats.top_products.length-1?'1px solid #0a2a0a':'none' }}>
                        <span style={{ color:'#e2e8f0', fontSize:14 }}>{p.icon} {p.name}</span>
                        <span style={{ color:G, fontWeight:800, fontSize:14 }}>{parseFloat(p.sold).toFixed(1)} units</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
