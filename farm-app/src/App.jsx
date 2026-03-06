import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { FarmAuthProvider, useFarmAuth } from './context/FarmAuthContext'
import { FarmSocketProvider } from './context/FarmSocketContext'
import FarmLoginPage  from './pages/FarmLoginPage'
import FarmDashboard  from './pages/FarmDashboard'

function Private({ children }) {
  const { owner, loading } = useFarmAuth()
  if (loading) return <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#020d02',color:'#22c55e',fontSize:40 }}>🌾</div>
  return owner ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <FarmAuthProvider>
        <FarmSocketProvider>
          <Routes>
            <Route path="/login" element={<FarmLoginPage />} />
            <Route path="/*"     element={<Private><FarmDashboard /></Private>} />
          </Routes>
        </FarmSocketProvider>
      </FarmAuthProvider>
    </BrowserRouter>
  )
}
