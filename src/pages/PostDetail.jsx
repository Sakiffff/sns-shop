import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { doc, getDoc, collection, addDoc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { convertFromBDT } from '../utils/currency'
import Navbar from '../components/Navbar'
import { Star, ShoppingBag, MessageCircle, MapPin, ShieldCheck, Send, ArrowLeft, Plus, Minus, ChevronLeft, ChevronRight, Check, FlaskConical } from 'lucide-react'

function StarPicker({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} type="button"
          onMouseEnter={() => setHovered(s)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(s)} className="transition-transform hover:scale-110">
          <Star size={24} className={s <= (hovered || value) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'} />
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
  const [selectedItem, setSelectedItem] = useState(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [qty, setQty] = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const [mainImgIdx, setMainImgIdx] = useState(0)
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
        if (postData.items?.length > 0) setSelectedItem(postData.items[0])
        addDoc(collection(db, 'postViews'), { postId, supplierId: postData.supplierId || '', viewedAt: new Date().toISOString(), country: country || 'Unknown' }).catch(() => {})
        if (postData.supplierId) {
          getDoc(doc(db, 'suppliers', postData.supplierId)).then(snap => { if (snap.exists()) setSupplier(snap.data()) }).catch(() => {})
        }
        const commentsSnap = await getDocs(collection(db, 'posts', postId, 'comments'))
        setComments(commentsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)))
      } catch(e) { setLoadError('Failed to load: ' + e.message) }
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
    if (newRating === 0) { setSubmitError('Please select a rating'); return }
    setSubmitting(true); setSubmitError('')
    try {
      const comment = { text: newComment.trim(), rating: newRating, userId: user.uid, userName: userProfile?.displayName || 'Anonymous', createdAt: new Date().toISOString() }
      const ref = await addDoc(collection(db, 'posts', postId, 'comments'), comment)
      const updated = [{ id: ref.id, ...comment }, ...comments]
      setComments(updated)
      const avg = Math.round((updated.reduce((s, c) => s + c.rating, 0) / updated.length) * 10) / 10
      await updateDoc(doc(db, 'posts', postId), { avgRating: avg, ratingCount: updated.length })
      setPost(p => ({ ...p, avgRating: avg, ratingCount: updated.length }))
      setNewComment(''); setNewRating(0)
      setSubmitSuccess(true); setTimeout(() => setSubmitSuccess(false), 3000)
    } catch(e) { setSubmitError('Failed: ' + e.message) }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="min-h-screen bg-white"><Navbar />
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    </div>
  )

  if (loadError || !post) return (
    <div className="min-h-screen bg-white"><Navbar />
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
  const bannerImages = [post.bannerUrl, post.bannerUrl2, post.bannerUrl3, post.imageUrl].filter(Boolean)
  const postItems = post.items || []
  const itemImages = postItems.map(i => i.imageUrl).filter(Boolean)
  const baseImages = bannerImages.length > 0 ? bannerImages : itemImages
  const displayImages = selectedItem?.imageUrl
    ? [selectedItem.imageUrl, ...baseImages.filter(i => i !== selectedItem.imageUrl)]
    : baseImages

  const hasSizes = post.sizesEnabled && post.availableSizes?.length > 0
  const hasColors = (post.availableColors || []).length > 0

  const whatsappUrl = supplier?.whatsapp
    ? `https://wa.me/${supplier.whatsapp.replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(supplier.companyName||'Supplier')}%2C%20I%27m%20interested%20in%20%22${encodeURIComponent(post.title)}%22%20on%20S%26S%20Shop`
    : null

  const currentPrice = selectedItem
    ? convertFromBDT(parseFloat(selectedItem.price)||0, country)
    : convertFromBDT(parseFloat(post.price)||0, country)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 text-xs text-gray-400 font-body flex-wrap">
        <button onClick={() => navigate('/')} className="hover:text-brand-600 transition-colors">Home</button>
        <span>›</span>
        {post.category && <><span className="hover:text-brand-600 cursor-pointer transition-colors">{post.category}</span><span>›</span></>}
        <span className="text-gray-600 truncate max-w-xs">{post.title}</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

          {/* ── LEFT: Gallery ── */}
          <div className="lg:w-[420px] shrink-0">
            {/* Main image */}
            <div className="relative bg-gray-50 rounded-2xl overflow-hidden border border-gray-100" style={{aspectRatio:'1/1'}}>
              {displayImages.length > 0 ? (
                <img src={displayImages[mainImgIdx] || displayImages[0]} alt={post.title}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display='none' }}/>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-7xl bg-gray-50">📦</div>
              )}
              {displayImages.length > 1 && (
                <>
                  <button onClick={() => setMainImgIdx(i => (i-1+displayImages.length)%displayImages.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                    <ChevronLeft size={17} className="text-gray-600"/>
                  </button>
                  <button onClick={() => setMainImgIdx(i => (i+1)%displayImages.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
                    <ChevronRight size={17} className="text-gray-600"/>
                  </button>
                </>
              )}
              {isVerified && (
                <div className="absolute top-3 left-3">
                  <span className="verified-seller-badge"><ShieldCheck size={9}/> Verified Seller</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {displayImages.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                {displayImages.map((img, i) => (
                  <button key={i} onClick={() => setMainImgIdx(i)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      mainImgIdx===i ? 'border-brand-600 shadow-sm' : 'border-gray-200 hover:border-gray-400'
                    }`}>
                    <img src={img} className="w-full h-full object-cover" alt="" onError={e=>e.target.style.display='none'}/>
                  </button>
                ))}
              </div>
            )}

            {/* Supplier card */}
            {supplier && (
              <Link to={`/supplier/${post.supplierId}`}
                className="mt-4 flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50/20 transition-all">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">🏭</div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-gray-900 text-sm truncate" style={{letterSpacing:'-0.01em'}}>{supplier.companyName}</div>
                  {supplier.location && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 font-body mt-0.5">
                      <MapPin size={10}/> {supplier.location}
                    </div>
                  )}
                </div>
                {isVerified && <span className="verified-seller-badge shrink-0"><ShieldCheck size={9}/> Verified</span>}
              </Link>
            )}
          </div>

          {/* ── RIGHT: Purchase panel ── */}
          <div className="flex-1 min-w-0">

            {/* Category + Title + Rating */}
            <div className="mb-5">
              {post.category && (
                <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-md font-body uppercase tracking-wide">{post.category}</span>
              )}
              <h1 className="font-display font-bold text-gray-900 text-xl sm:text-2xl leading-snug mt-2 mb-2" style={{letterSpacing:'-0.025em'}}>{post.title}</h1>
              {post.ratingCount > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} className={s<=Math.round(post.avgRating||0)?'text-yellow-400 fill-yellow-400':'text-gray-200 fill-gray-200'}/>)}
                  </div>
                  <span className="text-sm font-bold text-gray-700">{post.avgRating?.toFixed(1)}</span>
                  <span className="text-sm text-gray-400 font-body">({post.ratingCount} reviews)</span>
                </div>
              )}
            </div>

            {/* Price box */}
            <div className="bg-gray-50 rounded-2xl p-4 mb-5 border border-gray-100">
              <div className="flex items-baseline gap-2 mb-1.5">
                <span className="font-display font-black text-brand-600 text-4xl" style={{letterSpacing:'-0.03em'}}>{currentPrice}</span>
                <span className="text-gray-400 font-body text-sm">/pc</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm font-body">
                {post.moq && (
                  <span className="text-gray-500">Min. order: <strong className="text-gray-700">{post.moq} pcs</strong></span>
                )}
                {post.sampleAvailable && (
                  <span className="flex items-center gap-1 text-gray-500">
                    <FlaskConical size={12} className="text-blue-400"/>
                    Sample: <strong className="text-gray-700">{post.samplePrice ? convertFromBDT(parseFloat(post.samplePrice), country) : 'Available'}</strong>
                  </span>
                )}
              </div>
            </div>

            {/* Items */}
            {postItems.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display font-bold text-gray-900 text-sm" style={{letterSpacing:'-0.01em'}}>
                    {selectedItem ? `Item: ${selectedItem.name}` : 'Select Item'}
                  </span>
                  <span className="text-xs text-gray-400 font-body">{postItems.length} options</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {postItems.map(item => {
                    const isSel = selectedItem?.id === item.id
                    return (
                      <button key={item.id} onClick={() => { setSelectedItem(item); setSelectedSize(''); setSelectedColor(''); setMainImgIdx(0) }}
                        className={`rounded-xl border-2 overflow-hidden text-left transition-all ${isSel ? 'border-brand-600 shadow-sm' : 'border-gray-200 hover:border-gray-400'}`}>
                        <div className="overflow-hidden bg-gray-50" style={{aspectRatio:'1/1'}}>
                          {item.imageUrl
                            ? <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} onError={e=>e.target.style.display='none'}/>
                            : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                          }
                        </div>
                        <div className="p-1.5">
                          <div className="text-xs font-semibold text-gray-800 truncate font-body leading-tight">{item.name}</div>
                          <div className="text-xs font-bold text-brand-600 font-body mt-0.5">{convertFromBDT(parseFloat(item.price)||0, country)}</div>
                        </div>
                        {isSel && <div className="bg-brand-600 py-0.5 flex items-center justify-center gap-1"><Check size={9} className="text-white"/></div>}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Size */}
            {hasSizes && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-gray-900 text-sm" style={{letterSpacing:'-0.01em'}}>Size</span>
                  {selectedSize && <span className="text-xs font-semibold text-brand-600 font-body">{selectedSize}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.availableSizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all font-body ${selectedSize===s ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color */}
            {hasColors && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-display font-bold text-gray-900 text-sm" style={{letterSpacing:'-0.01em'}}>Color</span>
                  {selectedColor && <span className="text-xs font-semibold text-brand-600 font-body">{selectedColor}</span>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {post.availableColors.map(c => (
                    <button key={c} onClick={() => setSelectedColor(c)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all font-body ${selectedColor===c ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {postItems.length > 0 && selectedItem && (
              <div className="mb-5">
                <span className="font-display font-bold text-gray-900 text-sm block mb-2" style={{letterSpacing:'-0.01em'}}>Quantity</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1,q-1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"><Minus size={13}/></button>
                    <span className="w-12 text-center font-bold text-gray-900 font-body">{qty}</span>
                    <button onClick={() => setQty(q => q+1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-50 text-gray-600 transition-colors"><Plus size={13}/></button>
                  </div>
                  <span className="text-sm text-gray-400 font-body">pieces</span>
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="flex gap-3 mb-5 flex-wrap">
              {postItems.length > 0 && selectedItem ? (
                <button onClick={handleAddToCart}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold text-sm transition-all ${addedFeedback ? 'bg-green-500 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'}`}
                  style={{letterSpacing:'-0.01em', minWidth:'160px'}}>
                  <ShoppingBag size={15}/>
                  {addedFeedback ? '✓ Added!' : `Add ${qty} to Cart`}
                </button>
              ) : (
                <div className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-100 text-gray-400 font-display font-bold text-sm cursor-not-allowed" style={{minWidth:'160px'}}>
                  <ShoppingBag size={15}/> Select item above
                </div>
              )}
              {user ? (
                <Link to={`/chat/${post.supplierId}`}
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-900 text-gray-900 font-display font-bold text-sm hover:bg-gray-900 hover:text-white transition-all whitespace-nowrap"
                  style={{letterSpacing:'-0.01em'}}>
                  <MessageCircle size={14}/> Chat now
                </Link>
              ) : (
                <Link to="/auth"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-gray-200 text-gray-500 font-display font-bold text-sm hover:border-gray-900 hover:text-gray-900 transition-all whitespace-nowrap">
                  <MessageCircle size={14}/> Chat now
                </Link>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl bg-green-500 hover:bg-green-600 text-white font-display font-bold text-sm transition-all whitespace-nowrap"
                  style={{letterSpacing:'-0.01em'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.118 1.531 5.845L.057 23.882l6.194-1.623A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.359-.214-3.677.964.981-3.595-.234-.369A9.818 9.818 0 1112 21.818z"/></svg>
                  WhatsApp
                </a>
              )}
            </div>

            {/* Order protection box */}
            <div className="border border-gray-100 rounded-2xl p-4 mb-5 bg-gray-50/50">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 font-body">S&S Shop Order Protection</div>
              <div className="space-y-3">
                {[
                  { icon:'🔒', title:'Secure payment', desc:'Funds held via Remitly until your order is confirmed' },
                  { icon:'💸', title:'Money-back protection', desc:'Full refund if order is not fulfilled as described' },
                  { icon:isVerified?'✅':'🏭', title:isVerified?'Verified supplier':'Supplier on S&S Shop', desc:isVerified?'This seller passed S&S Shop verification':'Listed and monitored on our platform' },
                ].map(t => (
                  <div key={t.title} className="flex items-start gap-3">
                    <span className="text-base shrink-0 mt-0.5">{t.icon}</span>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 font-body">{t.title}</div>
                      <div className="text-xs text-gray-400 font-body leading-relaxed">{t.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Specs table */}
            {(post.material || post.productionTime || post.moq || post.tags) && (
              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 font-body">Specifications</div>
                <div className="divide-y divide-gray-50">
                  {[
                    { label:'Material', value:post.material },
                    { label:'Production time', value:post.productionTime },
                    { label:'Min. order', value:post.moq ? `${post.moq} pieces` : null },
                    { label:'Tags', value:post.tags },
                  ].filter(r=>r.value).map(row => (
                    <div key={row.label} className="flex gap-4 py-2.5 text-sm font-body">
                      <span className="text-gray-400 w-32 shrink-0">{row.label}</span>
                      <span className="text-gray-700 font-medium">{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── ABOUT ── */}
        {post.description && (
          <div className="mt-12 border-t border-gray-100 pt-8">
            <h2 className="font-display font-bold text-gray-900 text-lg mb-3" style={{letterSpacing:'-0.02em'}}>About this product</h2>
            <p className="text-gray-600 font-body text-sm leading-relaxed max-w-3xl">{post.description}</p>
          </div>
        )}

        {/* ── REVIEWS ── */}
        <div className="mt-12 border-t border-gray-100 pt-8">
          <div className="flex items-center gap-3 mb-6 flex-wrap">
            <h2 className="font-display font-bold text-gray-900 text-lg" style={{letterSpacing:'-0.02em'}}>Reviews</h2>
            {post.ratingCount > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">{[1,2,3,4,5].map(s=><Star key={s} size={13} className={s<=Math.round(post.avgRating||0)?'text-yellow-400 fill-yellow-400':'text-gray-200 fill-gray-200'}/>)}</div>
                <span className="text-sm font-bold text-gray-700">{post.avgRating?.toFixed(1)}</span>
                <span className="text-sm text-gray-400 font-body">· {post.ratingCount} {post.ratingCount===1?'review':'reviews'}</span>
              </div>
            )}
          </div>

          {user ? (
            <form onSubmit={submitComment} className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 max-w-xl">
              <p className="font-display font-bold text-gray-900 text-sm mb-4" style={{letterSpacing:'-0.01em'}}>Write a Review</p>
              <div className="mb-4">
                <p className="text-xs text-gray-400 font-body mb-2">Rating *</p>
                <StarPicker value={newRating} onChange={setNewRating}/>
                {newRating > 0 && <span className="text-sm text-yellow-600 font-semibold mt-1 block font-body">{['','Poor','Fair','Good','Very Good','Excellent'][newRating]}</span>}
              </div>
              <textarea className="input resize-none mb-3" rows={3} placeholder="Share your experience with this product or supplier..." value={newComment} onChange={e=>setNewComment(e.target.value)}/>
              {submitError && <p className="text-red-500 text-sm mb-3 font-body">{submitError}</p>}
              {submitSuccess && <p className="text-green-500 text-sm font-semibold mb-3 font-body">✓ Review posted!</p>}
              <button type="submit" disabled={submitting||!newComment.trim()||newRating===0} className="btn-primary disabled:opacity-40">
                <Send size={13}/> {submitting?'Posting...':'Post Review'}
              </button>
            </form>
          ) : (
            <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100 text-center max-w-xl">
              <p className="text-gray-400 text-sm font-body mb-3">Login to write a review</p>
              <Link to="/auth" className="btn-primary">Login</Link>
            </div>
          )}

          {comments.length === 0 ? (
            <div className="text-center py-10">
              <Star size={32} className="mx-auto mb-3 text-gray-100 fill-gray-100"/>
              <p className="text-gray-300 text-sm font-body">No reviews yet — be the first!</p>
            </div>
          ) : (
            <div className="space-y-5 max-w-2xl">
              {comments.map(comment => (
                <div key={comment.id} className="border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-xs font-bold text-brand-600 border border-brand-100">{(comment.userName||'A')[0].toUpperCase()}</div>
                      <div>
                        <div className="font-semibold text-gray-800 text-sm font-body">{comment.userName}</div>
                        <div className="flex gap-0.5 mt-0.5">{[1,2,3,4,5].map(s=><Star key={s} size={11} className={s<=comment.rating?'text-yellow-400 fill-yellow-400':'text-gray-200 fill-gray-200'}/>)}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-300 font-body">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-600 text-sm font-body leading-relaxed pl-10">{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}