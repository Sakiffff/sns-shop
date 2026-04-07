import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { convertFromBDT } from '../utils/currency'
import Navbar from '../components/Navbar'
import { Star, ShoppingBag, MessageCircle, MapPin, ShieldCheck, Package, Send, ArrowLeft, Clock, Palette, FlaskConical, CheckCircle, XCircle } from 'lucide-react'

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-125 active:scale-110"
        >
          <Star size={28} className={s <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
        </button>
      ))}
    </div>
  )
}

export default function PostDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user, userProfile } = useAuth()
  const { addToCart, items } = useCart()
  const { country } = useCountry()

  const [post, setPost] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  const inCart = post ? items.some(i => i.post.id === postId) : false

  useEffect(() => {
    async function load() {
      setLoading(true)
      setLoadError('')
      try {
        // 1. Load post
        const postSnap = await getDoc(doc(db, 'posts', postId))
        if (!postSnap.exists()) {
          setLoadError('Product not found.')
          setLoading(false)
          return
        }
        const postData = { id: postSnap.id, ...postSnap.data() }
        setPost(postData)

        // 2. Record view — completely silent, never blocks page
        addDoc(collection(db, 'postViews'), {
          postId,
          supplierId: postData.supplierId || '',
          viewedAt: new Date().toISOString(),
          country: country || 'Unknown',
        }).catch(() => {})

        // 3. Load supplier
        if (postData.supplierId) {
          getDoc(doc(db, 'suppliers', postData.supplierId))
            .then(snap => { if (snap.exists()) setSupplier(snap.data()) })
            .catch(() => {})
        }

        // 4. Load comments — NO orderBy (avoids Firestore index requirement)
        const commentsSnap = await getDocs(collection(db, 'posts', postId, 'comments'))
        const loaded = commentsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        setComments(loaded)
      } catch (e) {
        console.error('load error:', e)
        setLoadError('Something went wrong loading this page. ' + e.message)
      }
      setLoading(false)
    }
    if (postId) load()
  }, [postId])

  async function submitComment(e) {
    e.preventDefault()
    if (!newComment.trim()) { setSubmitError('Please write a comment'); return }
    if (newRating === 0) { setSubmitError('Please select a star rating first'); return }
    setSubmitting(true); setSubmitError('')
    try {
      const comment = {
        text: newComment.trim(),
        rating: newRating,
        userId: user.uid,
        userName: userProfile?.displayName || 'Anonymous',
        createdAt: new Date().toISOString(),
      }
      const ref = await addDoc(collection(db, 'posts', postId, 'comments'), comment)
      const updated = [{ id: ref.id, ...comment }, ...comments]
      setComments(updated)
      const avg = updated.reduce((s, c) => s + c.rating, 0) / updated.length
      const rounded = Math.round(avg * 10) / 10
      await updateDoc(doc(db, 'posts', postId), { avgRating: rounded, ratingCount: updated.length })
      setPost(p => ({ ...p, avgRating: rounded, ratingCount: updated.length }))
      setNewComment('')
      setNewRating(0)
      setSubmitSuccess(true)
      setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (e) {
      console.error('submit error:', e)
      setSubmitError('Failed: ' + e.message)
    }
    setSubmitting(false)
  }

  // ─── Loading state ───
  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-body text-sm">Loading product...</p>
        </div>
      </div>
    </div>
  )

  // ─── Error state ───
  if (loadError || !post) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex items-center justify-center py-32 px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500 font-body mb-6">{loadError || 'Product not found.'}</p>
          <button onClick={() => navigate('/')} className="btn-primary">← Back to Products</button>
        </div>
      </div>
    </div>
  )

  const localPrice = convertFromBDT(parseFloat(post.price) || 0, country)
  const isVerified = supplier?.isVerifiedSeller
  const images = [post.imageUrl, post.imageUrl2, post.imageUrl3].filter(Boolean)

  const whatsappUrl = supplier?.whatsapp
    ? `https://wa.me/${supplier.whatsapp.replace(/\D/g, '')}?text=Hi%20${encodeURIComponent(supplier.companyName || 'there')}%2C%20I%20found%20your%20product%20%22${encodeURIComponent(post.title)}%22%20on%20S%26S%20Shop%20and%20I%27m%20interested!`
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-600 text-sm mb-6 transition-colors font-body">
          <ArrowLeft size={15} /> Back
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

          {/* ── Images ── */}
          <div className="space-y-3">
            <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square">
              {images.length > 0
                ? <img src={images[activeImg]} alt={post.title} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display='none' }} />
                : <div className="w-full h-full flex items-center justify-center text-8xl">📦</div>
              }
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((url, i) => (
                  <button key={i} onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${activeImg === i ? 'border-brand-600 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                    <img src={url} alt="" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product info ── */}
          <div>
            {post.category && (
              <span className="text-xs font-body font-bold text-gray-400 uppercase tracking-widest">{post.category}</span>
            )}
            <h1 className="font-display text-3xl font-black text-gray-900 uppercase tracking-tight mt-1 mb-3 leading-tight">
              {post.title}
            </h1>

            {post.ratingCount > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={15} className={s <= Math.round(post.avgRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-700">{post.avgRating?.toFixed(1)}</span>
                <span className="text-sm text-gray-400 font-body">({post.ratingCount} review{post.ratingCount !== 1 ? 's' : ''})</span>
              </div>
            )}

            <div className="mb-1">
              <span className="font-display font-black text-4xl text-brand-600">{localPrice}</span>
              <span className="text-gray-400 text-sm font-body ml-2">/pc</span>
            </div>
            <p className="text-sm text-gray-300 font-body mb-5">৳{parseFloat(post.price || 0).toLocaleString()} BDT</p>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {post.moq && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Package size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  <div><div className="text-xs text-gray-400 font-body">Min. Order</div>
                    <div className="text-sm font-semibold text-gray-700 font-body">{post.moq} pcs</div></div>
                </div>
              )}
              {post.material && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <FlaskConical size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  <div><div className="text-xs text-gray-400 font-body">Material</div>
                    <div className="text-sm font-semibold text-gray-700 font-body">{post.material}</div></div>
                </div>
              )}
              {post.colors && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Palette size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  <div><div className="text-xs text-gray-400 font-body">Colors</div>
                    <div className="text-sm font-semibold text-gray-700 font-body">{post.colors}</div></div>
                </div>
              )}
              {post.productionTime && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Clock size={13} className="text-gray-400 mt-0.5 shrink-0" />
                  <div><div className="text-xs text-gray-400 font-body">Production</div>
                    <div className="text-sm font-semibold text-gray-700 font-body">{post.productionTime}</div></div>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                {post.sampleAvailable
                  ? <CheckCircle size={13} className="text-green-500 mt-0.5 shrink-0" />
                  : <XCircle size={13} className="text-gray-300 mt-0.5 shrink-0" />
                }
                <div><div className="text-xs text-gray-400 font-body">Sample</div>
                  <div className="text-sm font-semibold text-gray-700 font-body">
                    {post.sampleAvailable ? (post.samplePrice ? `৳${post.samplePrice}` : 'Available') : 'Not available'}
                  </div></div>
              </div>
            </div>

            {post.description && (
              <p className="text-gray-500 text-sm leading-relaxed font-body mb-5">{post.description}</p>
            )}

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl transition-colors text-sm shadow-sm">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.118 1.531 5.845L.057 23.882l6.194-1.623A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.359-.214-3.677.964.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z"/>
                  </svg>
                  WhatsApp Supplier
                </a>
              )}
              <div className="flex gap-2">
                <button onClick={() => addToCart(post)}
                  className={`flex-1 flex items-center justify-center gap-2 font-bold py-2.5 rounded-xl text-sm transition-colors ${inCart ? 'bg-green-500 hover:bg-green-600 text-white' : 'btn-primary'}`}>
                  <ShoppingBag size={15} />{inCart ? '✓ In Cart' : 'Add to Cart'}
                </button>
                {user
                  ? <Link to={`/chat/${post.supplierId}`} className="flex-1 btn-secondary justify-center py-2.5 text-sm"><MessageCircle size={15} /> Chat</Link>
                  : <Link to="/auth" className="flex-1 btn-secondary justify-center py-2.5 text-sm"><MessageCircle size={15} /> Login to Chat</Link>
                }
              </div>
            </div>

            {supplier && (
              <Link to={`/supplier/${post.supplierId}`}
                className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-brand-300 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl shrink-0">🏭</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-gray-900 uppercase text-sm">{supplier.companyName}</div>
                  {supplier.location && <div className="flex items-center gap-1 text-xs text-gray-400 font-body"><MapPin size={10}/> {supplier.location}</div>}
                </div>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full border border-emerald-200 shrink-0">
                    <ShieldCheck size={10}/> Verified
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* ── Reviews ── */}
        <div className="card p-6">
          <h2 className="font-display text-2xl font-black text-gray-900 uppercase mb-5">
            Reviews {comments.length > 0 && <span className="text-gray-300 ml-1">({comments.length})</span>}
          </h2>

          {user ? (
            <form onSubmit={submitComment} className="mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="font-display font-black text-gray-700 uppercase text-sm mb-4">Write a Review</p>
              <div className="mb-4">
                <p className="text-xs text-gray-400 font-body mb-2">Your Rating *</p>
                <StarPicker value={newRating} onChange={setNewRating} />
                {newRating > 0 && (
                  <span className="text-sm text-yellow-500 font-bold mt-1 block font-body">
                    {['','Poor','Fair','Good','Very Good','Excellent'][newRating]}
                  </span>
                )}
              </div>
              <textarea className="input resize-none mb-3" rows={3}
                placeholder="Share your experience with this product or supplier..."
                value={newComment} onChange={e => setNewComment(e.target.value)} />
              {submitError && <p className="text-red-500 text-sm mb-3 font-body">{submitError}</p>}
              {submitSuccess && <p className="text-green-500 text-sm font-bold mb-3 font-body">✓ Review posted!</p>}
              <button type="submit" disabled={submitting || !newComment.trim() || newRating === 0}
                className="btn-primary disabled:opacity-40">
                <Send size={14}/> {submitting ? 'Posting...' : 'Post Review'}
              </button>
            </form>
          ) : (
            <div className="mb-8 p-5 bg-gray-50 rounded-2xl border border-gray-200 text-center">
              <p className="text-gray-400 text-sm font-body mb-3">Login to write a review</p>
              <Link to="/auth" className="btn-primary">Login</Link>
            </div>
          )}

          {comments.length === 0 ? (
            <div className="text-center py-10">
              <Star size={36} className="mx-auto mb-3 text-gray-200 fill-gray-100" />
              <p className="font-body text-sm text-gray-300">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-5">
              {comments.map(comment => (
                <div key={comment.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-black text-brand-600">
                          {(comment.userName || 'A')[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-gray-800 text-sm font-body">{comment.userName}</span>
                      </div>
                      <div className="flex gap-0.5 ml-9">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12} className={s <= comment.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 font-body">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed font-body ml-9">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}