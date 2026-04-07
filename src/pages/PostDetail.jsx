import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, getDocs, query, orderBy, updateDoc, increment, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { convertFromBDT } from '../utils/currency'
import Navbar from '../components/Navbar'
import { Star, ShoppingBag, MessageCircle, MapPin, ShieldCheck, Package, Send, ArrowLeft } from 'lucide-react'

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)}
          className="transition-transform hover:scale-125"
        >
          <Star size={24}
            className={s <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
          />
        </button>
      ))}
    </div>
  )
}

export default function PostDetail() {
  const { postId } = useParams()
  const { user, userProfile } = useAuth()
  const { addToCart, items } = useCart()
  const { country } = useCountry()

  const [post, setPost] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const inCart = items.some(i => i.post.id === postId)

  useEffect(() => {
    async function load() {
      try {
        // Load post
        const postSnap = await getDoc(doc(db, 'posts', postId))
        if (!postSnap.exists()) { setLoading(false); return }
        const postData = { id: postSnap.id, ...postSnap.data() }
        setPost(postData)

        // Record view (for insights)
        await setDoc(doc(db, 'postViews', `${postId}_${Date.now()}`), {
          postId, supplierId: postData.supplierId,
          viewedAt: new Date().toISOString(),
          country,
        }).catch(() => {})

        // Load supplier
        if (postData.supplierId) {
          const supSnap = await getDoc(doc(db, 'suppliers', postData.supplierId))
          if (supSnap.exists()) setSupplier(supSnap.data())
        }

        // Load comments
        const commentsSnap = await getDocs(
          query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'desc'))
        )
        setComments(commentsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [postId])

  async function submitComment(e) {
    e.preventDefault()
    if (!newComment.trim() || newRating === 0) {
      setSubmitError('Please add a rating and comment'); return
    }
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
      setComments(prev => [{ id: ref.id, ...comment }, ...prev])

      // Update post's average rating
      const allComments = [...comments, comment]
      const avg = allComments.reduce((s, c) => s + c.rating, 0) / allComments.length
      await updateDoc(doc(db, 'posts', postId), {
        avgRating: Math.round(avg * 10) / 10,
        ratingCount: allComments.length,
      })
      setPost(p => ({ ...p, avgRating: Math.round(avg * 10) / 10, ratingCount: allComments.length }))

      setNewComment('')
      setNewRating(0)
    } catch (e) {
      setSubmitError('Failed to submit: ' + e.message)
    }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 font-body">Loading...</div>
  )
  if (!post) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">📦</div>
        <p className="text-gray-400 font-body mb-4">Post not found.</p>
        <Link to="/" className="btn-primary">Back to Home</Link>
      </div>
    </div>
  )

  const localPrice = convertFromBDT(parseFloat(post.price) || 0, country)
  const isVerified = supplier?.isVerifiedSeller

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-600 text-sm mb-6 transition-colors font-body">
          <ArrowLeft size={15} /> Back to products
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Image */}
          <div className="space-y-2">
            <div className="rounded-2xl overflow-hidden bg-gray-100 aspect-square">
              {post.imageUrl
                ? <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover"
                    onError={e => { e.target.style.display='none' }} />
                : <div className="w-full h-full flex items-center justify-center text-7xl">📦</div>
              }
            </div>
            {(post.imageUrl2 || post.imageUrl3) && (
              <div className="grid grid-cols-2 gap-2">
                {[post.imageUrl2, post.imageUrl3].filter(Boolean).map((url, i) => (
                  <div key={i} className="rounded-xl overflow-hidden bg-gray-100 aspect-square">
                    <img src={url} alt="" className="w-full h-full object-cover" onError={e=>e.target.style.display='none'} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {post.category && (
              <span className="text-xs font-body font-bold text-gray-400 uppercase tracking-wider">{post.category}</span>
            )}
            <h1 className="font-display text-3xl font-black text-gray-900 uppercase tracking-tight mt-1 mb-3 leading-tight">
              {post.title}
            </h1>

            {/* Rating */}
            {post.ratingCount > 0 && (
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={16}
                      className={s <= Math.round(post.avgRating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-700">{post.avgRating?.toFixed(1)}</span>
                <span className="text-sm text-gray-400 font-body">({post.ratingCount} review{post.ratingCount !== 1 ? 's' : ''})</span>
              </div>
            )}

            {/* Price */}
            <div className="mb-1">
              <span className="font-display font-black text-4xl text-brand-600">{localPrice}</span>
              <span className="text-gray-400 text-sm font-body ml-2">/pc</span>
            </div>
            <div className="text-sm text-gray-300 font-body mb-4">৳{parseFloat(post.price || 0).toLocaleString()} BDT</div>

            {post.moq && (
              <div className="flex items-center gap-2 mb-4">
                <Package size={14} className="text-gray-400" />
                <span className="text-sm text-gray-500 font-body">Minimum Order: <strong className="text-gray-700">{post.moq} pcs</strong></span>
              </div>
            )}

            {post.description && (
              <p className="text-gray-500 text-sm leading-relaxed font-body mb-5">{post.description}</p>
            )}
            
            {/* Extra details */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {post.material && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <FlaskConical size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div><div className="text-xs text-gray-400 font-body">Material</div>
                    <div className="text-sm font-semibold text-gray-700 font-body">{post.material}</div></div>
                </div>
              )}
              {post.colors && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Palette size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div><div className="text-xs text-gray-400 font-body">Colors</div>
                    <div className="text-sm font-semibold text-gray-700 font-body">{post.colors}</div></div>
                </div>
              )}
              {post.productionTime && (
                <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                  <Clock size={14} className="text-gray-400 mt-0.5 shrink-0" />
                  <div><div className="text-xs text-gray-400 font-body">Production Time</div>
                    <div className="text-sm font-semibold text-gray-700 font-body">{post.productionTime}</div></div>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2">
                {post.sampleAvailable
                  ? <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" />
                  : <XCircle size={14} className="text-gray-300 mt-0.5 shrink-0" />
                }
                <div><div className="text-xs text-gray-400 font-body">Sample</div>
                  <div className="text-sm font-semibold text-gray-700 font-body">
                    {post.sampleAvailable ? (post.samplePrice ? "৳" + post.samplePrice + " BDT" : "Available") : "Not available"}
                  </div></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => addToCart(post)}
                className={`btn-primary flex-1 justify-center py-3 ${inCart ? 'bg-green-600 hover:bg-green-700' : ''}`}
              >
                <ShoppingBag size={16} />
                {inCart ? '✓ In Cart' : 'Add to Cart'}
              </button>
              {user ? (
                <Link to={`/chat/${post.supplierId}`} className="btn-secondary flex-1 justify-center py-3">
                  <MessageCircle size={16} /> Chat
                </Link>
              ) : (
                <Link to="/auth" className="btn-secondary flex-1 justify-center py-3">
                  <MessageCircle size={16} /> Login to Chat
                </Link>
              )}
            </div>

            {/* Supplier */}
            {supplier && (
              <Link to={`/supplier/${post.supplierId}`}
                className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200 hover:border-brand-300 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-xl">🏭</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-gray-900 uppercase text-sm leading-tight">{supplier.companyName}</div>
                  {supplier.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-body">
                      <MapPin size={10} /> {supplier.location}
                    </div>
                  )}
                </div>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full border border-emerald-200 shrink-0">
                    <ShieldCheck size={10} /> Verified
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>

        {/* Reviews section */}
        <div className="card p-6 mb-5">
          <h2 className="font-display text-2xl font-black text-gray-900 uppercase mb-5">
            Reviews {comments.length > 0 && <span className="text-gray-300">({comments.length})</span>}
          </h2>

          {/* Write a review */}
          {user ? (
            <form onSubmit={submitComment} className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="font-semibold text-gray-700 text-sm mb-3 font-body">Write a Review</p>
              <div className="mb-3">
                <StarPicker value={newRating} onChange={setNewRating} />
                {newRating > 0 && (
                  <span className="text-xs text-gray-400 mt-1 block font-body">
                    {['','Poor','Fair','Good','Very Good','Excellent'][newRating]}
                  </span>
                )}
              </div>
              <textarea
                className="input resize-none mb-2"
                rows={3}
                placeholder="Share your experience with this product or supplier..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              {submitError && <p className="text-red-500 text-xs mb-2 font-body">{submitError}</p>}
              <button type="submit" disabled={submitting || !newComment.trim() || newRating === 0}
                className="btn-primary disabled:opacity-50">
                <Send size={14} /> {submitting ? 'Submitting...' : 'Post Review'}
              </button>
            </form>
          ) : (
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
              <p className="text-gray-400 text-sm font-body mb-3">Login to write a review</p>
              <Link to="/auth" className="btn-primary">Login to Review</Link>
            </div>
          )}

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-gray-300">
              <Star size={32} className="mx-auto mb-2 fill-gray-100" />
              <p className="font-body text-sm">No reviews yet. Be the first!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map(comment => (
                <div key={comment.id} className="border-b border-gray-50 pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <span className="font-semibold text-gray-800 text-sm font-body">{comment.userName}</span>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={12}
                            className={s <= comment.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 font-body">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed font-body">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}