import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { MessageCircle, MapPin, Star, Globe, Mail, Phone, Instagram, Facebook, Package } from 'lucide-react'

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

  if (loading) return <div className="min-h-screen bg-sand-50 flex items-center justify-center text-sand-400">Loading...</div>
  if (!supplier) return <div className="min-h-screen bg-sand-50 flex items-center justify-center"><div className="text-center"><div className="text-5xl mb-4">🏭</div><p className="text-sand-500">Supplier not found.</p><Link to="/buyer" className="btn-primary mt-4">Back to Suppliers</Link></div></div>

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="card overflow-hidden mb-6">
          {supplier.imageUrl && <img src={supplier.imageUrl} alt={supplier.companyName} className="w-full h-64 object-cover" />}
          <div className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="font-display text-3xl font-bold text-forest-950">{supplier.companyName}</h1>
                  {supplier.sponsored && <span className="badge-sponsored"><Star size={11} />Sponsored</span>}
                </div>
                {supplier.location && (
                  <div className="flex items-center gap-1.5 text-sand-500 text-sm">
                    <MapPin size={14} /> {supplier.location}, Bangladesh
                  </div>
                )}
              </div>
              {user && userProfile?.role === 'buyer' && (
                <Link to={`/chat/${supplier.id}`} className="btn-primary">
                  <MessageCircle size={16} /> Send Message
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main */}
          <div className="md:col-span-2 space-y-6">
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
            <div className="bg-sand-100 border border-sand-200 rounded-xl p-4 text-sm text-sand-600">
              ⚠️ <strong>Note:</strong> We are improving payments & shipment solutions. Transactions and logistics are handled directly between buyers and suppliers.
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {supplier.moq && (
              <div className="card p-4">
                <div className="flex items-center gap-2 text-sand-500 text-xs mb-1"><Package size={14} /> Minimum Order</div>
                <div className="font-display text-2xl font-bold text-forest-900">{supplier.moq} <span className="text-sm font-body text-sand-500">pcs</span></div>
              </div>
            )}
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-forest-900 text-sm">Contact</h3>
              {supplier.whatsapp && (
                <a href={`https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Phone size={14} /> WhatsApp
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Mail size={14} /> {supplier.email}
                </a>
              )}
              {supplier.website && (
                <a href={supplier.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Globe size={14} /> Website
                </a>
              )}
              {supplier.instagram && (
                <a href={supplier.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Instagram size={14} /> Instagram
                </a>
              )}
              {supplier.facebook && (
                <a href={supplier.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-forest-600 hover:text-forest-800 transition-colors">
                  <Facebook size={14} /> Facebook
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}