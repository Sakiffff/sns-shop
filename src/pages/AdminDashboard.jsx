import { useState, useEffect } from 'react'
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Check, X, Users, Building, ShieldCheck, AlertCircle, RefreshCw, Trash2, FileText, Edit2, Save, Plus, Search, ChevronDown, ChevronUp, ShoppingBag, Clock, Truck } from 'lucide-react'

const CATEGORIES = ['T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories','Socks','Underwear','Swimwear','Uniforms','Other']
const COMMON_SIZES = ['XS','S','M','L','XL','XXL','XXXL','Free Size','Custom']

function AdminItemEditor({ items, onChange }) {
  const [editIdx, setEditIdx] = useState(null)
  const [itemForm, setItemForm] = useState({})

  function startEdit(idx) { setItemForm({...items[idx]}); setEditIdx(idx) }
  function startNew() { setItemForm({ id: Date.now().toString(), name:'', imageUrl:'', price:'', description:'' }); setEditIdx('new') }
  function save() {
    if (!itemForm.name || !itemForm.price) return
    const updated = editIdx === 'new' ? [...items, itemForm] : items.map((x,i) => i === editIdx ? itemForm : x)
    onChange(updated); setEditIdx(null)
  }
  function del(idx) { onChange(items.filter((_,i) => i !== idx)) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase">Items ({items.length})</span>
        <button type="button" onClick={startNew} className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"><Plus size={11}/> Add Item</button>
      </div>
      <div className="space-y-1.5 mb-2">
        {items.map((item, idx) => (
          <div key={item.id||idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
            {item.imageUrl && <img src={item.imageUrl} className="w-8 h-8 rounded object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-800 truncate">{item.name}</div>
              <div className="text-xs text-brand-600 font-body">৳{parseFloat(item.price||0).toLocaleString()}/pc</div>
            </div>
            <button type="button" onClick={() => startEdit(idx)} className="text-gray-400 hover:text-brand-600 p-1"><Edit2 size={13}/></button>
            <button type="button" onClick={() => del(idx)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={13}/></button>
          </div>
        ))}
      </div>
      {editIdx !== null && (
        <div className="bg-white border-2 border-brand-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-display font-black text-gray-900 uppercase text-sm">{editIdx === 'new' ? 'New Item' : 'Edit Item'}</span>
            <button type="button" onClick={() => setEditIdx(null)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className="label text-xs">Item Name *</label><input className="input" value={itemForm.name||''} onChange={e=>setItemForm({...itemForm,name:e.target.value})} placeholder="e.g. White Cotton T-Shirt"/></div>
            <div><label className="label text-xs">Image URL</label><input className="input text-xs" value={itemForm.imageUrl||''} onChange={e=>setItemForm({...itemForm,imageUrl:e.target.value})} placeholder="https://i.imgur.com/..."/>
              {itemForm.imageUrl && <img src={itemForm.imageUrl} className="mt-1 h-16 rounded-lg object-cover border border-gray-200 w-full" alt="" onError={e=>e.target.style.display='none'}/>}
            </div>
            <div><label className="label text-xs">Price (৳ BDT) *</label><input className="input" type="number" value={itemForm.price||''} onChange={e=>setItemForm({...itemForm,price:e.target.value})} placeholder="250"/></div>
            <div className="sm:col-span-2"><label className="label text-xs">Description</label><input className="input" value={itemForm.description||''} onChange={e=>setItemForm({...itemForm,description:e.target.value})} placeholder="Brief description"/></div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditIdx(null)} className="btn-secondary flex-1 justify-center py-2 text-sm">Cancel</button>
            <button type="button" onClick={save} disabled={!itemForm.name||!itemForm.price} className="btn-primary flex-1 justify-center py-2 text-sm disabled:opacity-40"><Save size={13}/> Save Item</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [suppliers, setSuppliers] = useState([])
  const [requests, setRequests] = useState([])
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [postSearch, setPostSearch] = useState('')
  const [tab, setTab] = useState('requests')
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [actionSuccess, setActionSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [orders, setOrders] = useState([])
  const [orderFilter, setOrderFilter] = useState('all')

  function showSuccess(msg) {
    setActionSuccess(msg)
    setActionError('')
    setTimeout(() => setActionSuccess(''), 3000)
  }

  async function loadData() {
    setLoading(true); setActionError('')
    try {
      const [supSnap, reqSnap, postsSnap, ordersSnap] = await Promise.all([
        getDocs(collection(db,'suppliers')),
        getDocs(collection(db,'badgeRequests')),
        getDocs(collection(db,'posts')),
        getDocs(collection(db,'orders')),
      ])
      setSuppliers(supSnap.docs.map(d => ({id:d.id,...d.data()})))
      setRequests(reqSnap.docs.map(d => ({id:d.id,...d.data()})).sort((a,b) => {
        if (a.status==='pending' && b.status!=='pending') return -1
        if (b.status==='pending' && a.status!=='pending') return 1
        return new Date(b.requestedAt) - new Date(a.requestedAt)
      }))
      const allPosts = postsSnap.docs.map(d => ({id:d.id,...d.data()}))
        .sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))
      setPosts(allPosts)
      setFilteredPosts(allPosts)
      const allOrders = ordersSnap.docs.map(d => ({id:d.id,...d.data()}))
        .sort((a,b) => new Date(b.createdAt||0) - new Date(a.createdAt||0))
      setOrders(allOrders)
    } catch(e) { setActionError('Failed to load: ' + e.message) }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!postSearch.trim()) { setFilteredPosts(posts); return }
    const q = postSearch.toLowerCase()
    setFilteredPosts(posts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.supplierName?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    ))
  }, [postSearch, posts])

  function startEditPost(post) {
    setEditForm({
      title: post.title||'', description: post.description||'',
      category: post.category||'', moq: String(post.moq||''),
      material: post.material||'', productionTime: post.productionTime||'',
      bannerUrl: post.bannerUrl||post.imageUrl||'',
      bannerUrl2: post.bannerUrl2||'', bannerUrl3: post.bannerUrl3||'',
      tags: post.tags||'',
      sampleAvailable: post.sampleAvailable||false,
      samplePrice: String(post.samplePrice||''),
      sizesEnabled: post.sizesEnabled||false,
      availableSizes: post.availableSizes||[],
      availableColors: Array.isArray(post.availableColors) ? post.availableColors.join(', ') : (post.availableColors||''),
      items: post.items||[],
      supplierId: post.supplierId||'',
      supplierName: post.supplierName||'',
      currency: post.currency||'BDT',
      avgRating: post.avgRating||null,
      ratingCount: post.ratingCount||0,
      createdAt: post.createdAt||'',
    })
    setEditingPostId(post.id)
    setShowAdvanced(false)
    setActionError('')
    // Scroll to top
    window.scrollTo({top: 0, behavior: 'smooth'})
  }

  async function savePost() {
    if (!editingPostId || !editForm) return
    setSaving(true); setActionError('')
    try {
      // Build clean data object — NO 'id' field, NO undefined values
      const data = {
        title: editForm.title||'',
        description: editForm.description||'',
        category: editForm.category||'',
        moq: parseInt(editForm.moq)||0,
        material: editForm.material||'',
        productionTime: editForm.productionTime||'',
        bannerUrl: editForm.bannerUrl||'',
        bannerUrl2: editForm.bannerUrl2||'',
        bannerUrl3: editForm.bannerUrl3||'',
        imageUrl: editForm.bannerUrl||'', // legacy compat
        tags: editForm.tags||'',
        sampleAvailable: editForm.sampleAvailable||false,
        samplePrice: editForm.samplePrice ? parseFloat(editForm.samplePrice) : null,
        sizesEnabled: editForm.sizesEnabled||false,
        availableSizes: editForm.availableSizes||[],
        availableColors: editForm.availableColors
          ? editForm.availableColors.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        items: (editForm.items||[]).map(item => ({
          id: item.id||Date.now().toString(),
          name: item.name||'',
          imageUrl: item.imageUrl||'',
          price: parseFloat(item.price)||0,
          description: item.description||'',
        })),
        supplierId: editForm.supplierId||'',
        supplierName: editForm.supplierName||'',
        currency: editForm.currency||'BDT',
        avgRating: editForm.avgRating||null,
        ratingCount: editForm.ratingCount||0,
        createdAt: editForm.createdAt||'',
        updatedAt: new Date().toISOString(),
        updatedByAdmin: true,
      }

      // Use setDoc with merge — works regardless of Firestore rules for the owner
      // Note: for this to work, Firestore rules must allow admin writes.
      // Add this rule: allow write: if request.auth.token.email == 'your-admin@email.com'
      await setDoc(doc(db, 'posts', editingPostId), data, { merge: true })

      const saved = { id: editingPostId, ...data }
      setPosts(p => p.map(x => x.id === editingPostId ? saved : x))
      setFilteredPosts(p => p.map(x => x.id === editingPostId ? saved : x))
      setEditingPostId(null)
      setEditForm(null)
      showSuccess('✓ Post saved successfully!')
    } catch(e) {
      console.error('savePost error:', e)
      if (e.message.includes('permission') || e.message.includes('PERMISSION_DENIED')) {
        setActionError('Permission denied. Update your Firestore rules to allow admin writes: match /posts/{id} { allow write: if request.auth != null; }')
      } else {
        setActionError('Save failed: ' + e.message)
      }
    }
    setSaving(false)
  }

  async function updateOrderStatus(orderId, newStatus, statusLabel) {
    setActionLoading(orderId)
    try {
      await setDoc(doc(db,'orders',orderId), {
        status: newStatus,
        statusLabel,
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      setOrders(o => o.map(x => x.id===orderId ? {...x, status:newStatus, statusLabel} : x))
      showSuccess('Order status updated!')
    } catch(e) { setActionError('Update failed: '+e.message) }
    setActionLoading(null)
  }

  async function approveBadge(req) {
    setActionLoading(req.id); setActionError('')
    try {
      // Step 1: Update the badge request status
      await setDoc(doc(db,'badgeRequests',req.id), {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
      }, { merge: true })

      // Step 2: Update supplier document
      if (req.tier === 'verified_seller') {
        await setDoc(doc(db,'suppliers',req.uid), {
          isVerifiedSeller: true,
          verifiedBadgePending: false,
          verifiedAt: new Date().toISOString(),
        }, { merge: true })
        // Step 3: Update user document
        await setDoc(doc(db,'users',req.uid), {
          isVerifiedSeller: true,
        }, { merge: true })
      } else {
        await setDoc(doc(db,'suppliers',req.uid), {
          badgeTier: req.tier,
          badgePending: false,
          badgeApprovedAt: new Date().toISOString(),
        }, { merge: true })
      }

      // Update local state — no errors thrown, all good
      setRequests(r => r.map(x => x.id === req.id ? {...x, status: 'approved'} : x))
      setSuppliers(s => s.map(x => x.id === req.uid
        ? {...x, isVerifiedSeller: req.tier === 'verified_seller' ? true : x.isVerifiedSeller}
        : x))
      showSuccess('✓ Badge approved!')
    } catch(e) {
      console.error('approveBadge error:', e)
      // If user doc update fails, that's ok — the badge was still given
      // Don't show error for partial success
      if (e.message.includes('users')) {
        setRequests(r => r.map(x => x.id === req.id ? {...x, status: 'approved'} : x))
        showSuccess('✓ Badge approved! (user profile will sync on next login)')
      } else {
        setActionError('Approve failed: ' + e.message)
      }
    }
    setActionLoading(null)
  }

  async function rejectBadge(req) {
    setActionLoading(req.id); setActionError('')
    try {
      await setDoc(doc(db,'badgeRequests',req.id), {status:'rejected', reviewedAt:new Date().toISOString()}, {merge:true})
      await setDoc(doc(db,'suppliers',req.uid), {badgePending:false, verifiedBadgePending:false}, {merge:true})
      setRequests(r => r.map(x => x.id === req.id ? {...x, status:'rejected'} : x))
      showSuccess('Request rejected.')
    } catch(e) { setActionError('Reject failed: ' + e.message) }
    setActionLoading(null)
  }

  async function deletePost(postId) {
    if (!confirm('Delete this post permanently? This cannot be undone.')) return
    setActionLoading(postId)
    try {
      await deleteDoc(doc(db,'posts',postId))
      setPosts(p => p.filter(x => x.id !== postId))
      setFilteredPosts(p => p.filter(x => x.id !== postId))
      showSuccess('Post deleted.')
    } catch(e) { setActionError('Delete failed: ' + e.message) }
    setActionLoading(null)
  }

  async function deleteSupplier(supplierId) {
    if (!confirm('Delete this supplier profile? This cannot be undone.')) return
    setActionLoading(supplierId)
    try {
      await deleteDoc(doc(db,'suppliers',supplierId))
      setSuppliers(s => s.filter(x => x.id !== supplierId))
      showSuccess('Supplier profile deleted.')
    } catch(e) { setActionError('Delete failed: ' + e.message) }
    setActionLoading(null)
  }

  function toggleSize(s) {
    setEditForm(f => ({
      ...f,
      availableSizes: f.availableSizes.includes(s)
        ? f.availableSizes.filter(x => x !== s)
        : [...f.availableSizes, s]
    }))
  }

  const pending = requests.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1 font-body">Full control over posts, suppliers, and badges</p>
          </div>
          <button onClick={loadData} className="btn-secondary gap-2"><RefreshCw size={14}/> Refresh</button>
        </div>

        {/* Firestore rules reminder */}
        <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm font-body">
          <p className="font-bold text-amber-800 mb-1">⚠️ Required Firestore Rule for admin post editing:</p>
          <code className="text-xs bg-amber-100 px-2 py-1 rounded text-amber-900 block">
            match /posts/{'{postId}'} {'{'} allow read: if true; allow write: if request.auth != null; {'}'}
          </code>
          <p className="text-amber-600 text-xs mt-1">Make sure this is in your Firestore rules — otherwise post saves will fail.</p>
        </div>

        {actionError && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-2 text-sm font-body">
            <AlertCircle size={16} className="shrink-0 mt-0.5"/>
            <div>{actionError}</div>
          </div>
        )}
        {actionSuccess && (
          <div className="mb-5 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-body font-semibold">
            {actionSuccess}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            {label:'Suppliers', value:suppliers.length, icon:<Building size={18}/>},
            {label:'Verified', value:suppliers.filter(s=>s.isVerifiedSeller).length, icon:<ShieldCheck size={18} className="text-emerald-600"/>},
            {label:'Total Posts', value:posts.length, icon:<FileText size={18}/>},
            {label:'Pending Orders', value:orders.filter(o=>o.status==='pending_payment').length, icon:<ShoppingBag size={18} className="text-orange-500"/>},
            {label:'Pending Badges', value:pending.length, icon:<Users size={18} className="text-brand-600"/>},
          ].map(stat => (
            <div key={stat.label} className="card p-5">
              <div className="mb-2">{stat.icon}</div>
              <div className="font-display text-3xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400 font-body">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            {key:'orders', label:`Orders (${orders.filter(o=>o.status==='pending_payment').length} pending)`},
            {key:'requests', label:pending.length > 0 ? `Badge Requests (${pending.length} pending)` : 'Badge Requests'},
            {key:'posts', label:`All Posts (${posts.length})`},
            {key:'suppliers', label:`Suppliers (${suppliers.length})`},
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all font-body ${tab===t.key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-body">Loading...</div>
        ) : tab === 'orders' ? (
          /* ── Orders ── */
          <div>
            <div className="flex gap-2 mb-4 flex-wrap">
              {[
                {v:'all', l:'All Orders'},
                {v:'pending_payment', l:'Pending Verification'},
                {v:'payment_confirmed', l:'Confirmed'},
                {v:'in_delivery', l:'In Delivery'},
                {v:'shipped', l:'Shipped'},
              ].map(f => (
                <button key={f.v} onClick={() => setOrderFilter(f.v)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold font-body transition-all ${orderFilter===f.v ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                  {f.l} {f.v !== 'all' && `(${orders.filter(o=>o.status===f.v).length})`}
                </button>
              ))}
            </div>
            {(orderFilter==='all' ? orders : orders.filter(o=>o.status===orderFilter)).length === 0 ? (
              <div className="text-center py-16 text-gray-400 font-body">No orders in this category.</div>
            ) : (
              <div className="space-y-4">
                {(orderFilter==='all' ? orders : orders.filter(o=>o.status===orderFilter)).map(order => (
                  <div key={order.id} className={`card p-5 ${order.status==='pending_payment' ? 'border-l-4 border-l-yellow-400' : ''}`}>
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-display font-black text-gray-900 uppercase">#{order.id.slice(0,8).toUpperCase()}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold font-body ${
                            order.status==='pending_payment' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                            order.status==='payment_confirmed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            order.status==='in_delivery' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                            order.status==='shipped' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>{order.statusLabel || order.status}</span>
                        </div>
                        <div className="text-sm text-gray-500 font-body">
                          <strong>{order.buyerName}</strong> · {order.buyerEmail}
                        </div>
                        <div className="text-xs text-gray-400 font-body">
                          From: {order.buyerCountry} · {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-display font-black text-2xl text-gray-900">
                          {order.currencySymbol}{(order.totalAmount||0).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400 font-body">{order.currency}</div>
                      </div>
                    </div>

                    {/* Remitly ref */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      <div className="text-xs text-amber-600 font-body font-bold mb-0.5">Remitly Reference</div>
                      <div className="font-mono font-black text-amber-900 text-lg">{order.remitlyRef}</div>
                      {order.notes && <div className="text-xs text-amber-700 font-body mt-1">Notes: {order.notes}</div>}
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5 mb-4">
                      {(order.items||[]).map((item,i) => (
                        <div key={i} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                          {item.itemImage && <img src={item.itemImage} className="w-7 h-7 rounded object-cover shrink-0" alt="" onError={e=>e.target.style.display="none"}/>}
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-gray-800 truncate block">{item.itemName}</span>
                            <span className="text-xs text-gray-400 font-body">
                              {item.supplierName} · Qty {item.qty}{item.size?` · ${item.size}`:""}{item.color?` · ${item.color}`:""}
                            </span>
                          </div>
                          <span className="text-xs text-brand-600 font-bold font-body shrink-0">{order.currencySymbol}{(item.priceConverted||0).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-2 flex-wrap">
                      {order.status === 'pending_payment' && (
                        <button onClick={() => updateOrderStatus(order.id, 'payment_confirmed', 'Payment Confirmed')}
                          disabled={actionLoading===order.id}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold disabled:opacity-50 transition-colors">
                          {actionLoading===order.id ? '...' : <><Check size={12}/> Confirm Payment</>}
                        </button>
                      )}
                      {order.status === 'payment_confirmed' && (
                        <button onClick={() => updateOrderStatus(order.id, 'in_delivery', 'In Delivery Queue')}
                          disabled={actionLoading===order.id}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-purple-600 text-white hover:bg-purple-700 font-bold disabled:opacity-50 transition-colors">
                          {actionLoading===order.id ? '...' : <><Truck size={12}/> Move to Delivery</>}
                        </button>
                      )}
                      {order.status === 'in_delivery' && (
                        <button onClick={() => updateOrderStatus(order.id, 'shipped', 'Shipped')}
                          disabled={actionLoading===order.id}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold disabled:opacity-50 transition-colors">
                          {actionLoading===order.id ? '...' : <><Truck size={12}/> Mark as Shipped</>}
                        </button>
                      )}
                      {order.status === 'shipped' && (
                        <button onClick={() => updateOrderStatus(order.id, 'delivered', 'Delivered')}
                          disabled={actionLoading===order.id}
                          className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl bg-gray-600 text-white hover:bg-gray-700 font-bold disabled:opacity-50 transition-colors">
                          {actionLoading===order.id ? '...' : <><Check size={12}/> Mark Delivered</>}
                        </button>
                      )}
                      <button onClick={async () => {
                        if(!confirm('Delete this order?')) return
                        await deleteDoc(doc(db,'orders',order.id))
                        setOrders(o => o.filter(x => x.id !== order.id))
                      }} className="text-xs px-3 py-2 rounded-xl text-red-500 border border-red-200 hover:bg-red-50 font-body">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : tab === 'requests' ? (

          /* ── Badge Requests ── */
          <div className="space-y-3">
            {requests.length === 0 && <div className="text-center py-16 text-gray-400 font-body">No badge requests yet.</div>}
            {requests.map(req => (
              <div key={req.id} className={`card p-5 ${req.status==='pending' ? 'border-l-4 border-l-yellow-400' : ''}`}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-display font-black text-gray-900 text-lg uppercase">{req.companyName||'(no name)'}</span>
                      {req.tier === 'verified_seller' && (
                        <span className="verified-seller-badge"><ShieldCheck size={9}/> Verified Seller</span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 font-body">{req.email}</div>
                    <div className="text-xs text-gray-300 font-body">{req.requestedAt ? new Date(req.requestedAt).toLocaleString() : ''}</div>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-400 font-body">bKash TxID:</span>
                      <code className="text-sm bg-gray-100 px-2 py-0.5 rounded-lg text-gray-800 font-bold">{req.transactionId}</code>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-body">
                      Amount: ৳{req.tier==='verified_seller' ? '4,999' : req.tier==='golden' ? '30,000' : '500'}/month
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-body ${
                      req.status==='pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      req.status==='approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>{req.status}</span>
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => approveBadge(req)} disabled={actionLoading===req.id}
                          className="flex items-center gap-1 text-xs px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold disabled:opacity-50 transition-colors">
                          {actionLoading===req.id ? '...' : <><Check size={12}/> Approve</>}
                        </button>
                        <button onClick={() => rejectBadge(req)} disabled={actionLoading===req.id}
                          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold disabled:opacity-50 transition-colors">
                          {actionLoading===req.id ? '...' : <><X size={12}/> Reject</>}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        ) : tab === 'posts' ? (

          /* ── Posts ── */
          <div>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input pl-9" placeholder="Search by title, supplier name, category..."
                value={postSearch} onChange={e => setPostSearch(e.target.value)}/>
            </div>

            {/* Post editor */}
            {editingPostId && editForm && (
              <div className="card p-6 border-2 border-brand-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display text-xl font-black text-gray-900 uppercase">Editing Post</h2>
                  <button onClick={() => {setEditingPostId(null); setEditForm(null)}} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"><X size={20}/></button>
                </div>

                <div className="space-y-5">
                  {/* Basic */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><label className="label">Title</label><input className="input" value={editForm.title} onChange={e=>setEditForm({...editForm,title:e.target.value})}/></div>
                    <div><label className="label">Category</label>
                      <select className="input" value={editForm.category} onChange={e=>setEditForm({...editForm,category:e.target.value})}>
                        <option value="">Select</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label className="label">MOQ (pcs)</label><input className="input" type="number" value={editForm.moq} onChange={e=>setEditForm({...editForm,moq:e.target.value})}/></div>
                    <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input resize-none" rows={2} value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})}/></div>
                  </div>

                  {/* Banner images */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Banner Images</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[{key:'bannerUrl',label:'Banner 1 (Main)'},{key:'bannerUrl2',label:'Banner 2'},{key:'bannerUrl3',label:'Banner 3'}].map(f => (
                        <div key={f.key}>
                          <label className="label text-xs">{f.label}</label>
                          <input className="input text-xs" value={editForm[f.key]||''} onChange={e=>setEditForm({...editForm,[f.key]:e.target.value})} placeholder="https://i.imgur.com/..."/>
                          {editForm[f.key] && <img src={editForm[f.key]} className="mt-1.5 h-20 w-full rounded-lg object-cover border border-gray-200" alt="" onError={e=>e.target.style.display='none'}/>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Items */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Individual Items</h3>
                    <p className="text-xs text-gray-400 font-body mb-3">Add/edit individual products. Use imgur.com for images.</p>
                    <AdminItemEditor items={editForm.items||[]} onChange={items => setEditForm(f=>({...f,items}))}/>
                  </div>

                  {/* Advanced toggle */}
                  <div>
                    <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors font-body">
                      {showAdvanced ? <ChevronUp size={15}/> : <ChevronDown size={15}/>} Advanced Options
                    </button>
                    {showAdvanced && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="label">Material</label><input className="input" value={editForm.material||''} onChange={e=>setEditForm({...editForm,material:e.target.value})} placeholder="e.g. 100% Cotton"/></div>
                        <div><label className="label">Production Time</label><input className="input" value={editForm.productionTime||''} onChange={e=>setEditForm({...editForm,productionTime:e.target.value})} placeholder="e.g. 7-15 days"/></div>
                        <div><label className="label">Colors (comma sep)</label><input className="input" value={editForm.availableColors||''} onChange={e=>setEditForm({...editForm,availableColors:e.target.value})}/></div>
                        <div><label className="label">Tags</label><input className="input" value={editForm.tags||''} onChange={e=>setEditForm({...editForm,tags:e.target.value})}/></div>
                        <div className="sm:col-span-2">
                          <label className="flex items-center gap-3 cursor-pointer mb-3">
                            <input type="checkbox" checked={editForm.sizesEnabled||false} onChange={e=>setEditForm({...editForm,sizesEnabled:e.target.checked})} className="w-4 h-4 accent-brand-600 rounded"/>
                            <span className="text-sm font-semibold text-gray-700 font-body">Enable size selection</span>
                          </label>
                          {editForm.sizesEnabled && (
                            <div className="flex flex-wrap gap-2">
                              {COMMON_SIZES.map(s => (
                                <button key={s} type="button" onClick={() => toggleSize(s)}
                                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${(editForm.availableSizes||[]).includes(s) ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-gray-200 text-gray-600'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={() => {setEditingPostId(null); setEditForm(null)}} className="btn-secondary flex-1 justify-center" disabled={saving}>Cancel</button>
                  <button onClick={savePost} disabled={saving} className="btn-primary flex-1 justify-center">
                    <Save size={15}/> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {/* Posts list */}
            <div className="space-y-2">
              {filteredPosts.length === 0 && <div className="text-center py-12 text-gray-400 font-body">No posts found.</div>}
              {filteredPosts.map(post => (
                <div key={post.id} className={`card p-4 flex gap-4 items-center ${editingPostId===post.id ? 'border-2 border-brand-400' : ''}`}>
                  {(post.bannerUrl||post.imageUrl)
                    ? <img src={post.bannerUrl||post.imageUrl} className="w-14 h-14 rounded-xl object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>
                    : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">📦</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-black text-gray-900 uppercase text-sm leading-tight truncate">{post.title}</div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-body flex-wrap">
                      <span>By: <strong>{post.supplierName}</strong></span>
                      {post.category && <span className="bg-gray-100 px-1.5 py-0.5 rounded">{post.category}</span>}
                      <span className="text-blue-600 font-bold">{(post.items||[]).length} items</span>
                      <span>{post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => startEditPost(post)} className="btn-ghost p-2 text-gray-400 hover:text-brand-600" title="Edit"><Edit2 size={15}/></button>
                    <button onClick={() => deletePost(post.id)} disabled={actionLoading===post.id} className="btn-ghost p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* ── Suppliers ── */
          <div className="space-y-3">
            {suppliers.length === 0 && <div className="text-center py-12 text-gray-400 font-body">No suppliers yet.</div>}
            {suppliers.map(s => (
              <div key={s.id} className="card p-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-display font-black text-gray-900 uppercase text-base">{s.companyName||'—'}</div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {s.location && <span className="text-xs text-gray-400 font-body">{s.location}</span>}
                    {s.businessType && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-body">{s.businessType}</span>}
                    {s.isVerifiedSeller && <span className="verified-seller-badge"><ShieldCheck size={9}/> Verified Seller</span>}
                  </div>
                  {s.email && <div className="text-xs text-gray-300 font-body mt-0.5">{s.email}</div>}
                </div>
                <div className="flex gap-2 flex-wrap shrink-0">
                  {s.isVerifiedSeller && (
                    <button onClick={async () => {
                      await setDoc(doc(db,'suppliers',s.id),{isVerifiedSeller:false},{merge:true})
                      setSuppliers(x => x.map(v => v.id===s.id ? {...v,isVerifiedSeller:false} : v))
                      showSuccess('Verified badge removed.')
                    }} className="text-xs px-3 py-1.5 rounded-lg text-orange-600 border border-orange-200 hover:bg-orange-50 transition-colors font-body">
                      Remove Badge
                    </button>
                  )}
                  <button onClick={() => deleteSupplier(s.id)} disabled={actionLoading===s.id}
                    className="text-xs px-3 py-1.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors font-body disabled:opacity-50">
                    {actionLoading===s.id ? '...' : 'Delete Profile'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}