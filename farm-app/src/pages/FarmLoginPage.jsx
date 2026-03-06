import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFarmAuth } from '../context/FarmAuthContext'

export default function FarmLoginPage() {
  const { login }       = useFarmAuth()
  const nav             = useNavigate()
  const [email, setEmail]     = useState('')
  const [password, setPass]   = useState('')
  const [err, setErr]         = useState('')
  const [busy, setBusy]       = useState(false)

  const submit = async () => {
    setErr(''); setBusy(true)
    try { await login({ email, password }); nav('/') }
    catch(e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#020d02', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:380 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:64, marginBottom:12 }} className="anim-float">🌾</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:26, fontWeight:900, color:'#fff', marginBottom:4 }}>Farm Dashboard</h1>
          <p style={{ color:'#166534', fontSize:14 }}>Pick Your Chicken · Farm Owner Portal</p>
        </div>

        <div style={{ background:'#051505', border:'1.5px solid #0a2a0a', borderRadius:20, padding:28 }}>
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'#166534', fontWeight:700, display:'block', marginBottom:6 }}>Email Address</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="owner@pickyourchicken.com" type="email"
              style={{ width:'100%', background:'#030e03', border:'1px solid #0a2a0a', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:15, outline:'none' }}/>
          </div>
          <div style={{ marginBottom:22 }}>
            <label style={{ fontSize:12, color:'#166534', fontWeight:700, display:'block', marginBottom:6 }}>Password</label>
            <input value={password} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="Enter password" type="password"
              style={{ width:'100%', background:'#030e03', border:'1px solid #0a2a0a', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:15, outline:'none' }}/>
          </div>

          {err && <div style={{ background:'rgba(255,68,68,.1)', border:'1px solid rgba(255,68,68,.3)', borderRadius:10, padding:'10px 14px', marginBottom:16, color:'#f87171', fontSize:13 }}>⚠️ {err}</div>}

          <button onClick={submit} disabled={busy} style={{ width:'100%', background:busy?'#0a2a0a':'#22c55e', color:'#000', border:'none', borderRadius:12, padding:'14px 0', fontSize:16, fontWeight:800, cursor:busy?'not-allowed':'pointer' }}>
            {busy ? '⏳ Logging in...' : '🌾 Enter Farm Dashboard'}
          </button>

          <div style={{ background:'#030e03', border:'1px dashed #0a2a0a', borderRadius:10, padding:'10px 14px', marginTop:16, textAlign:'center' }}>
            <p style={{ fontSize:11, color:'#166534', marginBottom:3 }}>Demo Credentials</p>
            <p style={{ fontSize:12, color:'#22c55e', fontWeight:600 }}>owner@pickyourchicken.com / farm123</p>
            <button onClick={() => { setEmail('owner@pickyourchicken.com'); setPass('farm123') }}
              style={{ background:'#0a2a0a', border:'1px solid #166534', borderRadius:7, padding:'5px 14px', color:'#22c55e', fontSize:12, cursor:'pointer', marginTop:6, fontWeight:700 }}>
              Fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
