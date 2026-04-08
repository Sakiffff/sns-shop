import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { convertFromBDT } from '../utils/currency'
import Navbar from '../components/Navbar'
import { Star, ShoppingBag, MessageCircle, MapPin, ShieldCheck, Send, ArrowLeft, Clock, FlaskConical, CheckCircle, XCircle, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react'

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)} className="transition-transform hover:scale-125 active:scale-110">
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
  const { addItem, items: cartItems } = useCart()
  const { country } = useCountry()

  const [post, setPost] = useState(null)
  const [supplier, setSupplier] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  // Item selection state
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [qty, setQty] = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)

  // Banner image carousel
  const [bannerIdx, setBannerIdx] = useState(0)

  // Review state
  const [newComment, setNewComment] = useState('')
  const [newRating, setNewRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true); setLoadError('')
      try {
        const postSnap = await getDoc(doc(db, 'posts', postId))
        if (!postSnap.exists()) { setLoadError('Product not found.'); setLoading(false); return }
        const postData = { id: postSnap.id, ...postSnap.data() }
        setPost(postData)
        // Pre-select first item
        if (postData.items?.length > 0) setSelectedItem(postData.items[0])

        // Record view silently
        addDoc(collection(db, 'postViews'), {
          postId, supplierId: postData.supplierId || '',
          viewedAt: new Date().toISOString(), country: country || 'Unknown',
        }).catch(() => {})

        // Load supplier
        if (postData.supplierId) {
          getDoc(doc(db, 'suppliers', postData.supplierId))
            .then(snap => { if (snap.exists()) setSupplier(snap.data()) })
            .catch(() => {})
        }

        // Load comments (no orderBy — sort in JS)
        const commentsSnap = await getDocs(collection(db, 'posts', postId, 'comments'))
        setComments(commentsSnap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)))
      } catch (e) { setLoadError('Failed to load: ' + e.message) }
      setLoading(false)
    }
    if (postId) load()
  }, [postId])

  function handleAddToCart() {
    if (!selectedItem) return
    addItem(post, selectedItem, qty, selectedSize, selectedColor)
    setAddedFeedback(true)
    setTimeout(() => setAddedFeedback(false), 2000)
  }

  async function submitComment(e) {
    e.preventDefault()
    if (!newComment.trim()) { setSubmitError('Please write a comment'); return }
    if (newRating === 0) { setSubmitError('Please select a star rating'); return }
    setSubmitting(true); setSubmitError('')
    try {
      const comment = {
        text: newComment.trim(), rating: newRating, userId: user.uid,
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
      setNewComment(''); setNewRating(0)
      setSubmitSuccess(true); setTimeout(() => setSubmitSuccess(false), 3000)
    } catch (e) { setSubmitError('Failed: ' + e.message) }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-body text-sm">Loading product...</p>
        </div>
      </div>
    </div>
  )

  if (loadError || !post) return (
    <div className="min-h-screen bg-gray-50"><Navbar />
      <div className="flex items-center justify-center py-32 px-4">
        <div className="text-center">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-gray-500 font-body mb-6">{loadError || 'Product not found.'}</p>
          <button onClick={() => navigate('/')} className="btn-primary">← Back</button>
        </div>
      </div>
    </div>
  )

  const isVerified = supplier?.isVerifiedSeller
  const bannerImages = [post.bannerUrl, post.bannerUrl2, post.bannerUrl3].filter(Boolean)
  // Fallback to old imageUrl fields if no bannerUrl
  const heroImages = bannerImages.length > 0
    ? bannerImages
    : [post.imageUrl, post.imageUrl2, post.imageUrl3].filter(Boolean)

  const postItems = post.items || []
  const hasSizes = post.sizesEnabled && post.availableSizes?.length > 0
  const hasColors = post.availableColors?.length > 0

  const whatsappUrl = supplier?.whatsapp
    ? `https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(supplier.companyName||'Supplier')}%2C%20I%20found%20your%20listing%20%22${encodeURIComponent(post.title)}%22%20on%20S%26S%20Shop%20and%20I%27m%20interested!`
    : null

  const itemInCart = selectedItem
    ? cartItems.some(i => i.postId === postId && i.item.id === selectedItem.id && i.size === selectedSize && i.color === selectedColor)
    : false

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-600 text-sm mb-6 transition-colors font-body">
          <ArrowLeft size={15} /> Back
        </button>

        {/* ── Banner + post header ── */}
        <div className="card overflow-hidden mb-6">
          {/* Banner image carousel */}
          {heroImages.length > 0 && (
            <div className="relative h-64 sm:h-80 bg-gray-100 overflow-hidden">
              <img src={heroImages[bannerIdx]} alt={post.title}
                className="w-full h-full object-cover"
                onError={e => e.target.style.display='none'} />
              {heroImages.length > 1 && (
                <>
                  <button onClick={() => setBannerIdx(i => (i - 1 + heroImages.length) % heroImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
                    <ChevronLeft size={18} className="text-gray-700" />
                  </button>
                  <button onClick={() => setBannerIdx(i => (i + 1) % heroImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow flex items-center justify-center hover:bg-white transition-colors">
                    <ChevronRight size={18} className="text-gray-700" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {heroImages.map((_, i) => (
                      <button key={i} onClick={() => setBannerIdx(i)}
                        className={`w-2 h-2 rounded-full transition-all ${bannerIdx === i ? 'bg-white w-4' : 'bg-white/50'}`} />
                    ))}
                  </div>
                </>
              )}
              {isVerified && (
                <div className="absolute top-3 left-3">
                  <span className="inline-flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow">
                    <ShieldCheck size={10} /> Verified Seller
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex-1">
                {post.category && <span className="text-xs text-gray-400 font-bold uppercase tracking-wider font-body">{post.category}</span>}
                <h1 className="font-display text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-tight mt-1 mb-2">{post.title}</h1>
                {post.ratingCount > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.round(post.avgRating||0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />)}</div>
                    <span className="text-sm font-bold text-gray-700">{post.avgRating?.toFixed(1)}</span>
                    <span className="text-sm text-gray-400 font-body">({post.ratingCount} reviews)</span>
                  </div>
                )}
                {post.description && <p className="text-gray-500 text-sm font-body leading-relaxed">{post.description}</p>}
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                {whatsappUrl && (
                  <a href={whatsappUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.118 1.531 5.845L.057 23.882l6.194-1.623A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.359-.214-3.677.964.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z"/></svg>
                    WhatsApp
                  </a>
                )}
                {user
                  ? <Link to={`/chat/${post.supplierId}`} className="btn-secondary text-sm py-2 justify-center"><MessageCircle size={14}/> Chat</Link>
                  : <Link to="/auth" className="btn-secondary text-sm py-2 justify-center"><MessageCircle size={14}/> Login to Chat</Link>
                }
              </div>
            </div>

            {/* Post-level details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
              {post.moq && (
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className="text-xs text-gray-400 font-body">Min. Order</div>
                  <div className="font-display font-black text-gray-800 text-sm">{post.moq} pcs</div>
                </div>
              )}
              {post.material && (
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className="text-xs text-gray-400 font-body">Material</div>
                  <div className="font-display font-black text-gray-800 text-sm truncate">{post.material}</div>
                </div>
              )}
              {post.productionTime && (
                <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                  <div className="text-xs text-gray-400 font-body">Production</div>
                  <div className="font-display font-black text-gray-800 text-sm">{post.productionTime}</div>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-2.5 text-center">
                <div className="text-xs text-gray-400 font-body">Sample</div>
                <div className="font-display font-black text-gray-800 text-sm">
                  {post.sampleAvailable ? (post.samplePrice ? `৳${post.samplePrice}` : 'Yes') : 'No'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── ITEMS SECTION ── */}
        {postItems.length > 0 && (
          <div className="card p-6 mb-6">
            <h2 className="font-display text-2xl font-black text-gray-900 uppercase mb-1">Select Items to Order</h2>
            <p className="text-gray-400 text-sm font-body mb-5">Choose a product, pick options, then add to cart</p>

            {/* Items grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {postItems.map(item => {
                const itemPrice = convertFromBDT(parseFloat(item.price) || 0, country)
                const isSelected = selectedItem?.id === item.id
                return (
                  <button key={item.id} onClick={() => { setSelectedItem(item); setSelectedSize(''); setSelectedColor('') }}
                    className={`rounded-2xl border-2 overflow-hidden text-left transition-all ${
                      isSelected ? 'border-brand-600 shadow-md' : 'border-gray-200 hover:border-brand-300'
                    }`}>
                    <div className="h-32 bg-gray-50 overflow-hidden">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                        : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                      }
                    </div>
                    <div className="p-2.5">
                      <div className="font-display font-black text-gray-900 uppercase text-xs leading-tight line-clamp-2 mb-1">{item.name}</div>
                      <div className="font-display font-black text-brand-600 text-sm">{itemPrice}<span className="text-xs font-body text-gray-400">/pc</span></div>
                      <div className="text-xs text-gray-300 font-body">৳{parseFloat(item.price||0).toLocaleString()}</div>
                    </div>
                    {isSelected && (
                      <div className="bg-brand-600 text-white text-xs font-bold text-center py-1 font-body">Selected ✓</div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Options + Add to cart panel */}
            {selectedItem && (
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                <div className="flex items-start gap-4 mb-4">
                  {selectedItem.imageUrl && (
                    <img src={selectedItem.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0" alt="" onError={e => e.target.style.display='none'} />
                  )}
                  <div>
                    <div className="font-display font-black text-gray-900 uppercase text-lg leading-tight">{selectedItem.name}</div>
                    <div className="font-display font-black text-brand-600 text-xl">
                      {convertFromBDT(parseFloat(selectedItem.price)||0, country)}<span className="text-sm font-body text-gray-400">/pc</span>
                    </div>
                    {selectedItem.description && <p className="text-gray-400 text-xs font-body mt-1">{selectedItem.description}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {/* Sizes */}
                  {hasSizes && (
                    <div>
                      <label className="label text-xs">Size</label>
                      <div className="flex flex-wrap gap-2">
                        {post.availableSizes.map(s => (
                          <button key={s} onClick={() => setSelectedSize(s)}
                            className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                              selectedSize === s ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
                            }`}>{s}</button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Colors */}
                  {hasColors && (
                    <div>
                      <label className="label text-xs">Color</label>
                      <div className="flex flex-wrap gap-2">
                        {post.availableColors.map(c => (
                          <button key={c} onClick={() => setSelectedColor(c)}
                            className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                              selectedColor === c ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
                            }`}>{c}</button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Qty + Add */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white">
                    <button onClick={() => setQty(q => Math.max(1, q-1))} className="px-4 py-2.5 hover:bg-gray-50 text-gray-500 transition-colors font-black">
                      <Minus size={14} />
                    </button>
                    <span className="text-base font-black px-4 text-gray-900 min-w-[3rem] text-center">{qty}</span>
                    <button onClick={() => setQty(q => q+1)} className="px-4 py-2.5 hover:bg-gray-50 text-gray-500 transition-colors font-black">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2 font-bold py-3 rounded-xl text-sm transition-all ${
                      addedFeedback ? 'bg-green-500 text-white' : 'btn-primary'
                    }`}>
                    <ShoppingBag size={16} />
                    {addedFeedback ? '✓ Added to Cart!' : `Add ${qty} to Cart`}
                  </button>
                </div>

                {hasSizes && !selectedSize && (
                  <p className="text-xs text-amber-600 font-body mt-2">⚠ Please select a size</p>
                )}
                {hasColors && !selectedColor && (
                  <p className="text-xs text-amber-600 font-body mt-1">⚠ Please select a color</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* No items yet — show price from post */}
        {postItems.length === 0 && (
          <div className="card p-6 mb-6 text-center border-2 border-dashed border-gray-200">
            <div className="text-3xl mb-2">📦</div>
            <p className="font-display font-black text-gray-600 uppercase text-lg mb-1">No individual items listed yet</p>
            <p className="text-gray-400 text-sm font-body mb-4">Contact the supplier directly for product details and pricing</p>
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                WhatsApp Supplier
              </a>
            )}
          </div>
        )}

        {/* Supplier card */}
        {supplier && (
          <Link to={`/supplier/${post.supplierId}`} className="card p-4 mb-6 flex items-center gap-3 hover:border-brand-300 transition-colors border border-gray-100">
            <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">🏭</div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-black text-gray-900 uppercase">{supplier.companyName}</div>
              {supplier.location && <div className="flex items-center gap-1 text-xs text-gray-400 font-body"><MapPin size={10}/> {supplier.location}</div>}
            </div>
            {isVerified && (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-xs font-bold px-2 py-1 rounded-full border border-emerald-200">
                <ShieldCheck size={10}/> Verified
              </span>
            )}
          </Link>
        )}

        {/* Reviews */}
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
                {newRating > 0 && <span className="text-sm text-yellow-500 font-bold mt-1 block font-body">{['','Poor','Fair','Good','Very Good','Excellent'][newRating]}</span>}
              </div>
              <textarea className="input resize-none mb-3" rows={3}
                placeholder="Share your experience with this product or supplier..."
                value={newComment} onChange={e => setNewComment(e.target.value)} />
              {submitError && <p className="text-red-500 text-sm mb-3 font-body">{submitError}</p>}
              {submitSuccess && <p className="text-green-500 text-sm font-bold mb-3 font-body">✓ Review posted!</p>}
              <button type="submit" disabled={submitting || !newComment.trim() || newRating === 0} className="btn-primary disabled:opacity-40">
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
                        <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-black text-brand-600">{(comment.userName||'A')[0].toUpperCase()}</div>
                        <span className="font-bold text-gray-800 text-sm font-body">{comment.userName}</span>
                      </div>
                      <div className="flex gap-0.5 ml-9">{[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= comment.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />)}</div>
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