import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, LayoutDashboard } from 'lucide-react'

export default function Navbar() {
  const { user, userProfile, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() { await logout(); navigate('/') }

  function getDashboardLink() {
    if (isAdmin) return '/admin-sns-panel'
    if (userProfile?.role === 'supplier') return '/supplier'
    return '/buyer'
  }

  return (
    <>
      <div className="disclaimer-bar">
        ⚠️ We are improving payments & shipment solutions. Transactions and logistics are handled directly between buyers and suppliers.
      </div>
      <nav className="bg-white border-b border-sand-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
              <span className="text-sand-50 font-display font-bold text-sm">S</span>
            </div>
            <span className="font-display font-semibold text-forest-900 text-lg">S&S Shop</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <Link to={getDashboardLink()} className="btn-ghost">
                  <LayoutDashboard size={16} />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button onClick={handleLogout} className="btn-ghost text-sand-600">
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn-ghost">Login</Link>
                <Link to="/auth?mode=signup" className="btn-primary">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  )
}