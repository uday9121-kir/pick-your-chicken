import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { SocketProvider } from './context/SocketContext'
import LoginPage        from './pages/LoginPage'
import MenuPage         from './pages/MenuPage'
import CartPage         from './pages/CartPage'
import CheckoutPage     from './pages/CheckoutPage'
import OrderTrackPage   from './pages/OrderTrackPage'
import OrdersListPage   from './pages/OrdersListPage'

function Private({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#090200',color:'#FF3008',fontSize:32}}>🐔</div>
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <SocketProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/"           element={<Private><MenuPage /></Private>} />
              <Route path="/cart"       element={<Private><CartPage /></Private>} />
              <Route path="/checkout"   element={<Private><CheckoutPage /></Private>} />
              <Route path="/orders"     element={<Private><OrdersListPage /></Private>} />
              <Route path="/orders/:id" element={<Private><OrderTrackPage /></Private>} />
              <Route path="*"           element={<Navigate to="/" replace />} />
            </Routes>
          </SocketProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
