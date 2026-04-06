import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Plus, Edit2, Trash2, Save, X, Info, Package, DollarSign, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

const CATEGORIES = ['T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories','Socks','Underwear','Swimwear','Uniforms','Other']

const EMPTY_POST = {
  title: '', description: '', category: '', price: '', currency: 'USD',
  moq: '', imageUrl: '', tags: ''
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

  // Supplier profile state
  const [supplierSetup, setSupplierSetup] = useState(false)
  const [companyName, setCompanyName] = useState('')
  const [location, setLocation] = useState('')
  const [settingUp, setSettingUp] = useState(false)

  useEffect(() => {
    if (user) loadPosts()
  }, [user])

  async function loadPosts() {
    setLoading(true)
    try {
      const q = query(collection(db, 'posts'), where('supplierId', '==', user.uid))
      const snap = await getDocs(q)
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function setupSupplier() {
    if (!companyName.trim()) return
    setSettingUp(true)
    try {
      const { setDoc } = await import('firebase/firestore')
      await setDoc(doc(db, 'suppliers', user.uid), {
        uid: user.uid, companyName: companyName.trim(), location: location.trim(),
        displayName: userProfile?.displayName || '', categories: [],
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      await setDoc(doc(db, 'users', user.uid), { isSupplier: true }, { merge: true })
      await refreshProfile()
      setSupplierSetup(true)
    } catch (e) { console.error(e) }
    setSettingUp(false)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.price || !form.moq) {
      setSaveError('Title, price and MOQ are required'); return
    }
    setSaving(true); setSaveError('')
    try {
      const postData = {
        ...form,
        price: parseFloat(form.price),
        moq: parseInt(form.moq),
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
    } catch (e) {
      setSaveError('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  async function handleDelete(postId) {
    if (!confirm('Delete this post?')) return
    setDeleting(postId)
    try {
      await deleteDoc(doc(db, 'posts', postId))
      setPosts(p => p.filter(x => x.id !== postId))
    } catch (e) { alert('Delete failed: ' + e.message) }
    setDeleting(null)
  }

  function startEdit(post) {
    setForm({ ...EMPTY_POST, ...post, price: String(post.price), moq: String(post.moq) })
    setEditingPost(post)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelForm() {
    setShowForm(false); setEditingPost(null); setForm(EMPTY_POST); setSaveError('')
  }

  // Not a supplier yet
  if (!isSupplier && !supplierSetup) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-12">
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🏭</div>
            <h1 className="font-display text-3xl font-black text-gray-900 uppercase mb-2">Become a Supplier</h1>
            <p className="text-gray-400 text-sm mb-6 font-body">Set up your supplier profile to start listing products and receiving orders.</p>
            <div className="text-left space-y-4">
              <div>
                <label className="label">Company / Brand Name *</label>
                <input className="input" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Your factory or brand name" />
              </div>
              <div>
                <label className="label">Location (City, Bangladesh)</label>
                <input className="input" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Dhaka, Chittagong" />
              </div>
              <button onClick={setupSupplier} disabled={settingUp || !companyName.trim()} className="btn-primary w-full justify-center py-3">
                {settingUp ? 'Setting up...' : 'Start Selling →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
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

        {/* Form */}
        {showForm && (
          <div className="card p-6 mb-6 border-2 border-brand-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl font-black text-gray-900 uppercase">
                {editingPost ? 'Edit Post' : 'New Sale Post'}
              </h2>
              <button onClick={cancelForm} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-body">
                <AlertCircle size={15} /> {saveError}
              </div>
            )}

            {/* Image tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex gap-2">
              <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 font-body">
                <strong>Free image hosting:</strong> Upload at <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="underline">imgur.com/upload</a> → right-click image → "Open in new tab" → copy that URL.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Post Title *</label>
                <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Premium Cotton T-Shirts – Bulk Export" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Product Image URL</label>
                <input className="input" value={form.imageUrl} onChange={e => setForm({...form, imageUrl: e.target.value})} placeholder="https://i.imgur.com/yourimage.jpg" />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="preview" className="mt-2 h-28 rounded-xl object-cover border border-gray-200" onError={e => e.target.style.display='none'} />
                )}
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Price per unit *</label>
                <div className="flex gap-2">
                  <select className="input w-24" value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}>
                    <option>USD</option><option>EUR</option><option>GBP</option><option>BDT</option>
                  </select>
                  <input className="input flex-1" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} placeholder="e.g. 2.50" />
                </div>
              </div>
              <div>
                <label className="label">Min. Order Qty (pcs) *</label>
                <input className="input" type="number" min="1" value={form.moq} onChange={e => setForm({...form, moq: e.target.value})} placeholder="e.g. 500" />
              </div>
              <div>
                <label className="label">Tags (comma separated)</label>
                <input className="input" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} placeholder="cotton, export, custom label" />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input resize-none" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Fabric composition, sizes available, customization options, lead time..." />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
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
            <p className="text-gray-400 text-sm mb-6 font-body">Create your first sale post to start receiving orders</p>
            <button onClick={() => setShowForm(true)} className="btn-primary">
              <Plus size={15} /> Create First Post
            </button>
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
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {post.category && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-body">{post.category}</span>}
                    <span className="text-xs text-brand-600 font-bold font-body flex items-center gap-1">
                      <DollarSign size={11} />{post.currency} {parseFloat(post.price).toFixed(2)}/pc
                    </span>
                    <span className="text-xs text-gray-400 font-body flex items-center gap-1">
                      <Package size={11} /> MOQ {post.moq} pcs
                    </span>
                  </div>
                  <div className="text-xs text-gray-300 font-body mt-0.5">
                    {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(post)} className="btn-ghost p-2 text-gray-400 hover:text-brand-600">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => handleDelete(post.id)} disabled={deleting === post.id} className="btn-ghost p-2 text-gray-400 hover:text-red-500">
                    <Trash2 size={15} />
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
