import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { convertFromBDT } from '../utils/currency'
import { MessageCircle, MapPin, Globe, Mail, Phone, Instagram, Facebook, Package, ShieldCheck, Star, Truck, ArrowRight, ShoppingBag, MessageSquare } from 'lucide-react'

function StarRating({ rating, count }) {
  if (!rating) return null
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(s => (
        <Star key={s} size={11} className={s <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
      ))}
      {count > 0 && <span className="text-xs text-gray-400 font-body ml-0.5">({count})</span>}
    </div>
  )
}

export default function SupplierProfile() {
  const { id } = useParams()
  const [supplier, setSupplier] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deliveredOrders, setDeliveredOrders] = useState(0)
  const { user } = useAuth()
  const { addToCart, items } = useCart()
  const { country } = useCountry()

  useEffect(() => {
    async function load() {
      try {
        const [supSnap, postsSnap] = await Promise.all([
          getDoc(doc(db, 'suppliers', id)),
          getDocs(query(collection(db, 'posts'), where('supplierId', '==', id)))
        ])
        if (supSnap.exists()) setSupplier({ id: supSnap.id, ...supSnap.data() })
        setPosts(postsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
        // Count delivered orders for this supplier
        try {
          const ordersSnap = await getDocs(query(
            collection(db, 'orders'),
            where('status', '==', 'delivered')
          ))
          // Filter orders that include this supplier
          const count = ordersSnap.docs.filter(d =>
            (d.data().suppliers || []).some(s => s.id === id)
          ).length
          setDeliveredOrders(count)
        } catch(e) {}
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
        <Link to="/" className="btn-primary">Back to Products</Link>
      </div>
    </div>
  )

  const isVerified = supplier.isVerifiedSeller
  const isSnsVerified = supplier.snsVerified
  const whatsappUrl = supplier.whatsapp
    ? `https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(supplier.companyName)}%2C%20I%20found%20you%20on%20S%26S%20Shop%20and%20I%27m%20interested%20in%20your%20products.`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="w-20 h-20 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center text-4xl shrink-0">
              🏭
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {deliveredOrders > 0 && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3 font-body">
            ✅ {deliveredOrders} order{deliveredOrders !== 1 ? 's' : ''} successfully fulfilled
          </div>
        )}
        <h1 className="font-display text-3xl font-black text-gray-900 uppercase tracking-tight">
                  {supplier.companyName}
                </h1>
                {isVerified && (
<span className="verified-seller-badge"><ShieldCheck size={10}/> Verified Seller</span>
                )}
                {isSnsVerified && (
                  <span className="inline-flex items-center gap-1 bg-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <ShieldCheck size={11} /> Verified by S&S
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-gray-400 text-sm font-body mb-2">
                <MapPin size={13} /> {supplier.location || 'Bangladesh'}
                {supplier.businessType && <span className="mx-2 text-gray-200">·</span>}
                {supplier.businessType && <span className="text-gray-400">{supplier.businessType}</span>}
              </div>
              {supplier.description && (
                <p className="text-gray-500 text-sm font-body leading-relaxed max-w-xl">{supplier.description}</p>
              )}
            </div>
            {/* Primary CTA - WhatsApp */}
            <div className="flex flex-col gap-2 shrink-0">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-3 rounded-xl transition-colors text-sm shadow-sm">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.118 1.531 5.845L.057 23.882l6.194-1.623A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.359-.214-3.677.964.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                  WhatsApp Supplier
                </a>
              )}
              {user ? (
                <Link to={`/chat/${supplier.id}`}
                  className="flex items-center gap-2 btn-secondary text-sm py-2.5 justify-center">
                  <MessageCircle size={15} /> Platform Chat
                </Link>
              ) : (
                <Link to="/auth" className="flex items-center gap-2 btn-secondary text-sm py-2.5 justify-center">
                  <MessageCircle size={15} /> Login to Chat
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Main — Products */}
          <div className="md:col-span-2">
            <h2 className="font-display text-2xl font-black text-gray-900 uppercase mb-4">
              Products ({posts.length})
            </h2>
            {posts.length === 0 ? (
              <div className="card p-8 text-center text-gray-300">
                <Package size={36} className="mx-auto mb-3" />
                <p className="font-body text-sm">No products listed yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {posts.map(post => {
                  const inCart = items.some(i => i.post.id === post.id)
                  return (
                    <div key={post.id} className="card overflow-hidden group">
                      <div className="relative h-40 bg-gray-50 overflow-hidden">
                        {post.imageUrl
                          ? <img src={post.imageUrl} alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              onError={e => e.target.style.display='none'} />
                          : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                        }
                        <button onClick={() => addToCart(post)}
                          className={`absolute bottom-2 right-2 text-xs font-bold px-2.5 py-1 rounded-lg shadow transition-all
                            ${inCart ? 'bg-green-500 text-white' : 'bg-white text-brand-600 hover:bg-brand-600 hover:text-white'}`}>
                          {inCart ? '✓' : '+'}
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="font-display font-black text-gray-900 uppercase text-sm leading-tight line-clamp-1 mb-1">{post.title}</div>
                        <StarRating rating={post.avgRating} count={post.ratingCount} />
                        <div className="font-display font-black text-brand-600 text-lg mt-1">
                          {convertFromBDT(parseFloat(post.price || 0), country)}<span className="text-xs font-body text-gray-400 ml-1">/pc</span>
                        </div>
                        {post.moq && <div className="text-xs text-gray-400 font-body">MOQ: {post.moq} pcs</div>}
                        <Link to={`/post/${post.id}`} className="mt-2 text-xs text-brand-600 hover:underline font-bold font-body flex items-center gap-1">
                          View details <ArrowRight size={10} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* WhatsApp CTA (mobile repeat) */}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-3 rounded-xl transition-colors text-sm shadow-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.118 1.531 5.845L.057 23.882l6.194-1.623A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.359-.214-3.677.964.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Message on WhatsApp
              </a>
            )}

            {/* Contact info */}
            <div className="card p-4 space-y-3">
              <h3 className="font-display font-black text-gray-900 uppercase text-sm">Contact Info</h3>
              {supplier.contactPerson && (
                <div className="text-sm font-body text-gray-600">
                  <span className="text-gray-400 text-xs block">Contact Person</span>
                  {supplier.contactPerson}
                </div>
              )}
              {supplier.phone && (
                <a href={`tel:${supplier.phone}`} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-body font-semibold transition-colors">
                  <Phone size={13} /> {supplier.phone}
                </a>
              )}
              {supplier.email && (
                <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-body font-semibold transition-colors">
                  <Mail size={13} /> {supplier.email}
                </a>
              )}
              {supplier.website && (
                <a href={supplier.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-body font-semibold transition-colors">
                  <Globe size={13} /> Website
                </a>
              )}
              {supplier.instagram && (
                <a href={supplier.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-600 font-body font-semibold">
                  <Instagram size={13} /> Instagram
                </a>
              )}
              {supplier.facebook && (
                <a href={supplier.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-600 font-body font-semibold">
                  <Facebook size={13} /> Facebook
                </a>
              )}
            </div>

            {/* Shipping info */}
            {(supplier.shippingAir || supplier.shippingSea || supplier.dispatchLocation) && (
              <div className="card p-4">
                <h3 className="font-display font-black text-gray-900 uppercase text-sm mb-3">Shipping</h3>
                <div className="space-y-2">
                  {supplier.shippingAir && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-body">
                      <Globe size={13} className="text-blue-400" /> Air Freight available
                    </div>
                  )}
                  {supplier.shippingSea && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-body">
                      <Truck size={13} className="text-emerald-400" /> Sea Freight available
                    </div>
                  )}
                  {supplier.dispatchLocation && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-body">
                      <MapPin size={13} className="text-gray-400" /> Ships from {supplier.dispatchLocation}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Request a Quote */}
            {user ? (
              <Link to={`/chat/${supplier.id}`}
                className="w-full flex items-center justify-center gap-2 border-2 border-brand-200 text-brand-600 font-bold px-4 py-3 rounded-xl hover:bg-brand-50 transition-colors text-sm font-body">
                <MessageSquare size={15} /> Request a Quote
              </Link>
            ) : (
              <Link to="/auth"
                className="w-full flex items-center justify-center gap-2 border-2 border-brand-200 text-brand-600 font-bold px-4 py-3 rounded-xl hover:bg-brand-50 transition-colors text-sm font-body">
                <MessageSquare size={15} /> Request a Quote
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}