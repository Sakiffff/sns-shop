import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, MessageCircle, ShieldCheck, Store } from 'lucide-react'

export default function Navbar() {
  const { user, userProfile, logout, isAdmin, isSupplier } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <>
      <div className="disclaimer-bar">
        ⚠️ Payments & logistics are handled directly between buyers and suppliers. We are working on integrated solutions.
      </div>
      <nav className="bg-white border-b border-sand-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-forest-600 rounded-lg flex items-center justify-center">
              <span className="text-sand-50 font-display font-bold text-sm">S</span>
            </div>
            <span className="font-display font-semibold text-forest-900 text-lg">S&S Shop</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Chats */}
                <Link to="/chats" className="btn-ghost">
                  <MessageCircle size={16} />
                  <span className="hidden sm:inline">Chats</span>
                </Link>

                {/* Become a Supplier — only if not already a supplier and not admin */}
                {!isSupplier && !isAdmin && (
                  <Link to="/become-supplier" className="btn-secondary hidden sm:inline-flex">
                    <Store size={16} />
                    Become a Supplier
                  </Link>
                )}

                {/* Manage my supplier profile */}
                {isSupplier && !isAdmin && (
                  <Link to="/become-supplier" className="btn-ghost">
                    <Store size={16} />
                    <span className="hidden sm:inline">My Shop</span>
                  </Link>
                )}

                {/* Admin panel — only for admin */}
                {isAdmin && (
                  <Link to="/admin-sns-panel" className="btn-ghost text-forest-600">
                    <ShieldCheck size={16} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                {/* User greeting */}
                <span className="hidden md:inline text-sm text-sand-500">
                  Hi, {userProfile?.displayName?.split(' ')[0] || 'there'}
                </span>

                <button onClick={handleLogout} className="btn-ghost text-sand-500">
                  <LogOut size={16} />
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