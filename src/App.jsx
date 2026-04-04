import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import BuyerDashboard from './pages/BuyerDashboard'
import SupplierDashboard from './pages/SupplierDashboard'
import SupplierProfile from './pages/SupplierProfile'
import ChatPage from './pages/ChatPage'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedRoute({ children, role }) {
  const { user, userProfile } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  if (role && userProfile?.role !== role) {
    if (userProfile?.role === 'buyer') return <Navigate to="/buyer" replace />
    if (userProfile?.role === 'supplier') return <Navigate to="/supplier" replace />
    if (userProfile?.role === 'admin') return <Navigate to="/admin-sns-panel" replace />
  }
  return children
}

function RoleRedirect() {
  const { user, userProfile } = useAuth()
  if (!user) return <Navigate to="/auth" replace />
  if (userProfile?.role === 'admin') return <Navigate to="/admin-sns-panel" replace />
  if (userProfile?.role === 'supplier') return <Navigate to="/supplier" replace />
  return <Navigate to="/buyer" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<RoleRedirect />} />
          <Route path="/buyer" element={<ProtectedRoute role="buyer"><BuyerDashboard /></ProtectedRoute>} />
          <Route path="/supplier" element={<ProtectedRoute role="supplier"><SupplierDashboard /></ProtectedRoute>} />
          <Route path="/supplier/:id" element={<SupplierProfile />} />
          <Route path="/chat/:supplierId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="/admin-sns-panel" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}