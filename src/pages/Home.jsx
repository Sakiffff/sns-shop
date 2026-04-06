import { useState, useEffect, useRef } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Search, MapPin, MessageCircle, Sparkles, ShieldCheck, Star, ShoppingBag, ArrowRight, Package, DollarSign, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'

const CATEGORIES = ['All','T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories','Socks','Underwear','Swimwear','Uniforms','Other']

function BadgePill({ tier }) {
  if (!tier || tier === 'none') return null
  if (tier === 'golden') return <span className="badge-golden"><Sparkles size={9}/>Golden</span>
  if (tier === 'verified') return <span className="badge-verified"><ShieldCheck size={9}/>Verified</span>
  if (tier === 'regular') return <span className="badge-regular"><Star size={9}/>Regular</span>
  return null
}

// Seller info hover/tap card
function SellerTag({ post, supplier }) {
  const [show, setShow] = useState(false)
  const ref = useRef()

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setShow(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-brand-600 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      >
        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
          <User size={10} className="text-gray-400" />
        </div>
        <span className="font-body truncate max-w-[100px]">{post.supplierName || 'Supplier'}</span>
      </button>

      {show && supplier && (
        <div className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 z-20">
          <div className="flex items-center gap-2 mb-2">
            <BadgePill tier={supplier.badgeTier} />
          </div>
          <div className="font-display font-black text-gray-900 uppercase text-sm leading-tight">{supplier.companyName}</div>
          {supplier.location && (
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-1 font-body">
              <MapPin size={10} /> {supplier.location}, BD
            </div>
          )}
          <Link to={`/supplier/${post.supplierId}`}
            className="mt-2 w-full flex items-center justify-center gap-1 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors rounded-lg py-1.5">
            View Profile <ArrowRight size={10} />
          </Link>
        </div>
      )}
    </div>
  )
}

function PostCard({ post, supplier }) {
  const { addToCart, items } = useCart()
  const { user } = useAuth()
  const inCart = items.some(i => i.post.id === post.id)
  const isGolden = supplier?.badgeTier === 'golden'

  return (
    <div className={`card-hover overflow-hidden flex flex-col group ${isGolden ? 'ring-golden' : ''}`}>
      {/* Image */}
      <div className="relative overflow-hidden h-48 bg-gray-50">
        {post.imageUrl
          ? <img src={post.imageUrl} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={e => { e.target.style.display='none'; e.target.parentNode.querySelector('.fallback-icon').style.display='flex' }} />
          : null
        }
        <div className="fallback-icon w-full h-full flex items-center justify-center text-5xl bg-gradient-to-br from-gray-50 to-gray-100"
          style={{ display: post.imageUrl ? 'none' : 'flex' }}>
          📦
        </div>

        {/* Badge */}
        {supplier?.badgeTier && supplier.badgeTier !== 'none' && (
          <div className="absolute top-2 left-2"><BadgePill tier={supplier.badgeTier} /></div>
        )}

        {/* Add to cart button */}
        <button
          onClick={() => addToCart(post)}
          className={`absolute bottom-2 right-2 text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg transition-all
            ${inCart ? 'bg-green-500 text-white' : 'bg-white text-brand-600 hover:bg-brand-600 hover:text-white'}`}
        >
          {inCart ? '✓ In Cart' : '+ Add to Cart'}
        </button>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        {post.category && (
          <span className="text-xs text-gray-400 font-body font-semibold uppercase tracking-wider mb-1">{post.category}</span>
        )}

        <h3 className="font-display font-black text-gray-900 text-base leading-tight uppercase tracking-wide mb-2 line-clamp-2">
          {post.title}
        </h3>

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className="font-display font-black text-brand-600 text-xl">
            {post.currency || '$'}{parseFloat(post.price || 0).toFixed(2)}
          </span>
          <span className="text-xs text-gray-400 font-body">/pc</span>
        </div>

        {/* MOQ */}
        {post.moq && (
          <div className="flex items-center gap-1.5 mb-3">
            <Package size={11} className="text-gray-300" />
            <span className="text-xs text-gray-400 font-body">MOQ: <strong className="text-gray-600">{post.moq} pcs</strong></span>
          </div>
        )}

        {post.description && (
          <p className="text-gray-400 text-xs mb-3 line-clamp-2 flex-1 leading-relaxed font-body">{post.description}</p>
        )}

        {/* Seller tag */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <SellerTag post={post} supplier={supplier} />
          {user ? (
            <Link to={`/chat/${post.supplierId}`} className="text-xs text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1 font-body">
              <MessageCircle size={12} /> Chat
            </Link>
          ) : (
            <Link to="/auth" className="text-xs text-brand-600 font-bold font-body">Chat</Link>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [posts, setPosts] = useState([])
  const [suppliers, setSuppliers] = useState({}) // map supplierId -> supplier
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
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
            // Golden suppliers' posts go first
            const aT = supplierMap[a.supplierId]?.badgeTier
            const bT = supplierMap[b.supplierId]?.badgeTier
            const order = { golden: 0, verified: 1, regular: 2 }
            const diff = (order[aT] ?? 3) - (order[bT] ?? 3)
            if (diff !== 0) return diff
            return new Date(b.createdAt) - new Date(a.createdAt)
          })
        setPosts(postsData)
        setFiltered(postsData)
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    let result = posts
    if (search) result = result.filter(p =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.supplierName?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.toLowerCase().includes(search.toLowerCase())
    )
    if (category !== 'All') result = result.filter(p => p.category === category)
    setFiltered(result)
  }, [search, category, posts])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="hero-pattern">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <div className="max-w-3xl">
            <div className="inline-block text-xs font-mono font-bold text-red-200 bg-white/10 border border-white/20 px-3 py-1 rounded-full mb-4 uppercase tracking-wider">
              🇧🇩 Bangladesh's #1 Garment B2B Platform
            </div>
            <h1 className="font-display text-5xl sm:text-7xl font-black text-white mb-4 uppercase leading-none tracking-tight">
              SOURCE GARMENTS<br />
              <span className="text-red-200">DIRECTLY.</span>
            </h1>
            <p className="text-red-100 text-lg mb-8 font-body max-w-xl">
              Browse thousands of products from verified Bangladeshi suppliers. Real prices. No middlemen.
            </p>
            <div className="flex gap-3 max-w-2xl">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-11 h-12 shadow-lg text-base"
                  placeholder="Search products, categories, suppliers..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
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
              { num: Object.keys(suppliers).length || '0', label: 'Active suppliers' },
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

      {/* Category bar */}
      <div className="bg-white border-b border-gray-100 sticky top-[106px] z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border font-body ${
                category === cat
                  ? 'bg-brand-600 text-white border-brand-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400 text-sm font-body">
            {loading ? 'Loading products...' : `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found`}
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
            <p className="text-gray-400 text-sm font-body">Try a different search or category</p>
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