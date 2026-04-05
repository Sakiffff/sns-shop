import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Search, MapPin, MessageCircle, Sparkles, ShieldCheck, Star, ShoppingBag, ArrowRight, Package } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

const CATEGORIES = ['All','T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories']

function BadgePill({ tier }) {
  if (!tier || tier === 'none') return null
  if (tier === 'golden') return <span className="badge-golden"><Sparkles size={9} />Golden</span>
  if (tier === 'verified') return <span className="badge-verified"><ShieldCheck size={9} />Verified</span>
  if (tier === 'regular') return <span className="badge-regular"><Star size={9} />Regular</span>
  return null
}

function SupplierCard({ supplier }) {
  const { addToCart, items } = useCart()
  const { user } = useAuth()
  const inCart = items.some(i => i.supplier.id === supplier.id)
  const isGolden = supplier.badgeTier === 'golden'

  return (
    <div className={`card-hover overflow-hidden flex flex-col group ${isGolden ? 'ring-golden' : ''}`}>
      {/* Image */}
      <div className="relative overflow-hidden h-48 bg-gray-50">
        {supplier.imageUrl
          ? <img src={supplier.imageUrl} alt={supplier.companyName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => { e.target.style.display='none'; e.target.nextSibling && (e.target.nextSibling.style.display='flex') }} />
          : <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-50 to-gray-100">🏭</div>
        }
        {/* Badge overlay */}
        {supplier.badgeTier && supplier.badgeTier !== 'none' && (
          <div className="absolute top-2 left-2"><BadgePill tier={supplier.badgeTier} /></div>
        )}
        {/* Quick cart */}
        <button
          onClick={() => addToCart(supplier)}
          className={`absolute bottom-2 right-2 text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg transition-all
            ${inCart ? 'bg-green-500 text-white' : 'bg-white text-brand-600 hover:bg-brand-600 hover:text-white'}`}
        >
          {inCart ? '✓ Added' : '+ Inquire'}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-bold text-gray-900 text-lg leading-tight uppercase tracking-wide">
            {supplier.companyName}
          </h3>
        </div>

        {supplier.location && (
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-2">
            <MapPin size={11} /> {supplier.location}, BD
          </div>
        )}

        <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1 leading-relaxed">
          {supplier.description || 'Garment manufacturer from Bangladesh'}
        </p>

        {supplier.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {supplier.categories.slice(0, 3).map(c => (
              <span key={c} className="bg-gray-50 text-gray-600 text-xs px-2 py-0.5 rounded-md border border-gray-200">{c}</span>
            ))}
          </div>
        )}

        {supplier.moq && (
          <div className="flex items-center gap-1.5 mb-3">
            <Package size={12} className="text-brand-500" />
            <span className="text-xs text-gray-400">MOQ: <strong className="text-gray-700">{supplier.moq} pcs</strong></span>
          </div>
        )}

        <div className="flex gap-2 mt-auto">
          <Link to={`/supplier/${supplier.id}`} className="btn-secondary flex-1 justify-center text-xs py-2 px-2">
            View Profile
          </Link>
          {user ? (
            <Link to={`/chat/${supplier.id}`} className="btn-primary flex-1 justify-center text-xs py-2 px-2">
              <MessageCircle size={12} /> Chat
            </Link>
          ) : (
            <Link to="/auth" className="btn-primary flex-1 justify-center text-xs py-2 px-2">
              Chat
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [suppliers, setSuppliers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const snap = await getDocs(collection(db, 'suppliers'))
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(s => s.companyName)
          .sort((a, b) => {
            const order = { golden: 0, verified: 1, regular: 2 }
            return (order[a.badgeTier] ?? 3) - (order[b.badgeTier] ?? 3)
          })
        setSuppliers(data)
        setFiltered(data)
      } catch (err) { console.error(err) }
      setLoading(false)
    }
    fetchSuppliers()
  }, [])

  useEffect(() => {
    let result = suppliers
    if (search) result = result.filter(s =>
      s.companyName?.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase()) ||
      s.categories?.some(c => c.toLowerCase().includes(search.toLowerCase()))
    )
    if (category !== 'All') result = result.filter(s => s.categories?.includes(category))
    setFiltered(result)
  }, [search, category, suppliers])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="hero-pattern text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-3xl">
            <div className="section-tag mb-4 !text-red-200 !bg-white/10 !border-white/20">
              🇧🇩 Bangladesh's #1 Garment B2B Platform
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-900 text-white mb-4 uppercase leading-none tracking-tight">
              SOURCE GARMENTS<br />
              <span className="text-red-200">DIRECTLY.</span>
            </h1>
            <p className="text-red-100 text-lg mb-8 font-body max-w-xl">
              Connect with verified Bangladeshi factories. No middlemen. Real prices. Fast communication.
            </p>

            {/* Search */}
            <div className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-11 h-12 shadow-lg text-base"
                  placeholder="Search by product, factory name..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {!user && (
                <Link to="/auth?mode=signup" className="btn-white h-12 px-6 text-sm font-bold whitespace-nowrap">
                  Join Free <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-12 pt-8 border-t border-white/20">
            {[
              { num: suppliers.length || '100+', label: 'Suppliers' },
              { num: '50+', label: 'Countries reached' },
              { num: 'Free', label: 'To join' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-display text-3xl font-black text-white uppercase">{s.num}</div>
                <div className="text-red-200 text-sm">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div className="bg-white border-b border-gray-100 sticky top-[106px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all border font-body ${
                category === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm font-body">
            {loading ? 'Loading suppliers...' : `${filtered.length} supplier${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-2xl h-72 bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏭</div>
            <p className="font-display text-2xl font-bold text-gray-800 uppercase mb-2">No suppliers found</p>
            <p className="text-gray-400 text-sm">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}

        {/* Bottom CTA for guests */}
        {!user && !loading && filtered.length > 0 && (
          <div className="mt-16 rounded-2xl overflow-hidden">
            <div className="hero-pattern p-10 text-center text-white">
              <h2 className="font-display text-4xl font-black text-white uppercase mb-2">
                Ready to Start Sourcing?
              </h2>
              <p className="text-red-100 mb-6">Create a free account to contact suppliers directly</p>
              <Link to="/auth?mode=signup" className="btn-white px-8 py-3 text-base font-bold">
                Create Free Account <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}