import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { CountryProvider } from './contexts/CountryContext'
import Home from './pages/Home'
import Auth from './pages/Auth'
import MyPosts from './pages/MyPosts'
import SupplierProfile from './pages/SupplierProfile'
import PostDetail from './pages/PostDetail'
import ChatPage from './pages/ChatPage'
import AdminDashboard from './pages/AdminDashboard'
import Chats from './pages/Chats'
import ProfilePage from './pages/ProfilePage'
import HowItWorks from './pages/HowItWorks'
import OrderConfirmation from './pages/OrderConfirmation'
import MyOrders from './pages/MyOrders'

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
        <CountryProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/my-posts" element={<ProtectedRoute><MyPosts /></ProtectedRoute>} />
              <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
              <Route path="/order-confirm" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/supplier/:id" element={<SupplierProfile />} />
              <Route path="/post/:postId" element={<PostDetail />} />
              <Route path="/chat/:supplierId" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
              <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
              <Route path="/admin-sns-panel" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CartProvider>
        </CountryProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}