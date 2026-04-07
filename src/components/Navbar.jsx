import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { LogOut, MessageCircle, ShieldCheck, FileText, ShoppingBag, User, ChevronDown, Globe, Search } from 'lucide-react'
import CartSidebar from './CartSidebar'
import Logo from './Logo'
import { useEffect, useState, useRef } from 'react'

const COUNTRIES = [
  'United States','United Kingdom','Germany','France','Italy','Spain',
  'Netherlands','Belgium','Sweden','Denmark','Norway','Finland',
  'Australia','Canada','Japan','South Korea','China','India',
  'UAE','Saudi Arabia','Turkey','Brazil','Mexico','South Africa',
  'Bangladesh','Pakistan','Sri Lanka','Vietnam','Thailand','Indonesia',
  'Malaysia','Singapore','Philippines','Egypt','Nigeria','Kenya','Other'
]

export default function Navbar({ searchValue, onSearchChange }) {
  const { user, userProfile, logout, isAdmin, isSupplier } = useAuth()
  const { totalItems, setIsOpen: setCartOpen } = useCart()
  const { country, selectCountry } = useCountry()
  const navigate = useNavigate()

  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  const profileRef = useRef()
  const countryRef = useRef()

  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileMenu(false)
      if (countryRef.current && !countryRef.current.contains(e.target)) setShowCountryPicker(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 180) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    setShowProfileMenu(false)
    await logout()
    navigate('/')
  }

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  )

  return (
    <>
      <div className="disclaimer-bar">
        ⚠️ Payments & logistics are handled directly between buyers and suppliers.
      </div>

      <nav className={`bg-white border-b border-gray-100 sticky top-0 z-40 transition-shadow duration-300 ${scrolled ? 'shadow-md' : 'shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">

          {/* Logo */}
          <Link to="/" className="shrink-0">
            <Logo className="h-9 w-auto" />
          </Link>

          {/* Search bar — slides in when scrolled */}
          {onSearchChange && (
            <div className={`relative flex-1 max-w-md transition-all duration-300 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}>
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-body bg-gray-50"
                placeholder="Search products..."
                value={searchValue || ''}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
          )}

          {/* Deliver to */}
          <div className="relative hidden md:block shrink-0" ref={countryRef}>
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 hover:border-brand-300 transition-colors text-sm"
            >
              <Globe size={14} className="text-brand-500" />
              <div className="text-left">
                <div className="text-xs text-gray-400 leading-none">Deliver to</div>
                <div className="font-semibold text-gray-800 text-xs leading-tight max-w-[80px] truncate">{country}</div>
              </div>
              <ChevronDown size={12} className="text-gray-400" />
            </button>

            {showCountryPicker && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-body"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {filteredCountries.map(c => (
                    <button key={c} onClick={() => { selectCountry(c); setShowCountryPicker(false); setCountrySearch('') }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-body hover:bg-brand-50 transition-colors ${country === c ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 hidden md:block" />

          {/* Right */}
          <div className="flex items-center gap-1 ml-auto md:ml-0">
            {user ? (
              <>
                <button onClick={() => setCartOpen(true)} className="relative btn-ghost px-3">
                  <ShoppingBag size={18} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-600 text-white font-black w-4 h-4 rounded-full flex items-center justify-center" style={{fontSize:'10px'}}>
                      {totalItems}
                    </span>
                  )}
                  <span className="hidden sm:inline text-sm">Cart</span>
                </button>

                <Link to="/chats" className="btn-ghost">
                  <MessageCircle size={18} />
                  <span className="hidden sm:inline text-sm">Chats</span>
                </Link>

                {isAdmin && (
                  <Link to="/admin-sns-panel" className="btn-ghost text-brand-600">
                    <ShieldCheck size={17} />
                    <span className="hidden sm:inline text-sm">Admin</span>
                  </Link>
                )}

                {/* Profile dropdown */}
                <div className="relative" ref={profileRef}>
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-1.5 btn-ghost ml-1">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                      <User size={14} className="text-brand-600" />
                    </div>
                    <span className="hidden sm:inline text-sm text-gray-700 font-semibold">
                      {userProfile?.displayName?.split(' ')[0] || 'Profile'}
                    </span>
                    <ChevronDown size={13} className="text-gray-400" />
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="font-bold text-gray-900 text-sm truncate">{userProfile?.displayName}</div>
                        <div className="text-xs text-gray-400 truncate font-body">{user?.email}</div>
                        {isSupplier && userProfile?.isVerifiedSeller && (
                          <div className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-700 font-bold">
                            <ShieldCheck size={11} /> Verified Seller
                          </div>
                        )}
                      </div>
                      <div className="py-1">
                        <Link to="/profile" onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-body">
                          <User size={15} className="text-gray-400" /> Edit Profile
                        </Link>
                        <Link to="/my-posts" onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors font-body">
                          <FileText size={15} className="text-gray-400" />
                          {isSupplier ? 'My Sale Posts' : 'Become a Supplier'}
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={handleLogout}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left font-body">
                            <LogOut size={15} /> Log Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/how-it-works" className="btn-ghost text-sm hidden sm:inline-flex">How it Works</Link>
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