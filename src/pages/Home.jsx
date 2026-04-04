import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Search, MapPin, MessageCircle, Star, Sparkles, ShieldCheck, Filter } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['All', 'T-Shirts', 'Denim', 'Hoodies', 'Polo Shirts', 'Activewear', 'Outerwear', 'Dresses', 'Knitwear', 'Accessories']

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
          // Sort: golden first, then verified, then regular, then none
          .sort((a, b) => {
            const tierOrder = { golden: 0, verified: 1, regular: 2, none: 3 }
            const aT = tierOrder[a.badgeTier] ?? 3
            const bT = tierOrder[b.badgeTier] ?? 3
            return aT - bT
          })
        setSuppliers(data)
        setFiltered(data)
      } catch (err) {
        console.error(err)
      }
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
    <div className="min-h-screen bg-sand-50">
      <Navbar />

      {/* Hero banner */}
      <div className="bg-forest-700 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-sand-50 mb-3">
            Source garments from Bangladesh
          </h1>
          <p className="text-forest-200 text-lg mb-8">
            Connect directly with verified factories — no middlemen
          </p>
          {/* Search bar */}
          <div className="max-w-2xl mx-auto flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sand-400" />
              <input
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border-0 text-forest-900 placeholder-sand-400 font-body text-sm focus:outline-none focus:ring-2 focus:ring-forest-400 shadow-lg"
                placeholder="Search suppliers, categories, products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {!user && (
              <Link to="/auth?mode=signup" className="bg-sand-400 hover:bg-sand-300 text-forest-900 px-6 py-3.5 rounded-xl font-medium text-sm whitespace-nowrap transition-colors shadow-lg">
                Join Free
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="bg-white border-b border-sand-200 sticky top-[106px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                category === cat
                  ? 'bg-forest-600 text-white border-forest-600'
                  : 'bg-white text-sand-600 border-sand-200 hover:border-forest-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Supplier grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sand-500 text-sm">
            {loading ? 'Loading...' : `${filtered.length} supplier${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card h-72 animate-pulse bg-sand-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">🏭</div>
            <p className="text-sand-500 text-lg mb-2">No suppliers found</p>
            <p className="text-sand-400 text-sm">Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}

        {/* CTA for non-logged in users */}
        {!user && !loading && (
          <div className="mt-16 bg-forest-600 rounded-2xl p-8 text-center text-white">
            <h2 className="font-display text-2xl font-bold mb-2">Ready to start sourcing?</h2>
            <p className="text-forest-200 mb-6">Create a free account to contact suppliers directly</p>
            <Link to="/auth?mode=signup" className="bg-white text-forest-700 px-8 py-3 rounded-lg font-medium hover:bg-sand-50 transition-colors inline-block">
              Create Free Account
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function BadgePill({ tier }) {
  if (!tier || tier === 'none') return null
  if (tier === 'golden') return (
    <span className="golden-badge inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full">
      <Sparkles size={10} /> Golden Supplier
    </span>
  )
  if (tier === 'verified') return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-green-200">
      <ShieldCheck size={10} /> Verified
    </span>
  )
  if (tier === 'regular') return (
    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-200">
      <Star size={10} /> Regular
    </span>
  )
  return null
}

function SupplierCard({ supplier }) {
  const isGolden = supplier.badgeTier === 'golden'

  return (
    <div className={`card overflow-hidden flex flex-col group ${isGolden ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
      {/* Image */}
      <div className="relative">
        {supplier.imageUrl ? (
          <img
            src={supplier.imageUrl}
            alt={supplier.companyName}
            className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-44 bg-gradient-to-br from-forest-50 to-sand-100 flex items-center justify-center text-5xl">
            🏭
          </div>
        )}
        {supplier.badgeTier && supplier.badgeTier !== 'none' && (
          <div className="absolute top-2 right-2">
            <BadgePill tier={supplier.badgeTier} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-forest-900 text-base leading-tight mb-1">
          {supplier.companyName}
        </h3>
        {supplier.location && (
          <div className="flex items-center gap-1 text-sand-400 text-xs mb-2">
            <MapPin size={11} /> {supplier.location}
          </div>
        )}
        <p className="text-sand-500 text-xs mb-3 line-clamp-2 flex-1">
          {supplier.description || 'Garment manufacturer from Bangladesh'}
        </p>
        {supplier.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {supplier.categories.slice(0, 3).map(c => (
              <span key={c} className="bg-forest-50 text-forest-600 text-xs px-2 py-0.5 rounded-full border border-forest-100">
                {c}
              </span>
            ))}
          </div>
        )}
        {supplier.moq && (
          <p className="text-xs text-sand-400 mb-3">
            MOQ: <span className="font-semibold text-forest-700">{supplier.moq} pcs</span>
          </p>
        )}
        <div className="flex gap-2 mt-auto">
          <Link to={`/supplier/${supplier.id}`} className="btn-secondary flex-1 justify-center text-xs py-2">
            View
          </Link>
          <Link to={`/chat/${supplier.id}`} className="btn-primary flex-1 justify-center text-xs py-2">
            <MessageCircle size={12} /> Chat
          </Link>
        </div>
      </div>
    </div>
  )
}