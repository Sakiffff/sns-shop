import { useState, useEffect } from 'react'
import { collection, getDocs , where } from 'firebase/firestore'
import { db } from '../firebase'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Search, ShieldCheck, Star, ArrowRight, Package, SlidersHorizontal, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { convertFromBDT } from '../utils/currency'

const CATEGORIES = ['All','T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories','Socks','Underwear','Swimwear','Uniforms','Other']

function StarRating({ rating, count }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={10} className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
      {count > 0 && <span className="text-xs text-gray-400 font-body ml-0.5">({count})</span>}
    </div>
  )
}

function PostCard({ post, supplier }) {
  const { addToCart, items } = useCart()
  const { user } = useAuth()
  const { country } = useCountry()
  const navigate = useNavigate()
  const inCart = items.some(i => i.post.id === post.id)
  const isVerified = supplier?.isVerifiedSeller
  const localPrice = convertFromBDT(parseFloat(post.price) || 0, country)

  return (
    <div className="card-hover overflow-hidden flex flex-col group cursor-pointer"
      onClick={() => navigate(`/post/${post.id}`)}>

      {/* Image */}
      <div className="relative overflow-hidden h-48 bg-gray-50">
        {(post.bannerUrl || post.imageUrl) ? (
          <>
            <img src={post.bannerUrl||post.imageUrl} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { e.target.style.display='none' }} />
            <div className="w-full h-full items-center justify-center text-5xl bg-gray-100 hidden absolute inset-0">📦</div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-50 to-gray-100">📦</div>
        )}
        {isVerified && (
          <div className="absolute top-2 left-2">
            <span className="verified-seller-badge">
              <ShieldCheck size={10} />
              Verified Seller
            </span>
          </div>
        )}
        <button
          onClick={e => { e.stopPropagation(); addToCart(post) }}
          className={`absolute bottom-2 right-2 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg transition-all z-10
            ${inCart ? 'bg-green-500 text-white' : 'bg-white text-brand-600 hover:bg-brand-600 hover:text-white'}`}
        >
          {inCart ? '✓' : '+ Add'}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {post.category && (
          <span className="text-xs text-gray-400 font-body font-semibold uppercase tracking-wider mb-1">{post.category}</span>
        )}
        <h3 className="font-display font-black text-gray-900 text-base leading-tight uppercase tracking-wide mb-1 line-clamp-2">
          {post.title}
        </h3>
        <div className="mb-2"><StarRating rating={post.avgRating} count={post.ratingCount || 0} /></div>
        <div className="flex items-baseline gap-1 mb-1">
          <span className="font-display font-black text-brand-600 text-xl">{localPrice}</span>
          <span className="text-xs text-gray-400 font-body">/pc</span>
        </div>
        <div className="text-xs text-gray-200 font-body mb-2">৳{parseFloat(post.price || 0).toLocaleString()} BDT</div>
        {post.moq && (
          <div className="flex items-center gap-1.5 mb-2">
            <Package size={11} className="text-gray-300" />
            <span className="text-xs text-gray-400 font-body">MOQ: <strong className="text-gray-600">{post.moq} pcs</strong></span>
          </div>
        )}
        {post.description && (
          <p className="text-gray-400 text-xs mb-3 line-clamp-2 flex-1 leading-relaxed font-body">{post.description}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <button
            onClick={e => { e.stopPropagation(); navigate(`/supplier/${post.supplierId}`) }}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors max-w-[55%]"
          >
            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 text-xs">
              {isVerified ? <ShieldCheck size={10} className="text-emerald-500" /> : '🏭'}
            </div>
            <span className="font-body font-semibold truncate">{post.supplierName || 'Supplier'}</span>
          </button>
          <div className="flex items-center gap-2">
            {user ? (
              <button
                onClick={e => { e.stopPropagation(); navigate(`/chat/${post.supplierId}`) }}
                className="text-xs text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1 font-body"
              >
                <MessageCircle size={12} /> Chat
              </button>
            ) : (
              <button onClick={e => { e.stopPropagation(); navigate('/auth') }}
                className="text-xs text-brand-600 font-bold font-body">Chat</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [suppliers, setSuppliers] = useState({})
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deliveredCount, setDeliveredCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [moqMax, setMoqMax] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const { user } = useAuth()

  useEffect(() => {
    async function fetchData() {
      try {
        const [postsSnap, suppliersSnap] = await Promise.all([
          getDocs(collection(db, 'posts')),
          getDocs(collection(db, 'suppliers')),
        ])
        const supplierMap = {}
        suppliersSnap.docs.forEach(d => { supplierMap[d.id] = { id: d.id, ...d.data() } })
        setSuppliers(supplierMap)
        const postsData = postsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(p => p.title)
          .sort((a, b) => {
            const aV = supplierMap[a.supplierId]?.isVerifiedSeller ? 0 : 1
            const bV = supplierMap[b.supplierId]?.isVerifiedSeller ? 0 : 1
            if (aV !== bV) return aV - bV
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
          })
        setPosts(postsData)
        setFiltered(postsData)
      // Fetch delivered orders count for social proof stats
      try {
        const deliveredSnap = await getDocs(query(collection(db, 'orders'), where('status', '==', 'delivered')))
        setDeliveredCount(deliveredSnap.size)
      } catch(e) { /* non-critical */ }
    } catch (e) { console.error(e) }
    setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let result = posts
    if (verifiedOnly) result = result.filter(p => suppliers[p.supplierId]?.isVerifiedSeller)
    if (search) result = result.filter(p =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.toLowerCase().includes(search.toLowerCase())
    )
    if (category !== 'All') result = result.filter(p => p.category === category)
    if (moqMax) result = result.filter(p => !p.moq || parseInt(p.moq) <= parseInt(moqMax))
    if (priceMax) result = result.filter(p => !p.price || parseFloat(p.price) <= parseFloat(priceMax))
    if (sortBy === 'price_asc') result = [...result].sort((a,b) => (parseFloat(a.price)||0) - (parseFloat(b.price)||0))
    else if (sortBy === 'price_desc') result = [...result].sort((a,b) => (parseFloat(b.price)||0) - (parseFloat(a.price)||0))
    else if (sortBy === 'newest') result = [...result].sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))
    setFiltered(result)
  }, [search, category, posts, verifiedOnly, suppliers, moqMax, priceMax, sortBy])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar searchValue={search} onSearchChange={setSearch} />

      {/* Hero */}
      <div className="hero-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-block text-xs font-mono font-bold text-red-200 bg-white/10 border border-white/20 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              🇧🇩 Bangladesh's #1 Garment B2B Platform
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-black text-white mb-4 uppercase leading-none tracking-tight">
              SOURCE GARMENTS<br /><span className="text-red-200">DIRECTLY.</span>
            </h1>
            <p className="text-red-100 text-lg mb-8 font-body max-w-xl">
              Browse products from verified Bangladeshi suppliers. Real prices. No middlemen.
            </p>
            <div className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input className="input pl-11 h-12 shadow-lg text-base"
                  placeholder="Search products, categories, suppliers..."
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              {!user && (
                <Link to="/auth?mode=signup" className="btn-white h-12 px-6 font-bold whitespace-nowrap">
                  Join Free <ArrowRight size={15} />
                </Link>
              )}
            </div>
          </div>
          <div className="flex gap-8 mt-10 pt-8 border-t border-white/20">
            {[
              { num: posts.length || '0', label: 'Products listed' },
              { num: Object.keys(suppliers).length || '0', label: 'Verified suppliers' },
              { num: deliveredCount > 0 ? deliveredCount + '+' : 'Growing', label: 'Orders delivered worldwide' },
              { num: 'Free', label: 'To join & browse' },
            ].map(s => (
              <div key={s.label}>
                <div className="font-display text-3xl font-black text-white uppercase">{s.num}</div>
                <div className="text-red-200 text-sm font-body">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide items-center">
          <button onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shrink-0 ${
              verifiedOnly ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400'
            }`}>
            <ShieldCheck size={13} /> Verified
          </button>
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border font-body ${
                category === cat ? 'bg-brand-600 text-white border-brand-600' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Advanced filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-bold text-gray-500 bg-white border border-gray-200 hover:border-brand-300 px-4 py-2 rounded-xl transition-colors font-body">
            <SlidersHorizontal size={14} /> Filters {showFilters ? '▲' : '▼'}
          </button>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            className="text-sm font-body border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-600 hover:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-400">
            <option value="default">Sort: Recommended</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="newest">Newest First</option>
          </select>
          {(moqMax || priceMax || sortBy !== 'default' || verifiedOnly) && (
            <button onClick={() => { setMoqMax(''); setPriceMax(''); setSortBy('default'); setVerifiedOnly(false) }}
              className="text-xs text-brand-600 font-bold hover:underline font-body">Clear all</button>
          )}
        </div>
        {showFilters && (
          <div className="mt-3 p-4 bg-white rounded-2xl border border-gray-200 flex flex-wrap gap-4 items-end">
            <div>
              <label className="label text-xs">Max MOQ (pcs)</label>
              <input type="number" min="0" value={moqMax} onChange={e => setMoqMax(e.target.value)}
                className="input w-36 text-sm" placeholder="e.g. 500" />
            </div>
            <div>
              <label className="label text-xs">Max Price (BDT/pc)</label>
              <input type="number" min="0" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                className="input w-40 text-sm" placeholder="e.g. 500" />
            </div>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-400 text-sm font-body">
            {loading ? 'Loading...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => <div key={i} className="rounded-2xl h-80 bg-gray-100 animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="text-5xl mb-4">📦</div>
            <p className="font-display text-2xl font-black text-gray-700 uppercase mb-2">No products found</p>
            <p className="text-gray-400 text-sm font-body">Try a different search or clear filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map(post => (
              <PostCard key={post.id} post={post} supplier={suppliers[post.supplierId]} />
            ))}
          </div>
        )}
        {!user && !loading && filtered.length > 0 && (
          <div className="mt-16 rounded-2xl overflow-hidden">
            <div className="hero-pattern p-10 text-center">
              <h2 className="font-display text-4xl font-black text-white uppercase mb-2">Ready to Order?</h2>
              <p className="text-red-100 mb-6 font-body">Create a free account to place orders and chat with suppliers</p>
              <Link to="/auth?mode=signup" className="btn-white px-8 py-3 font-bold">
                Create Free Account <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}