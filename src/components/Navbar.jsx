import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { LogOut, MessageCircle, ShieldCheck, Store, ShoppingBag } from 'lucide-react'
import CartSidebar from './CartSidebar'
import { useEffect, useState } from 'react'

// Country flag emoji from country code
function getFlagEmoji(countryCode) {
  if (!countryCode) return '🌍'
  return countryCode.toUpperCase().replace(/./g, c =>
    String.fromCodePoint(0x1F1E6 - 65 + c.charCodeAt(0))
  )
}

export default function Navbar() {
  const { user, userProfile, logout, isAdmin, isSupplier } = useAuth()
  const { items, setIsOpen } = useCart()
  const navigate = useNavigate()
  const [country, setCountry] = useState({ name: 'Worldwide', code: '' })

  useEffect(() => {
    // Auto-detect country via free API
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { if (d.country_name) setCountry({ name: d.country_name, code: d.country_code }) })
      .catch(() => {})
  }, [])

  async function handleLogout() { await logout(); navigate('/') }

  return (
    <>
      <div className="disclaimer-bar">
        ⚠️ Payments & logistics are handled directly between buyers and suppliers.
      </div>

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <img src="/logo.png" alt="S&S Shop" className="h-9 w-auto" />
          </Link>

          {/* Deliver to */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-sm">
            <span className="text-lg leading-none">{getFlagEmoji(country.code)}</span>
            <div>
              <div className="text-xs text-gray-400 leading-none">Deliver to</div>
              <div className="font-semibold text-gray-800 text-xs leading-tight">{country.name}</div>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-1 ml-auto">
            {user ? (
              <>
                {/* Cart */}
                <button onClick={() => setIsOpen(true)} className="relative btn-ghost px-3">
                  <ShoppingBag size={18} />
                  {items.length > 0 && (
                    <span className="cart-badge">{items.length}</span>
                  )}
                  <span className="hidden sm:inline">Cart</span>
                </button>

                {/* Chats */}
                <Link to="/chats" className="btn-ghost">
                  <MessageCircle size={18} />
                  <span className="hidden sm:inline">Chats</span>
                </Link>

                {/* Supplier */}
                {!isSupplier && !isAdmin && (
                  <Link to="/become-supplier" className="hidden sm:inline-flex btn-secondary text-xs px-3 py-2">
                    <Store size={15} /> Become a Supplier
                  </Link>
                )}
                {isSupplier && !isAdmin && (
                  <Link to="/become-supplier" className="btn-ghost text-xs">
                    <Store size={15} />
                    <span className="hidden sm:inline">My Shop</span>
                  </Link>
                )}

                {/* Admin */}
                {isAdmin && (
                  <Link to="/admin-sns-panel" className="btn-ghost text-brand-600">
                    <ShieldCheck size={18} />
                    <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                <span className="hidden lg:inline text-xs text-gray-400 px-2 border-l border-gray-200 ml-1">
                  {userProfile?.displayName?.split(' ')[0]}
                </span>
                <button onClick={handleLogout} className="btn-ghost text-gray-400 px-2">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <>
                <Link to="/auth" className="btn-ghost text-sm">Login</Link>
                <Link to="/auth?mode=signup" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <CartSidebar />
    </>
  )
}