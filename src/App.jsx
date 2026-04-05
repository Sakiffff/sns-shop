import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import Home from './pages/Home'
import Auth from './pages/Auth'
import SupplierOnboarding from './pages/SupplierOnboarding'
import SupplierProfile from './pages/SupplierProfile'
import ChatPage from './pages/ChatPage'
import AdminDashboard from './pages/AdminDashboard'
import Chats from './pages/Chats'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, isAdmin } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/become-supplier" element={<ProtectedRoute><SupplierOnboarding /></ProtectedRoute>} />
            <Route path="/supplier/:id" element={<SupplierProfile />} />
            <Route path="/chat/:supplierId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
            <Route path="/admin-sns-panel" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}