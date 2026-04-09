import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { LogOut, MessageCircle, ShieldCheck, FileText, ShoppingBag, User, ChevronDown, Globe, Search, Menu, X as XIcon } from 'lucide-react'
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
  const [showMobileMenu, setShowMobileMenu] = useState(false)
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
    function onScroll() { setScrolled(window.scrollY > 200) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleLogout() {
    setShowProfileMenu(false); setShowMobileMenu(false)
    await logout(); navigate('/')
  }

  const filteredCountries = COUNTRIES.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
  const shortCountry = country.length > 12 ? country.slice(0, 10) + '…' : country

  return (
    <>
      <div className="disclaimer-bar">
        ⚠️ Payments & logistics handled directly between buyers and suppliers.
      </div>

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-2">

          {/* Logo */}
          <Link to="/" className="shrink-0 mr-1">
            <Logo className="h-8 sm:h-9 w-auto" />
          </Link>

          {/* Deliver to — always right next to logo, slides away when search appears */}
          <div className={`relative shrink-0 transition-all duration-300 ${scrolled && onSearchChange ? 'hidden sm:block' : 'block'}`} ref={countryRef}>
            <button
              onClick={() => setShowCountryPicker(!showCountryPicker)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-brand-300 transition-colors text-xs sm:text-sm"
            >
              <Globe size={13} className="text-brand-500 shrink-0" />
              <div className="text-left hidden sm:block">
                <div className="text-xs text-gray-400 leading-none">Ship to</div>
                <div className="font-semibold text-gray-800 text-xs leading-tight">{shortCountry}</div>
              </div>
              <div className="text-left sm:hidden">
                <div className="font-semibold text-gray-700 text-xs">{shortCountry}</div>
              </div>
              <ChevronDown size={11} className="text-gray-400 shrink-0" />
            </button>

            {showCountryPicker && (
              <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <div className="relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-body"
                      placeholder="Search country..."
                      value={countrySearch}
                      onChange={e => setCountrySearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-52 overflow-y-auto">
                  {filteredCountries.map(c => (
                    <button key={c} onClick={() => { selectCountry(c); setShowCountryPicker(false); setCountrySearch('') }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-body hover:bg-brand-50 transition-colors ${country===c ? 'bg-brand-50 text-brand-600 font-semibold' : 'text-gray-700'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Search — slides in on scroll (desktop) */}
          {onSearchChange && (
            <div className={`relative flex-1 max-w-xs sm:max-w-sm transition-all duration-300 ${scrolled ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none w-0'}`}>
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 font-body bg-gray-50"
                placeholder="Search..."
                value={searchValue || ''}
                onChange={e => onSearchChange(e.target.value)}
              />
            </div>
          )}

          <div className="flex-1" />

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {user ? (
              <>
                <button onClick={() => setCartOpen(true)} className="relative btn-ghost px-2.5">
                  <ShoppingBag size={18} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-600 text-white font-black w-4 h-4 rounded-full flex items-center justify-center" style={{fontSize:'10px'}}>{totalItems}</span>
                  )}
                  <span className="text-sm">Cart</span>
                </button>

                <Link to="/chats" className="btn-ghost px-2.5">
                  <MessageCircle size={18} /><span className="text-sm">Chats</span>
                </Link>

                {isAdmin && (
                  <Link to="/admin-sns-panel" className="btn-ghost text-brand-600 px-2.5">
                    <ShieldCheck size={17} /><span className="text-sm">Admin</span>
                  </Link>
                )}

                <div className="relative" ref={profileRef}>
                  <button onClick={() => setShowProfileMenu(!showProfileMenu)} className="flex items-center gap-1.5 btn-ghost ml-1 px-2.5">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center">
                      <User size={14} className="text-brand-600" />
                    </div>
                    <span className="text-sm text-gray-700 font-semibold max-w-[80px] truncate">
                      {userProfile?.displayName?.split(' ')[0] || 'Me'}
                    </span>
                    <ChevronDown size={13} className="text-gray-400" />
                  </button>
                  {showProfileMenu && (
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                        <div className="font-bold text-gray-900 text-sm truncate">{userProfile?.displayName}</div>
                        <div className="text-xs text-gray-400 truncate font-body">{user?.email}</div>
                      </div>
                      <div className="py-1">
                        <Link to="/profile" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-body">
                          <User size={14} className="text-gray-400" /> Edit Profile
                        </Link>
                        <Link to="/my-posts" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-body">
                          <FileText size={14} className="text-gray-400" />
                          {isSupplier ? 'My Sale Posts' : 'Become a Supplier'}
                        </Link>
                        <Link to="/how-it-works" onClick={() => setShowProfileMenu(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 font-body">
                          <ShieldCheck size={14} className="text-gray-400" /> How It Works
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left font-body">
                            <LogOut size={14} /> Log Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/how-it-works" className="btn-ghost text-sm px-2.5">How It Works</Link>
                <Link to="/auth" className="btn-ghost text-sm px-2.5">Login</Link>
                <Link to="/auth?mode=signup" className="btn-primary text-sm">Get Started</Link>
              </>
            )}
          </div>

          {/* Mobile right side */}
          <div className="flex md:hidden items-center gap-1">
            {user && (
              <button onClick={() => setCartOpen(true)} className="relative p-2 text-gray-600 hover:text-brand-600">
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-brand-600 text-white font-black w-4 h-4 rounded-full flex items-center justify-center" style={{fontSize:'9px'}}>{totalItems}</span>
                )}
              </button>
            )}
            <button onClick={() => setShowMobileMenu(!showMobileMenu)} className="p-2 text-gray-600 hover:text-brand-600">
              {showMobileMenu ? <XIcon size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden border-t border-gray-100 bg-white">
            <div className="px-4 py-3 space-y-1">
              {user ? (
                <>
                  <div className="px-3 py-2 bg-gray-50 rounded-xl mb-2">
                    <div className="font-bold text-gray-900 text-sm">{userProfile?.displayName}</div>
                    <div className="text-xs text-gray-400 font-body">{user?.email}</div>
                  </div>
                  <Link to="/chats" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-body">
                    <MessageCircle size={16} className="text-gray-400" /> Chats
                  </Link>
                  <Link to="/profile" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-body">
                    <User size={16} className="text-gray-400" /> Edit Profile
                  </Link>
                  <Link to="/my-posts" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-body">
                    <FileText size={16} className="text-gray-400" /> {isSupplier ? 'My Sale Posts' : 'Become a Supplier'}
                  </Link>
                  {isAdmin && (
                    <Link to="/admin-sns-panel" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-brand-600 font-bold hover:bg-brand-50 font-body">
                      <ShieldCheck size={16} /> Admin Panel
                    </Link>
                  )}
                  <Link to="/how-it-works" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-body">
                    <ShieldCheck size={16} className="text-gray-400" /> How It Works
                  </Link>
                  <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 w-full text-left font-body">
                    <LogOut size={16} /> Log Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/how-it-works" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-body">
                    How It Works
                  </Link>
                  <Link to="/auth" onClick={() => setShowMobileMenu(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-body">
                    Login
                  </Link>
                  <Link to="/auth?mode=signup" onClick={() => setShowMobileMenu(false)} className="btn-primary w-full justify-center mt-2">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <CartSidebar />
    </>
  )
}