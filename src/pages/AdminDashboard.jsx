import { useState, useEffect } from 'react'
import { collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { Check, X, Users, Building, ShieldCheck, AlertCircle, RefreshCw, Trash2, FileText, Edit2, Save, Plus, Search } from 'lucide-react'

const CATEGORIES = ['T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories','Socks','Underwear','Swimwear','Uniforms','Other']
const COMMON_SIZES = ['XS','S','M','L','XL','XXL','XXXL','Free Size','Custom']

// Inline item editor for admin
function AdminItemEditor({ items, onChange }) {
  const [editIdx, setEditIdx] = useState(null)
  const [itemForm, setItemForm] = useState({})

  function startEdit(idx) { setItemForm({...items[idx]}); setEditIdx(idx) }
  function startNew() { setItemForm({ id: Date.now().toString(), name:'', imageUrl:'', price:'', description:'' }); setEditIdx('new') }
  function save() {
    if (!itemForm.name||!itemForm.price) return
    const updated = editIdx==='new' ? [...items,itemForm] : items.map((x,i)=>i===editIdx?itemForm:x)
    onChange(updated); setEditIdx(null)
  }
  function del(idx) { onChange(items.filter((_,i)=>i!==idx)) }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-gray-400 uppercase">Items ({items.length})</span>
        <button type="button" onClick={startNew} className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"><Plus size={11}/> Add</button>
      </div>
      <div className="space-y-1.5 mb-2">
        {items.map((item,idx)=>(
          <div key={item.id||idx} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            {item.imageUrl && <img src={item.imageUrl} className="w-8 h-8 rounded object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-gray-800 truncate">{item.name}</div>
              <div className="text-xs text-brand-600 font-body">৳{parseFloat(item.price||0).toLocaleString()}</div>
            </div>
            <button type="button" onClick={()=>startEdit(idx)} className="text-gray-400 hover:text-brand-600 p-0.5"><Edit2 size={12}/></button>
            <button type="button" onClick={()=>del(idx)} className="text-gray-400 hover:text-red-500 p-0.5"><Trash2 size={12}/></button>
          </div>
        ))}
      </div>
      {editIdx!==null && (
        <div className="bg-white border border-brand-200 rounded-xl p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2"><label className="label text-xs">Name *</label><input className="input text-sm" value={itemForm.name||''} onChange={e=>setItemForm({...itemForm,name:e.target.value})} placeholder="Item name"/></div>
            <div><label className="label text-xs">Image URL</label><input className="input text-xs" value={itemForm.imageUrl||''} onChange={e=>setItemForm({...itemForm,imageUrl:e.target.value})} placeholder="https://i.imgur.com/..."/></div>
            <div><label className="label text-xs">Price (৳ BDT) *</label><input className="input text-sm" type="number" value={itemForm.price||''} onChange={e=>setItemForm({...itemForm,price:e.target.value})} placeholder="250"/></div>
            <div className="col-span-2"><label className="label text-xs">Description</label><input className="input text-sm" value={itemForm.description||''} onChange={e=>setItemForm({...itemForm,description:e.target.value})} placeholder="Brief description"/></div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={()=>setEditIdx(null)} className="text-xs btn-secondary flex-1 justify-center py-1.5">Cancel</button>
            <button type="button" onClick={save} disabled={!itemForm.name||!itemForm.price} className="text-xs btn-primary flex-1 justify-center py-1.5 disabled:opacity-40"><Save size={11}/> Save</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const [suppliers, setSuppliers] = useState([])
  const [requests, setRequests] = useState([])
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [postSearch, setPostSearch] = useState('')
  const [tab, setTab] = useState('requests')
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)
  const [editingPostId, setEditingPostId] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadData() {
    setLoading(true); setActionError('')
    try {
      const [supSnap, reqSnap, postsSnap] = await Promise.all([
        getDocs(collection(db,'suppliers')),
        getDocs(collection(db,'badgeRequests')),
        getDocs(collection(db,'posts')),
      ])
      setSuppliers(supSnap.docs.map(d=>({id:d.id,...d.data()})))
      setRequests(reqSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>{
        if(a.status==='pending'&&b.status!=='pending')return -1
        if(b.status==='pending'&&a.status!=='pending')return 1
        return new Date(b.requestedAt)-new Date(a.requestedAt)
      }))
      const allPosts = postsSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0))
      setPosts(allPosts); setFilteredPosts(allPosts)
    } catch(e) { setActionError('Failed: '+e.message) }
    setLoading(false)
  }

  useEffect(()=>{ loadData() },[])

  useEffect(()=>{
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
      ...post,
      moq: String(post.moq||''),
      availableColors: Array.isArray(post.availableColors) ? post.availableColors.join(', ') : (post.availableColors||''),
      availableSizes: post.availableSizes||[],
      sizesEnabled: post.sizesEnabled||false,
      items: post.items||[],
      bannerUrl: post.bannerUrl||post.imageUrl||'',
      bannerUrl2: post.bannerUrl2||'',
      bannerUrl3: post.bannerUrl3||'',
    })
    setEditingPostId(post.id)
  }

  async function savePost() {
    setSaving(true)
    try {
      const data = {
        ...editForm,
        moq: parseInt(editForm.moq)||0,
        availableColors: editForm.availableColors ? editForm.availableColors.split(',').map(s=>s.trim()).filter(Boolean) : [],
        imageUrl: editForm.bannerUrl, // legacy compat
        updatedAt: new Date().toISOString(),
      }
      await updateDoc(doc(db,'posts',editingPostId), data)
      setPosts(p=>p.map(x=>x.id===editingPostId?{...x,...data}:x))
      setEditingPostId(null); setEditForm(null)
    } catch(e) { setActionError('Save failed: '+e.message) }
    setSaving(false)
  }

  async function approveBadge(req) {
    setActionLoading(req.id); setActionError('')
    try {
      await setDoc(doc(db,'badgeRequests',req.id),{status:'approved',reviewedAt:new Date().toISOString()},{merge:true})
      if(req.tier==='verified_seller') {
        await setDoc(doc(db,'suppliers',req.uid),{isVerifiedSeller:true,verifiedBadgePending:false,verifiedAt:new Date().toISOString()},{merge:true})
        await setDoc(doc(db,'users',req.uid),{isVerifiedSeller:true},{merge:true})
      } else {
        await setDoc(doc(db,'suppliers',req.uid),{badgeTier:req.tier,badgePending:false,badgeApprovedAt:new Date().toISOString()},{merge:true})
      }
      setRequests(r=>r.map(x=>x.id===req.id?{...x,status:'approved'}:x))
    } catch(e) { setActionError('Approve failed: '+e.message) }
    setActionLoading(null)
  }

  async function rejectBadge(req) {
    setActionLoading(req.id); setActionError('')
    try {
      await setDoc(doc(db,'badgeRequests',req.id),{status:'rejected',reviewedAt:new Date().toISOString()},{merge:true})
      await setDoc(doc(db,'suppliers',req.uid),{badgePending:false,verifiedBadgePending:false},{merge:true})
      setRequests(r=>r.map(x=>x.id===req.id?{...x,status:'rejected'}:x))
    } catch(e) { setActionError('Reject failed: '+e.message) }
    setActionLoading(null)
  }

  async function deletePost(postId) {
    if(!confirm('Delete this post permanently?')) return
    setActionLoading(postId); setActionError('')
    try { await deleteDoc(doc(db,'posts',postId)); setPosts(p=>p.filter(x=>x.id!==postId)) }
    catch(e) { setActionError('Delete failed: '+e.message) }
    setActionLoading(null)
  }

  const pending = requests.filter(r=>r.status==='pending')

  function toggleSize(s) {
    setEditForm(f=>({...f, availableSizes: f.availableSizes.includes(s) ? f.availableSizes.filter(x=>x!==s) : [...f.availableSizes,s]}))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar/>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1 font-body">Full control over posts, suppliers, and badge requests</p>
          </div>
          <button onClick={loadData} className="btn-secondary gap-2"><RefreshCw size={14}/> Refresh</button>
        </div>

        {actionError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-2 text-sm font-body">
            <AlertCircle size={16} className="shrink-0 mt-0.5"/> {actionError}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {label:'Suppliers',value:suppliers.length,icon:<Building size={18}/>},
            {label:'Verified',value:suppliers.filter(s=>s.isVerifiedSeller).length,icon:<ShieldCheck size={18} className="text-emerald-600"/>},
            {label:'Total Posts',value:posts.length,icon:<FileText size={18}/>},
            {label:'Pending',value:pending.length,icon:<Users size={18} className="text-brand-600"/>},
          ].map(stat=>(
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
            {key:'requests',label:pending.length>0?`Badge Requests (${pending.length})`:'Badge Requests'},
            {key:'posts',label:`All Posts (${posts.length})`},
            {key:'suppliers',label:`Suppliers (${suppliers.length})`},
          ].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all font-body ${tab===t.key?'bg-brand-600 text-white':'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="text-center py-20 text-gray-400 font-body">Loading...</div>
        : tab==='requests' ? (
          <div className="space-y-3">
            {requests.length===0 && <div className="text-center py-16 text-gray-400 font-body">No badge requests yet.</div>}
            {requests.map(req=>(
              <div key={req.id} className={`card p-5 ${req.status==='pending'?'border-l-4 border-l-yellow-400':''}`}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-black text-gray-900 text-lg uppercase">{req.companyName||'(no name)'}</span>
                      {req.tier==='verified_seller' && <span className="badge-verified text-xs"><ShieldCheck size={9}/>Verified Seller</span>}
                    </div>
                    <div className="text-sm text-gray-400 font-body">{req.email}</div>
                    <div className="text-xs text-gray-300 font-body">{req.requestedAt?new Date(req.requestedAt).toLocaleString():''}</div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-body">bKash TxID:</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded-lg text-gray-800 font-bold">{req.transactionId}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-body">Amount: ৳{req.tier==='verified_seller'?'4,999':req.tier==='golden'?'30,000':req.tier==='verified'?'2,500':'500'}/month</div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-body ${req.status==='pending'?'bg-yellow-100 text-yellow-700 border border-yellow-200':req.status==='approved'?'bg-green-100 text-green-700 border border-green-200':'bg-red-100 text-red-700 border border-red-200'}`}>{req.status}</span>
                    {req.status==='pending' && (
                      <>
                        <button onClick={()=>approveBadge(req)} disabled={actionLoading===req.id} className="flex items-center gap-1 text-xs px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 font-bold disabled:opacity-50 transition-colors">{actionLoading===req.id?'...': <><Check size={12}/> Approve</>}</button>
                        <button onClick={()=>rejectBadge(req)} disabled={actionLoading===req.id} className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 font-bold disabled:opacity-50 transition-colors">{actionLoading===req.id?'...':<><X size={12}/> Reject</>}</button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : tab==='posts' ? (
          <div>
            {/* Search */}
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input className="input pl-9" placeholder="Search posts by title, supplier name, category..."
                value={postSearch} onChange={e=>setPostSearch(e.target.value)}/>
            </div>

            {editingPostId && editForm ? (
              /* Full post editor */
              <div className="card p-6 border-2 border-brand-200 mb-4">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-xl font-black text-gray-900 uppercase">Editing Post</h2>
                  <button onClick={()=>{setEditingPostId(null);setEditForm(null)}} className="text-gray-400 hover:text-gray-700"><X size={20}/></button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-xs text-blue-700 font-body">
                  ℹ️ You are editing this post as admin. Changes will be immediately visible to all users.
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2"><label className="label">Title</label><input className="input" value={editForm.title||''} onChange={e=>setEditForm({...editForm,title:e.target.value})}/></div>
                    <div><label className="label">Category</label>
                      <select className="input" value={editForm.category||''} onChange={e=>setEditForm({...editForm,category:e.target.value})}>
                        <option value="">Select</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div><label className="label">MOQ (pcs)</label><input className="input" type="number" value={editForm.moq||''} onChange={e=>setEditForm({...editForm,moq:e.target.value})}/></div>
                    <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input resize-none" rows={2} value={editForm.description||''} onChange={e=>setEditForm({...editForm,description:e.target.value})}/></div>
                    <div><label className="label">Material</label><input className="input" value={editForm.material||''} onChange={e=>setEditForm({...editForm,material:e.target.value})} placeholder="e.g. 100% Cotton"/></div>
                    <div><label className="label">Production Time</label><input className="input" value={editForm.productionTime||''} onChange={e=>setEditForm({...editForm,productionTime:e.target.value})} placeholder="e.g. 7-15 days"/></div>
                    <div><label className="label">Available Colors (comma sep)</label><input className="input" value={editForm.availableColors||''} onChange={e=>setEditForm({...editForm,availableColors:e.target.value})}/></div>
                    <div><label className="label">Tags</label><input className="input" value={editForm.tags||''} onChange={e=>setEditForm({...editForm,tags:e.target.value})}/></div>
                  </div>

                  {/* Banner images */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Banner Images</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[{key:'bannerUrl',label:'Banner 1 (Main)'},{key:'bannerUrl2',label:'Banner 2'},{key:'bannerUrl3',label:'Banner 3'}].map(f=>(
                        <div key={f.key}><label className="label text-xs">{f.label}</label>
                          <input className="input text-xs" value={editForm[f.key]||''} onChange={e=>setEditForm({...editForm,[f.key]:e.target.value})} placeholder="https://i.imgur.com/..."/>
                          {editForm[f.key] && <img src={editForm[f.key]} className="mt-1.5 h-20 w-full rounded-lg object-cover border border-gray-200" alt="" onError={e=>e.target.style.display='none'}/>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Sizes */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer mb-3">
                      <input type="checkbox" checked={editForm.sizesEnabled||false} onChange={e=>setEditForm({...editForm,sizesEnabled:e.target.checked})} className="w-4 h-4 accent-brand-600 rounded"/>
                      <span className="text-sm font-semibold text-gray-700 font-body">Enable size selection</span>
                    </label>
                    {editForm.sizesEnabled && (
                      <div className="flex flex-wrap gap-2">
                        {COMMON_SIZES.map(s=>(
                          <button key={s} type="button" onClick={()=>toggleSize(s)}
                            className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${(editForm.availableSizes||[]).includes(s)?'bg-brand-600 border-brand-600 text-white':'bg-white border-gray-200 text-gray-600'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Items editor */}
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Individual Items</h3>
                    <p className="text-xs text-gray-400 font-body mb-3">Add/edit individual products. You can upload images via imgur.com for the supplier.</p>
                    <AdminItemEditor items={editForm.items||[]} onChange={items=>setEditForm(f=>({...f,items}))}/>
                  </div>
                </div>

                <div className="flex gap-3 mt-5">
                  <button onClick={()=>{setEditingPostId(null);setEditForm(null)}} className="btn-secondary flex-1 justify-center" disabled={saving}>Cancel</button>
                  <button onClick={savePost} disabled={saving} className="btn-primary flex-1 justify-center"><Save size={15}/> {saving?'Saving...':'Save Changes'}</button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2">
              {filteredPosts.length===0 && <div className="text-center py-12 text-gray-400 font-body">No posts found.</div>}
              {filteredPosts.map(post=>(
                <div key={post.id} className="card p-4 flex gap-4 items-center">
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
                      <span>{post.createdAt?new Date(post.createdAt).toLocaleDateString():''}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={()=>startEditPost(post)} className="btn-ghost p-2 text-gray-400 hover:text-brand-600" title="Edit post"><Edit2 size={15}/></button>
                    <button onClick={()=>deletePost(post.id)} disabled={actionLoading===post.id} className="btn-ghost p-2 text-gray-400 hover:text-red-500 disabled:opacity-50"><Trash2 size={15}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm font-body">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>{['Company','Location','Verified Seller','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {suppliers.map(s=>(
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{s.companyName||'—'}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{s.location||'—'}</td>
                      <td className="px-4 py-3">{s.isVerifiedSeller?<span className="badge-verified"><ShieldCheck size={9}/>Yes</span>:<span className="text-gray-300 text-xs">No</span>}</td>
                      <td className="px-4 py-3">
                        {s.isVerifiedSeller && (
                          <button onClick={async()=>{
                            await setDoc(doc(db,'suppliers',s.id),{isVerifiedSeller:false},{merge:true})
                            setSuppliers(x=>x.map(v=>v.id===s.id?{...v,isVerifiedSeller:false}:v))
                          }} className="text-xs px-3 py-1.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors">Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {suppliers.length===0 && <div className="text-center py-12 text-gray-400 font-body">No suppliers yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}