import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { MessageCircle, MapPin, Globe, Mail, Phone, Instagram, Facebook, Package, Sparkles, ShieldCheck, Star } from 'lucide-react'

function BadgePill({ tier }) {
  if (!tier || tier === 'none') return null
  if (tier === 'golden') return (
    <span className="golden-badge"><Sparkles size={11} /> Golden Supplier</span>
  )
  if (tier === 'verified') return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full border border-green-200">
      <ShieldCheck size={11} /> Verified
    </span>
  )
  if (tier === 'regular') return (
    <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full border border-blue-200">
      <Star size={11} /> Regular
    </span>
  )
  return null
}

export default function SupplierProfile() {
  const { id } = useParams()
  const [supplier, setSupplier] = useState(null)
  const [loading, setLoading] = useState(true)
  const { user, userProfile } = useAuth()

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'suppliers', id))
      if (snap.exists()) setSupplier({ id: snap.id, ...snap.data() })
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center text-sand-400">Loading...</div>
  )
  if (!supplier) return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🏭</div>
        <p className="text-sand-500">Supplier not found.</p>
        <Link to="/" className="btn-primary mt-4">Back to Suppliers</Link>
      </div>
    </div>
  )

  const isOwnProfile = user?.uid === id

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Header card */}
        <div className="card overflow-hidden mb-6">
          {supplier.imageUrl && (
            <img src={supplier.imageUrl} alt={supplier.companyName} className="w-full h-64 object-cover" />
          )}
          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="font-display text-3xl font-bold text-forest-950">{supplier.companyName}</h1>
                  <BadgePill tier={supplier.badgeTier} />
                </div>
                {supplier.location && (
                  <div className="flex items-center gap-1.5 text-sand-500 text-sm">
                    <MapPin size={14} /> {supplier.location}, Bangladesh
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {isOwnProfile ? (
                  <Link to="/become-supplier" className="btn-secondary">Edit Profile</Link>
                ) : (
                  user && (
                    <Link to={`/chat/${supplier.id}`} className="btn-primary">
                      <MessageCircle size={16} /> Send Message
                    </Link>
                  )
                )}
                {!user && (
                  <Link to="/auth" className="btn-primary">
                    <MessageCircle size={16} /> Login to Chat
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main */}
          <div className="md:col-span-2 space-y-5">
            <div className="card p-6">
              <h2 className="font-semibold text-forest-900 mb-3">About</h2>
              <p className="text-sand-600 leading-relaxed">{supplier.description || 'No description provided.'}</p>
            </div>
            {supplier.categories?.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-forest-900 mb-3">Product Categories</h2>
                <div className="flex flex-wrap gap-2">
                  {supplier.categories.map(c => (
                    <span key={c} className="bg-forest-50 text-forest-700 px-3 py-1.5 rounded-full text-sm border border-forest-100">{c}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="bg-sand-100 border border-sand-200 rounded-xl p-4 text-sm text-sand-500">
              ⚠️ Payments & logistics are handled directly between buyers and suppliers.
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {supplier.moq && (
              <div className="card p-4">
                <div className="flex items-center gap-2 text-sand-400 text-xs mb-1">
                  <Package size={13} /> Minimum Order Quantity
                </div>
                <div className="font-display text-2xl font-bold text-forest-900">
                  {supplier.moq} <span className="text-sm font-body text-sand-400">pcs</span>
                </div>
              </div>
            )}
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-forest-900 text-sm">Contact</h3>
              {supplier.whatsapp && (
                <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Phone size={14} /> WhatsApp
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`}
                  className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Mail size={14} /> {supplier.email}
                </a>
              )}
              {supplier.website && (
                <a href={supplier.website} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Globe size={14} /> Website
                </a>
              )}
              {supplier.instagram && (
                <a href={supplier.instagram} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {supplier.facebook && (
                <a href={supplier.facebook} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Facebook size={14} /> Facebook
                </a>
              )}
              {!supplier.whatsapp && !supplier.email && !supplier.website && (
                <p className="text-sand-400 text-sm">No contact info provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}