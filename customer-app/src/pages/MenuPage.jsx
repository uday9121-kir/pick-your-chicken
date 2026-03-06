import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'

const S = {
  bg:     { minHeight:'100vh', background:'#090200' },
  header: { position:'sticky', top:0, zIndex:50, background:'rgba(9,2,0,.95)', backdropFilter:'blur(8px)', borderBottom:'1px solid #1a0800', padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  logo:   { fontFamily:'Syne,sans-serif', fontWeight:900, fontSize:20, color:'#fff', display:'flex', alignItems:'center', gap:8 },
  card:   { background:'#120500', border:'1.5px solid #1a0800', borderRadius:18, padding:'16px', marginBottom:12, transition:'border-color .2s' },
  btn:    { background:'#FF3008', color:'#fff', border:'none', borderRadius:8, padding:'6px 14px', fontWeight:700, cursor:'pointer', fontSize:13 },
  pill:   { padding:'4px 10px', borderRadius:50, fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'.05em' },
}

export default function MenuPage() {
  const { items: cartItems, add, remove, count, subtotal } = useCart()
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [products, setProducts]     = useState([])
  const [categories, setCategories] = useState([])
  const [activeCat, setActiveCat]   = useState('all')
  const [search, setSearch]         = useState('')
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    api.get('/api/products').then(d => { setProducts(d.products); setCategories(d.categories) }).finally(() => setLoading(false))
  }, [])

  const getQty = pid => cartItems.find(i => i.product_id === pid)?.qty || 0

  const filtered = products.filter(p => {
    const matchCat = activeCat === 'all' || p.cat_slug === activeCat
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.name_te||'').includes(search)
    return matchCat && matchSearch
  })

  const badgeColor = b => {
    if (!b) return null
    if (b.includes('BEST')) return { background:'rgba(255,184,0,.15)', color:'#FFB800' }
    if (b.includes('SAVE')) return { background:'rgba(34,197,94,.15)', color:'#22c55e' }
    if (b === 'POPULAR')    return { background:'rgba(255,48,8,.15)',  color:'#FF3008' }
    if (b === 'ORGANIC')    return { background:'rgba(34,197,94,.15)', color:'#22c55e' }
    return { background:'rgba(255,184,0,.15)', color:'#FFB800' }
  }

  return (
    <div style={S.bg}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.logo}><span>🐔</span> Pick Your Chicken</div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => nav('/orders')} style={{ background:'#1a0800', border:'1px solid #2a0e00', color:'#c0392b', borderRadius:8, padding:'6px 12px', fontSize:13, cursor:'pointer', fontWeight:600 }}>
            📦 Orders
          </button>
          <button onClick={logout} style={{ background:'transparent', border:'1px solid #2a0e00', color:'#7a3f2a', borderRadius:8, padding:'6px 10px', fontSize:12, cursor:'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding:'16px' }}>
        {/* Welcome */}
        <div style={{ marginBottom:16 }}>
          <p style={{ color:'#7a3f2a', fontSize:13 }}>👋 Hey {user?.name?.split(' ')[0]}!</p>
          <h2 style={{ fontFamily:'Syne,sans-serif', fontSize:22, fontWeight:800, color:'#fff' }}>Fresh Chicken Today 🐔</h2>
          <p style={{ fontFamily:'Noto Sans Telugu,sans-serif', color:'#c0392b', fontSize:13, marginTop:2 }}>రోజువారీ తాజా కోడి</p>
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:16 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16 }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chicken, eggs..."
            style={{ width:'100%', background:'#120500', border:'1px solid #1a0800', borderRadius:12, padding:'11px 14px 11px 38px', color:'#fff', fontSize:14, outline:'none' }}/>
        </div>

        {/* Categories */}
        <div style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
          {[{ slug:'all', name:'All', icon:'🍽️' }, ...categories].map(c => (
            <button key={c.slug} onClick={() => setActiveCat(c.slug)} style={{
              padding:'7px 16px', borderRadius:50, border:'1.5px solid', whiteSpace:'nowrap', fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s', flexShrink:0,
              background: activeCat===c.slug ? '#FF3008' : '#120500',
              borderColor: activeCat===c.slug ? '#FF3008' : '#2a0e00',
              color: activeCat===c.slug ? '#fff' : '#c0392b'
            }}>{c.icon} {c.name}</button>
          ))}
        </div>

        {/* Products */}
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'#7a3f2a' }}>
            <div style={{ fontSize:40, marginBottom:12 }} className="anim-float">🐔</div>
            <p>Loading fresh menu...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:60, color:'#7a3f2a' }}>
            <div style={{ fontSize:40 }}>🔍</div>
            <p style={{ marginTop:12 }}>No products found</p>
          </div>
        ) : filtered.map(p => {
          const qty = getQty(p.id)
          const bc  = badgeColor(p.badge)
          return (
            <div key={p.id} style={S.card}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:14 }}>
                <div style={{ fontSize:40, flexShrink:0 }}>{p.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                    <div>
                      <div style={{ fontWeight:700, fontSize:16, color:'#fff' }}>{p.name}</div>
                      <div style={{ fontFamily:'Noto Sans Telugu,sans-serif', fontSize:13, color:'#c0392b', marginTop:1 }}>{p.name_te}</div>
                    </div>
                    {p.badge && bc && (
                      <span style={{ ...S.pill, ...bc }}>{p.badge}</span>
                    )}
                  </div>
                  {p.description && <p style={{ fontSize:12, color:'#7a3f2a', marginTop:4 }}>{p.description}</p>}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10 }}>
                    <div>
                      <span style={{ fontSize:20, fontWeight:800, color:'#FF3008' }}>₹{p.price}</span>
                      <span style={{ fontSize:12, color:'#7a3f2a', marginLeft:4 }}>/{p.unit}</span>
                    </div>
                    {qty === 0 ? (
                      <button onClick={() => add(p)} style={{ ...S.btn, padding:'7px 18px', fontSize:14 }}>+ ADD</button>
                    ) : (
                      <div style={{ display:'flex', alignItems:'center', gap:0, background:'#FF3008', borderRadius:8, overflow:'hidden' }}>
                        <button onClick={() => remove(p.id)} style={{ background:'transparent', border:'none', color:'#fff', padding:'7px 12px', fontSize:18, cursor:'pointer', fontWeight:700 }}>−</button>
                        <span style={{ color:'#fff', fontWeight:800, fontSize:15, minWidth:24, textAlign:'center' }}>{qty}</span>
                        <button onClick={() => add(p)} style={{ background:'transparent', border:'none', color:'#fff', padding:'7px 12px', fontSize:18, cursor:'pointer', fontWeight:700 }}>+</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        <div style={{ height:100 }}/>
      </div>

      {/* Floating Cart Bar */}
      {count > 0 && (
        <div style={{ position:'fixed', bottom:20, left:16, right:16, zIndex:100 }}>
          <button onClick={() => nav('/cart')} style={{
            width:'100%', background:'#FF3008', color:'#fff', border:'none', borderRadius:16, padding:'16px 20px',
            display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer',
            boxShadow:'0 8px 32px rgba(255,48,8,.4)', fontSize:15, fontWeight:700
          }}>
            <span style={{ background:'rgba(255,255,255,.2)', borderRadius:8, padding:'2px 10px', fontWeight:800 }}>{count} items</span>
            <span>🛒 View Cart</span>
            <span>₹{subtotal.toFixed(0)} →</span>
          </button>
        </div>
      )}
    </div>
  )
}
