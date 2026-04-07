import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Plus, Edit2, Trash2, Save, X, Info, Package, AlertCircle, Eye, Star, ShieldCheck } from 'lucide-react'

const CATEGORIES = ['T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories','Socks','Underwear','Swimwear','Uniforms','Other']

const EMPTY_POST = {
  title: '', description: '', category: '',
  price: '', moq: '', material: '',
  imageUrl: '', imageUrl2: '', imageUrl3: '',
  tags: '',
  sampleAvailable: false, samplePrice: '',
  productionTime: '',
  colors: '',
}

export default function MyPosts() {
  const { user, userProfile, isSupplier, refreshProfile } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [form, setForm] = useState(EMPTY_POST)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [deleting, setDeleting] = useState(null)
  const [postViews, setPostViews] = useState({})
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('')
  const [settingUp, setSettingUp] = useState(false)
  const [isVerifiedSeller, setIsVerifiedSeller] = useState(false)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [badgeSubmitted, setBadgeSubmitted] = useState(false)
  const [submittingBadge, setSubmittingBadge] = useState(false)
  const [badgeError, setBadgeError] = useState('')
  const [pendingBadge, setPendingBadge] = useState(false)

  useEffect(() => { if (user) loadAll() }, [user])

  async function loadAll() {
    setLoading(true)
    try {
      const q = query(collection(db, 'posts'), where('supplierId', '==', user.uid))
      const snap = await getDocs(q)
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      const supSnap = await getDoc(doc(db, 'suppliers', user.uid))
      if (supSnap.exists()) {
        const sd = supSnap.data()
        setIsVerifiedSeller(sd.isVerifiedSeller || false)
        setPendingBadge(sd.verifiedBadgePending || false)
      }
      const viewsQ = await getDocs(query(collection(db, 'postViews'), where('supplierId', '==', user.uid)))
      const viewMap = {}
      viewsQ.docs.forEach(d => { const { postId } = d.data(); viewMap[postId] = (viewMap[postId] || 0) + 1 })
      setPostViews(viewMap)
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function setupSupplier() {
    if (!companyName.trim()) return
    setSettingUp(true)
    try {
      await setDoc(doc(db, 'suppliers', user.uid), {
        uid: user.uid, companyName: companyName.trim(), location: location.trim(),
        displayName: userProfile?.displayName || '', categories: [],
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      await setDoc(doc(db, 'users', user.uid), { isSupplier: true }, { merge: true })
      await refreshProfile()
    } catch (e) { console.error(e) }
    setSettingUp(false)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.price || !form.moq) {
      setSaveError('Title, price (BDT) and MOQ are required'); return
    }
    setSaving(true); setSaveError('')
    try {
      const postData = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price: parseFloat(form.price),
        moq: parseInt(form.moq),
        material: form.material.trim(),
        imageUrl: form.imageUrl.trim(),
        imageUrl2: form.imageUrl2.trim(),
        imageUrl3: form.imageUrl3.trim(),
        tags: form.tags.trim(),
        sampleAvailable: form.sampleAvailable,
        samplePrice: form.samplePrice ? parseFloat(form.samplePrice) : null,
        productionTime: form.productionTime.trim(),
        colors: form.colors.trim(),
        currency: 'BDT',
        supplierId: user.uid,
        supplierName: userProfile?.displayName || '',
        updatedAt: new Date().toISOString(),
      }
      if (editingPost) {
        await updateDoc(doc(db, 'posts', editingPost.id), postData)
        setPosts(p => p.map(x => x.id === editingPost.id ? { ...x, ...postData } : x))
      } else {
        postData.createdAt = new Date().toISOString()
        const ref = await addDoc(collection(db, 'posts'), postData)
        setPosts(p => [{ id: ref.id, ...postData }, ...p])
      }
      setShowForm(false); setEditingPost(null); setForm(EMPTY_POST)
    } catch (e) { setSaveError('Save failed: ' + e.message) }
    setSaving(false)
  }

  async function handleDelete(postId) {
    if (!confirm('Delete this post?')) return
    setDeleting(postId)
    try {
      await deleteDoc(doc(db, 'posts', postId))
      setPosts(p => p.filter(x => x.id !== postId))
    } catch (e) { alert('Delete failed') }
    setDeleting(null)
  }

  async function submitBadgeRequest() {
    if (!transactionId.trim()) return
    setSubmittingBadge(true); setBadgeError('')
    try {
      await addDoc(collection(db, 'badgeRequests'), {
        uid: user.uid, companyName: userProfile?.displayName || '',
        email: user.email, tier: 'verified_seller',
        transactionId: transactionId.trim(),
        requestedAt: new Date().toISOString(), status: 'pending',
      })
      await setDoc(doc(db, 'suppliers', user.uid), { verifiedBadgePending: true }, { merge: true })
      setPendingBadge(true); setBadgeSubmitted(true)
    } catch (e) { setBadgeError('Submission failed: ' + e.message) }
    setSubmittingBadge(false)
  }

  function startEdit(post) {
    setForm({
      ...EMPTY_POST, ...post,
      price: String(post.price || ''),
      moq: String(post.moq || ''),
      samplePrice: String(post.samplePrice || ''),
      sampleAvailable: post.sampleAvailable || false,
    })
    setEditingPost(post); setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() { setShowForm(false); setEditingPost(null); setForm(EMPTY_POST); setSaveError('') }

  if (!isSupplier) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🏭</div>
          <h1 className="font-display text-3xl font-black text-gray-900 uppercase mb-2">Become a Supplier</h1>
          <p className="text-gray-400 text-sm mb-6 font-body">Set up your profile to list products and receive orders from international buyers.</p>
          <div className="text-left space-y-4">
            <div><label className="label">Company / Brand Name *</label>
              <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your factory or brand name" /></div>
            <div><label className="label">Location (City, Bangladesh)</label>
              <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Dhaka, Chittagong" /></div>
            <button onClick={setupSupplier} disabled={settingUp || !companyName.trim()} className="btn-primary w-full justify-center py-3">
              {settingUp ? 'Setting up...' : 'Start Selling →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const totalViews = Object.values(postViews).reduce((s, v) => s + v, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight">My Sale Posts</h1>
            <p className="text-gray-400 text-sm mt-1 font-body">{posts.length} post{posts.length !== 1 ? 's' : ''} published</p>
          </div>
          {!showForm && (
            <button onClick={() => { setShowForm(true); setEditingPost(null); setForm(EMPTY_POST) }} className="btn-primary">
              <Plus size={16} /> New Post
            </button>
          )}
        </div>

        {/* Verified Seller Banner */}
        {!isVerifiedSeller && !pendingBadge && (
          <div className="card p-5 mb-6 border-2 border-emerald-200 bg-emerald-50">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0">
                <ShieldCheck size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display text-xl font-black text-gray-900 uppercase">Verified Seller Badge</h3>
                  <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">৳4,999/month</span>
                </div>
                <div className="grid grid-cols-2 gap-1 mb-3 text-xs text-emerald-800 font-body">
                  {['📊 See post visit insights','🔝 Shown before others','✅ Verified badge on all posts','🌍 Featured to international buyers','📈 Priority in search','💬 Higher buyer trust'].map(f => (
                    <div key={f}>{f}</div>
                  ))}
                </div>
                <button onClick={() => { setShowBadgeModal(true); setBadgeSubmitted(false); setTransactionId(''); setBadgeError('') }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors">
                  Apply for Verified Badge
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingBadge && !isVerifiedSeller && (
          <div className="card p-4 mb-6 bg-yellow-50 border-2 border-yellow-200 text-yellow-700 font-semibold font-body">
            ⏳ Verified Seller badge request under review — we'll activate within 24 hours.
          </div>
        )}

        {isVerifiedSeller && (
          <div className="card p-4 mb-6 bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold font-body">
              <ShieldCheck size={16} /> Active Verified Seller Badge
            </div>
            <div className="flex gap-6">
              <div className="text-center"><div className="font-display font-black text-2xl text-gray-900">{totalViews}</div><div className="text-xs text-gray-400 font-body">Total views</div></div>
              <div className="text-center"><div className="font-display font-black text-2xl text-gray-900">{posts.length}</div><div className="text-xs text-gray-400 font-body">Active posts</div></div>
            </div>
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="card p-6 mb-6 border-2 border-brand-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl font-black text-gray-900 uppercase">{editingPost ? 'Edit Post' : 'New Sale Post'}</h2>
              <button onClick={cancelForm} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"><X size={20} /></button>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-body">
                <AlertCircle size={15} /> {saveError}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex gap-2">
              <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 font-body">
                Upload images at <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="underline font-bold">imgur.com/upload</a> → right-click image → "Open in new tab" → copy that URL.
              </p>
            </div>

            <div className="space-y-5">
              {/* Section: Basic */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Product Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="label">Post Title *</label>
                    <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Premium Cotton T-Shirts – Bulk Export" />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      <option value="">Select category</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Material / Fabric</label>
                    <input className="input" value={form.material} onChange={e => setForm({...form, material: e.target.value})} placeholder="e.g. 100% Cotton, 180 GSM" />
                  </div>
                  <div>
                    <label className="label">Available Colors / Variants</label>
                    <input className="input" value={form.colors} onChange={e => setForm({...form, colors: e.target.value})} placeholder="e.g. White, Black, Navy, Custom" />
                  </div>
                  <div>
                    <label className="label">Tags</label>
                    <input className="input" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="cotton, export, custom label" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Description</label>
                    <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                      placeholder="Fabric details, sizes, customization options, certifications, lead time..." />
                  </div>
                </div>
              </div>

              {/* Section: Images */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Product Images (up to 3)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['imageUrl','imageUrl2','imageUrl3'].map((key, i) => (
                    <div key={key}>
                      <label className="label">Image {i+1}{i===0 ? ' (Main) *' : ' (Optional)'}</label>
                      <input className="input text-xs" value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} placeholder="https://i.imgur.com/..." />
                      {form[key] && <img src={form[key]} alt="" className="mt-1.5 h-20 w-full rounded-lg object-cover border border-gray-200" onError={e => e.target.style.display='none'} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Section: Pricing */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Pricing & Order Terms</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Price per unit (৳ BDT) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">৳</span>
                      <input className="input pl-8" type="number" min="0" step="1" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="e.g. 250" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 font-body">Buyers see this in their local currency automatically</p>
                  </div>
                  <div>
                    <label className="label">Min. Order Qty (pcs) *</label>
                    <input className="input" type="number" min="1" value={form.moq} onChange={e => setForm({...form, moq: e.target.value})} placeholder="e.g. 500" />
                  </div>
                  <div>
                    <label className="label">Production Time</label>
                    <input className="input" value={form.productionTime} onChange={e => setForm({...form, productionTime: e.target.value})} placeholder="e.g. 7–15 days" />
                  </div>
                  <div>
                    <label className="label">Sample Available?</label>
                    <div className="flex gap-3 mt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={form.sampleAvailable === true} onChange={() => setForm({...form, sampleAvailable: true})} className="accent-brand-600" />
                        <span className="text-sm font-body text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={form.sampleAvailable === false} onChange={() => setForm({...form, sampleAvailable: false})} className="accent-brand-600" />
                        <span className="text-sm font-body text-gray-700">No</span>
                      </label>
                    </div>
                  </div>
                  {form.sampleAvailable && (
                    <div>
                      <label className="label">Sample Price (৳ BDT)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">৳</span>
                        <input className="input pl-8" type="number" min="0" value={form.samplePrice} onChange={e => setForm({...form, samplePrice: e.target.value})} placeholder="e.g. 1500" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={cancelForm} className="btn-secondary flex-1 justify-center" disabled={saving}>Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
                <Save size={15} /> {saving ? 'Saving...' : editingPost ? 'Update Post' : 'Publish Post'}
              </button>
            </div>
          </div>
        )}

        {/* Posts list */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 font-body">Loading...</div>
        ) : posts.length === 0 && !showForm ? (
          <div className="text-center py-20 card p-10">
            <Package size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-display text-2xl font-black text-gray-700 uppercase mb-2">No posts yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary mt-2"><Plus size={15} /> Create First Post</button>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="card p-4 flex gap-4 items-center">
                {post.imageUrl
                  ? <img src={post.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0" alt="" onError={e => e.target.style.display='none'} />
                  : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">📦</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-gray-900 uppercase text-base leading-tight truncate">{post.title}</div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                    {post.category && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-body">{post.category}</span>}
                    <span className="text-brand-600 font-bold font-body">৳{parseFloat(post.price || 0).toLocaleString()}/pc</span>
                    <span className="text-gray-400 font-body">MOQ {post.moq}</span>
                    {post.sampleAvailable && <span className="text-green-600 font-bold font-body">Sample ✓</span>}
                    {post.ratingCount > 0 && <span className="text-yellow-500 font-bold flex items-center gap-0.5"><Star size={10} className="fill-yellow-400" /> {post.avgRating?.toFixed(1)}</span>}
                    {isVerifiedSeller && <span className="text-emerald-600 font-bold flex items-center gap-1"><Eye size={10} /> {postViews[post.id] || 0} views</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(post)} className="btn-ghost p-2 text-gray-400 hover:text-brand-600"><Edit2 size={15} /></button>
                  <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id} className="btn-ghost p-2 text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badge Modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setShowBadgeModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {badgeSubmitted ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-display text-2xl font-black text-gray-900 uppercase mb-2">Submitted!</h3>
                <p className="text-gray-400 text-sm mb-4 font-body">Your Verified Seller badge request is pending review. We'll activate within 24 hours.</p>
                <button onClick={() => setShowBadgeModal(false)} className="btn-primary w-full justify-center">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <ShieldCheck size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-black text-gray-900 uppercase">Verified Seller</h3>
                    <p className="text-sm text-gray-400 font-body">৳4,999 / month</p>
                  </div>
                </div>
                {badgeError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-body">{badgeError}</div>}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2 font-body">Send <strong>৳4,999</strong> via bKash (Send Money):</p>
                  <div className="bg-white border-2 border-emerald-200 rounded-xl py-3 font-mono text-2xl font-black text-emerald-600 text-center tracking-widest">01819103212</div>
                </div>
                <div className="mb-4">
                  <label className="label">bKash Transaction ID *</label>
                  <input className="input" value={transactionId} onChange={e => setTransactionId(e.target.value)} placeholder="e.g. 8G5K3J2L9M" disabled={submittingBadge} />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowBadgeModal(false)} className="btn-secondary flex-1 justify-center" disabled={submittingBadge}>Cancel</button>
                  <button onClick={submitBadgeRequest} disabled={!transactionId.trim() || submittingBadge}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl flex-1 justify-center flex items-center gap-2 transition-colors disabled:opacity-50">
                    {submittingBadge ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}