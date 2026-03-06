import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login, register } = useAuth()
  const nav = useNavigate()
  const [mode, setMode]   = useState('login')
  const [form, setForm]   = useState({ name:'', phone:'', password:'' })
  const [err, setErr]     = useState('')
  const [busy, setBusy]   = useState(false)

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const submit = async () => {
    setErr(''); setBusy(true)
    try {
      if (mode === 'login') await login({ phone: form.phone, password: form.password })
      else await register({ name: form.name, phone: form.phone, password: form.password })
      nav('/')
    } catch(e) { setErr(e.message) }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#090200', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:64, marginBottom:12 }} className="anim-float">🐔</div>
          <h1 style={{ fontFamily:'Syne,sans-serif', fontSize:28, fontWeight:900, color:'#fff', marginBottom:4 }}>Pick Your Chicken</h1>
          <p style={{ fontFamily:'Noto Sans Telugu,sans-serif', color:'#c0392b', fontSize:16, fontWeight:700 }}>పిక్ యువర్ చికెన్</p>
          <p style={{ color:'#7a3f2a', fontSize:13, marginTop:6 }}>Farm fresh · Daily cut · Delivered to you</p>
        </div>

        {/* Card */}
        <div style={{ background:'#120500', border:'1.5px solid #2a0e00', borderRadius:20, padding:28 }}>
          {/* Tabs */}
          <div style={{ display:'flex', background:'#0d0300', borderRadius:12, padding:4, marginBottom:24 }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr('') }} style={{ flex:1, padding:'10px 0', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:14, transition:'all .2s',
                background: mode===m ? '#FF3008' : 'transparent',
                color: mode===m ? '#fff' : '#7a3f2a'
              }}>{m==='login' ? '🔑 Login' : '📝 Register'}</button>
            ))}
          </div>

          {/* Fields */}
          {mode==='register' && (
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#7a3f2a', fontWeight:700, display:'block', marginBottom:6 }}>Your Name · మీ పేరు</label>
              <input value={form.name} onChange={set('name')} placeholder="Ravi Kumar"
                style={{ width:'100%', background:'#0d0300', border:'1px solid #2a0e00', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:15, outline:'none' }}/>
            </div>
          )}
          <div style={{ marginBottom:14 }}>
            <label style={{ fontSize:12, color:'#7a3f2a', fontWeight:700, display:'block', marginBottom:6 }}>Phone Number · ఫోన్ నంబర్</label>
            <input value={form.phone} onChange={set('phone')} placeholder="9876543210" type="tel"
              style={{ width:'100%', background:'#0d0300', border:'1px solid #2a0e00', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:15, outline:'none' }}/>
          </div>
          <div style={{ marginBottom:22 }}>
            <label style={{ fontSize:12, color:'#7a3f2a', fontWeight:700, display:'block', marginBottom:6 }}>Password · పాస్‌వర్డ్</label>
            <input value={form.password} onChange={set('password')} placeholder="Enter password" type="password"
              style={{ width:'100%', background:'#0d0300', border:'1px solid #2a0e00', borderRadius:10, padding:'12px 14px', color:'#fff', fontSize:15, outline:'none' }}/>
          </div>

          {err && <div style={{ background:'rgba(255,48,8,.1)', border:'1px solid rgba(255,48,8,.3)', borderRadius:10, padding:'10px 14px', marginBottom:16, color:'#ff6b4a', fontSize:13 }}>⚠️ {err}</div>}

          <button onClick={submit} disabled={busy} style={{ width:'100%', background: busy ? '#5a1a08' : '#FF3008', color:'#fff', border:'none', borderRadius:12, padding:'14px 0', fontSize:16, fontWeight:800, cursor:busy?'not-allowed':'pointer', transition:'all .2s' }}>
            {busy ? '⏳ Please wait...' : mode==='login' ? '🚀 Login & Order' : '✅ Create Account'}
          </button>

          {/* Demo hint */}
          <div style={{ background:'#0d0300', border:'1px dashed #2a0e00', borderRadius:10, padding:'10px 14px', marginTop:16, textAlign:'center' }}>
            <p style={{ fontSize:11, color:'#5a2a1a', marginBottom:3 }}>Demo Account</p>
            <p style={{ fontSize:12, color:'#7a3f2a', fontWeight:600 }}>Phone: 9876543210 · Password: cust123</p>
            <button onClick={() => { setForm({ name:'', phone:'9876543210', password:'cust123' }); setMode('login') }}
              style={{ background:'#1a0800', border:'1px solid #2a0e00', borderRadius:7, padding:'5px 14px', color:'#FF3008', fontSize:12, cursor:'pointer', marginTop:6, fontWeight:700 }}>
              Fill Demo Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
