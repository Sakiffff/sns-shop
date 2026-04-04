import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore'
import { db } from '../firebase'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Search, Filter, MessageCircle, MapPin, Star } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const CATEGORIES = ['All','T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories']

export default function BuyerDashboard() {
  const [suppliers, setSuppliers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const { userProfile } = useAuth()

  useEffect(() => {
    async function fetchSuppliers() {
      try {
        const snap = await getDocs(collection(db, 'suppliers'))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-forest-950 mb-1">
            Welcome{userProfile?.displayName ? `, ${userProfile.displayName}` : ''}
          </h1>
          <p className="text-sand-500">Browse verified garment suppliers from Bangladesh</p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-sand-400" />
            <input
              className="input pl-9"
              placeholder="Search suppliers, categories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="input sm:w-48" value={category} onChange={e => setCategory(e.target.value)}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-20 text-sand-400">Loading suppliers...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🏭</div>
            <p className="text-sand-500">No suppliers found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(supplier => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SupplierCard({ supplier }) {
  return (
    <div className="card overflow-hidden flex flex-col">
      {supplier.imageUrl ? (
        <img src={supplier.imageUrl} alt={supplier.companyName} className="w-full h-44 object-cover" />
      ) : (
        <div className="w-full h-44 bg-forest-50 flex items-center justify-center text-4xl">🏭</div>
      )}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-display font-semibold text-forest-900 text-lg leading-tight">{supplier.companyName}</h3>
          {supplier.sponsored && <span className="badge-sponsored"><Star size={10} />Sponsored</span>}
        </div>
        {supplier.location && (
          <div className="flex items-center gap-1 text-sand-500 text-xs mb-3">
            <MapPin size={12} /> {supplier.location}
          </div>
        )}
        <p className="text-sand-600 text-sm mb-3 line-clamp-2 flex-1">{supplier.description}</p>
        {supplier.categories?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {supplier.categories.slice(0, 3).map(c => (
              <span key={c} className="bg-forest-50 text-forest-700 text-xs px-2 py-0.5 rounded-full border border-forest-100">{c}</span>
            ))}
          </div>
        )}
        {supplier.moq && (
          <p className="text-xs text-sand-500 mb-4">MOQ: <span className="font-medium text-forest-700">{supplier.moq} pcs</span></p>
        )}
        <div className="flex gap-2 mt-auto">
          <Link to={`/supplier/${supplier.id}`} className="btn-secondary flex-1 justify-center text-xs py-2">View Profile</Link>
          <Link to={`/chat/${supplier.id}`} className="btn-primary flex-1 justify-center text-xs py-2">
            <MessageCircle size={13} /> Chat
          </Link>
        </div>
      </div>
    </div>
  )
}