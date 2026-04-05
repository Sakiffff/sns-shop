import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { MessageCircle, MapPin, Globe, Mail, Phone, Instagram, Facebook, Package, Sparkles, ShieldCheck, Star, ShoppingBag } from 'lucide-react'

function BadgePill({ tier }) {
  if (!tier || tier === 'none') return null
  if (tier === 'golden') return <span className="badge-golden"><Sparkles size={11} />Golden Supplier</span>
  if (tier === 'verified') return <span className="badge-verified"><ShieldCheck size={11} />Verified</span>
  if (tier === 'regular') return <span className="badge-regular"><Star size={11} />Regular</span>
  return null
}

export default function SupplierProfile() {
  const { id } = useParams()
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const { addToCart, items } = useCart()
  const inCart = items.some(i => i.supplier.id === id)

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'suppliers', id))
        if (snap.exists()) setSupplier({ id: snap.id, ...snap.data() })
      } catch(e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 font-body">Loading...</div>
  )
  if (!supplier) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🏭</div>
        <p className="text-gray-400 font-body mb-4">Supplier not found.</p>
        <Link to="/" className="btn-primary">Back to Suppliers</Link>
      </div>
    </div>
  )

  const isOwnProfile = user?.uid === id

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero image */}
      {supplier.imageUrl && (
        <div className="w-full h-72 overflow-hidden">
          <img src={supplier.imageUrl} alt={supplier.companyName} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card p-6 mb-6 -mt-12 relative shadow-lg">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight">
                  {supplier.companyName}
                </h1>
                <BadgePill tier={supplier.badgeTier} />
              </div>
              {supplier.location && (
                <div className="flex items-center gap-1.5 text-gray-400 text-sm font-body">
                  <MapPin size={14} /> {supplier.location}, Bangladesh
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {!isOwnProfile && (
                <button
                  onClick={() => addToCart(supplier)}
                  className={`btn-secondary text-sm ${inCart ? 'border-green-400 text-green-600' : ''}`}
                >
                  <ShoppingBag size={15} />
                  {inCart ? '✓ In Cart' : 'Add to Cart'}
                </button>
              )}
              {isOwnProfile ? (
                <Link to="/become-supplier" className="btn-secondary">Edit Profile</Link>
              ) : user ? (
                <Link to={`/chat/${supplier.id}`} className="btn-primary">
                  <MessageCircle size={15} /> Chat Now
                </Link>
              ) : (
                <Link to="/auth" className="btn-primary">
                  <MessageCircle size={15} /> Login to Chat
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main */}
          <div className="md:col-span-2 space-y-5">
            <div className="card p-6">
              <h2 className="font-display text-xl font-black text-gray-900 uppercase mb-3">About</h2>
              <p className="text-gray-500 leading-relaxed font-body">
                {supplier.description || 'No description provided.'}
              </p>
            </div>

            {supplier.categories?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-display text-xl font-black text-gray-900 uppercase mb-3">Product Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {supplier.categories.map(c => (
                    <span key={c} className="bg-gray-50 text-gray-700 px-3 py-1.5 rounded-xl text-sm border border-gray-200 font-body font-semibold">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-700 font-body">
              ⚠️ <strong>Note:</strong> Payments & logistics are handled directly between buyers and suppliers.
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {supplier.moq && (
              <div className="card p-5">
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-1 font-body">
                  <Package size={13} /> Min. Order Quantity
                </div>
                <div className="font-display text-3xl font-black text-gray-900">
                  {supplier.moq} <span className="text-sm font-body font-normal text-gray-400">pcs</span>
                </div>
              </div>
            )}

            <div className="card p-5 space-y-3">
              <h3 className="font-display font-bold text-gray-900 uppercase">Contact</h3>
              {supplier.whatsapp && (
                <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors font-body font-semibold">
                  <Phone size={14} /> WhatsApp
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors font-body font-semibold">
                  <Mail size={14} /> {supplier.email}
                </a>
              )}
              {supplier.website && (
                <a href={supplier.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors font-body font-semibold">
                  <Globe size={14} /> Website
                </a>
              )}
              {supplier.instagram && (
                <a href={supplier.instagram} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors font-body font-semibold">
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {supplier.facebook && (
                <a href={supplier.facebook} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 transition-colors font-body font-semibold">
                  <Facebook size={14} /> Facebook
                </a>
              )}
              {!supplier.whatsapp && !supplier.email && !supplier.website && (
                <p className="text-gray-300 text-sm font-body">No contact info provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}