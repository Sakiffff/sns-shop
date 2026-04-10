import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, doc, deleteDoc, query, where, setDoc, getDoc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Plus, Edit2, Trash2, Save, X, Info, Package, AlertCircle, Eye, Star, ShieldCheck, ChevronDown, ChevronUp, Bell, Clock, CheckCircle, Truck, MapPin, Phone, User } from 'lucide-react'

const CATEGORIES = ['T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories','Socks','Underwear','Swimwear','Uniforms','Other']
const COMMON_SIZES = ['XS','S','M','L','XL','XXL','XXXL','Free Size','Custom']
const EMPTY_POST = {
  title:'',description:'',category:'',moq:'',material:'',
  bannerUrl:'',bannerUrl2:'',bannerUrl3:'',
  tags:'',sampleAvailable:false,samplePrice:'',productionTime:'',availableColors:'',
  sizesEnabled:false,availableSizes:[],items:[],
}
const EMPTY_ITEM = {id:'',name:'',imageUrl:'',price:'',description:''}

function ItemEditor({ items, onChange }) {
  const [editingIdx, setEditingIdx] = useState(null)
  const [itemForm, setItemForm] = useState(EMPTY_ITEM)
  function startNew() { setItemForm({...EMPTY_ITEM,id:Date.now().toString()}); setEditingIdx('new') }
  function startEdit(idx) { setItemForm({...items[idx]}); setEditingIdx(idx) }
  function saveItem() {
    if (!itemForm.name.trim()||!itemForm.price) return
    const updated = editingIdx==='new' ? [...items,{...itemForm,id:itemForm.id||Date.now().toString()}] : items.map((x,i)=>i===editingIdx?itemForm:x)
    onChange(updated); setEditingIdx(null); setItemForm(EMPTY_ITEM)
  }
  function deleteItem(idx) { onChange(items.filter((_,i)=>i!==idx)) }
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Items ({items.length})</h3>
        <button type="button" onClick={startNew} className="flex items-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors">
          <Plus size={13}/> Add Item
        </button>
      </div>
      {items.length===0 && editingIdx===null && (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-5 text-center text-gray-400">
          <Package size={24} className="mx-auto mb-2 text-gray-300"/>
          <p className="text-sm font-body">No items yet. Add individual products buyers can select.</p>
        </div>
      )}
      <div className="space-y-2">
        {items.map((item,idx) => (
          <div key={item.id||idx} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
            {item.imageUrl && <img src={item.imageUrl} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>}
            <div className="flex-1 min-w-0">
              <div className="font-display font-black text-gray-900 uppercase text-sm truncate">{item.name}</div>
              <div className="text-xs text-brand-600 font-bold font-body">৳{parseFloat(item.price||0).toLocaleString()}/pc</div>
            </div>
            <button type="button" onClick={()=>startEdit(idx)} className="p-1.5 text-gray-400 hover:text-brand-600"><Edit2 size={13}/></button>
            <button type="button" onClick={()=>deleteItem(idx)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={13}/></button>
          </div>
        ))}
      </div>
      {editingIdx!==null && (
        <div className="mt-3 bg-white border-2 border-brand-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display font-black text-gray-900 uppercase text-sm">{editingIdx==='new'?'New Item':'Edit Item'}</span>
            <button type="button" onClick={()=>{setEditingIdx(null);setItemForm(EMPTY_ITEM)}}><X size={16} className="text-gray-400 hover:text-gray-600"/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2"><label className="label text-xs">Item Name *</label><input className="input" value={itemForm.name} onChange={e=>setItemForm({...itemForm,name:e.target.value})} placeholder="e.g. White Cotton T-Shirt"/></div>
            <div>
              <label className="label text-xs">Image URL</label>
              <input className="input text-xs" value={itemForm.imageUrl} onChange={e=>setItemForm({...itemForm,imageUrl:e.target.value})} placeholder="https://i.imgur.com/..."/>
              {itemForm.imageUrl && <img src={itemForm.imageUrl} className="mt-1.5 h-16 rounded-lg object-cover border border-gray-200 w-full" alt="" onError={e=>e.target.style.display='none'}/>}
            </div>
            <div>
              <label className="label text-xs">Price (৳ BDT) *</label>
              <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                <input className="input pl-7" type="number" value={itemForm.price} onChange={e=>setItemForm({...itemForm,price:e.target.value})} placeholder="250"/>
              </div>
            </div>
            <div className="sm:col-span-2"><label className="label text-xs">Description</label><input className="input" value={itemForm.description||''} onChange={e=>setItemForm({...itemForm,description:e.target.value})} placeholder="Brief description"/></div>
          </div>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={()=>{setEditingIdx(null);setItemForm(EMPTY_ITEM)}} className="btn-secondary flex-1 justify-center py-2 text-sm">Cancel</button>
            <button type="button" onClick={saveItem} disabled={!itemForm.name.trim()||!itemForm.price} className="btn-primary flex-1 justify-center py-2 text-sm disabled:opacity-40"><Save size={13}/> Save</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyPosts() {
  const { user, userProfile, isSupplier, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('posts')
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
  const [pendingBadge, setPendingBadge] = useState(false)
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [transactionId, setTransactionId] = useState('')
  const [badgeSubmitted, setBadgeSubmitted] = useState(false)
  const [submittingBadge, setSubmittingBadge] = useState(false)
  const [badgeError, setBadgeError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [supplierOrders, setSupplierOrders] = useState([])
  const [markingReady, setMarkingReady] = useState(null)
  const [pickupInfo, setPickupInfo] = useState({name:'',address:'',phone:'',city:'',notes:''})
  const [pickupSaving, setPickupSaving] = useState(false)
  const [pickupSaved, setPickupSaved] = useState(false)

  useEffect(() => { if (user) loadAll() }, [user])

  async function loadAll() {
    setLoading(true)
    try {
      const q = query(collection(db,'posts'), where('supplierId','==',user.uid))
      const snap = await getDocs(q)
      setPosts(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0)))
      const supSnap = await getDoc(doc(db,'suppliers',user.uid))
      if (supSnap.exists()) { const sd=supSnap.data(); setIsVerifiedSeller(sd.isVerifiedSeller||false); setPendingBadge(sd.verifiedBadgePending||false) }
      const viewsQ = await getDocs(query(collection(db,'postViews'), where('supplierId','==',user.uid)))
      const vm={}; viewsQ.docs.forEach(d=>{const {postId}=d.data(); vm[postId]=(vm[postId]||0)+1}); setPostViews(vm)
      const pickupSnap = await getDoc(doc(db,'supplierPickup',user.uid))
      if (pickupSnap.exists()) setPickupInfo(p=>({...p,...pickupSnap.data()}))
    } catch(e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    if (!user||!isSupplier) return
    const unsub = onSnapshot(collection(db,'orders'), snap => {
      const mine = snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(o=>(o.suppliers||[]).some(s=>s.id===user.uid))
        .sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0))
      setSupplierOrders(mine)
    })
    return unsub
  }, [user, isSupplier])

  async function savePickupInfo() {
    setPickupSaving(true)
    try {
      await setDoc(doc(db,'supplierPickup',user.uid), {...pickupInfo, supplierId:user.uid, supplierName:userProfile?.displayName||'', updatedAt:new Date().toISOString()}, {merge:true})
      setPickupSaved(true); setTimeout(()=>setPickupSaved(false),3000)
    } catch(e) { alert('Save failed: '+e.message) }
    setPickupSaving(false)
  }

  async function markOrderReady(orderId) {
    setMarkingReady(orderId)
    try {
      await setDoc(doc(db,'orders',orderId), {status:'ready_for_pickup', statusLabel:'Ready for Pickup', supplierReadyAt:new Date().toISOString(), updatedAt:new Date().toISOString()}, {merge:true})
    } catch(e) { alert('Failed: '+e.message) }
    setMarkingReady(null)
  }

  async function setupSupplier() {
    if (!companyName.trim()) return
    setSettingUp(true)
    try {
      await setDoc(doc(db,'suppliers',user.uid), {uid:user.uid, companyName:companyName.trim(), location:location.trim(), displayName:userProfile?.displayName||'', categories:[], updatedAt:new Date().toISOString()}, {merge:true})
      await setDoc(doc(db,'users',user.uid), {isSupplier:true}, {merge:true})
      await refreshProfile()
    } catch(e) { console.error(e) }
    setSettingUp(false)
  }

  async function handleSave() {
    if (!form.title.trim()||!form.moq) { setSaveError('Title and MOQ are required'); return }
    setSaving(true); setSaveError('')
    try {
      const postData = {
        title:form.title.trim(), description:form.description.trim(), category:form.category,
        moq:parseInt(form.moq)||0, material:form.material.trim(),
        bannerUrl:form.bannerUrl.trim(), bannerUrl2:form.bannerUrl2.trim(), bannerUrl3:form.bannerUrl3.trim(),
        imageUrl:form.bannerUrl.trim(), tags:form.tags.trim(),
        sampleAvailable:form.sampleAvailable, samplePrice:form.samplePrice?parseFloat(form.samplePrice):null,
        productionTime:form.productionTime.trim(), sizesEnabled:form.sizesEnabled,
        availableSizes:form.availableSizes||[],
        availableColors:form.availableColors?form.availableColors.split(',').map(s=>s.trim()).filter(Boolean):[],
        items:form.items||[], currency:'BDT',
        supplierId:user.uid, supplierName:userProfile?.displayName||'',
        updatedAt:new Date().toISOString(),
      }
      if (editingPost) {
        await setDoc(doc(db,'posts',editingPost.id), postData, {merge:true})
        setPosts(p=>p.map(x=>x.id===editingPost.id?{...x,...postData}:x))
      } else {
        postData.createdAt=new Date().toISOString()
        const ref=await addDoc(collection(db,'posts'),postData)
        setPosts(p=>[{id:ref.id,...postData},...p])
      }
      setShowForm(false); setEditingPost(null); setForm(EMPTY_POST)
    } catch(e) { setSaveError('Save failed: '+e.message) }
    setSaving(false)
  }

  async function handleDelete(postId) {
    if (!confirm('Delete this post?')) return
    setDeleting(postId)
    try { await deleteDoc(doc(db,'posts',postId)); setPosts(p=>p.filter(x=>x.id!==postId)) } catch(e) { alert('Delete failed') }
    setDeleting(null)
  }

  async function submitBadgeRequest() {
    if (!transactionId.trim()) return
    setSubmittingBadge(true); setBadgeError('')
    try {
      await addDoc(collection(db,'badgeRequests'), {uid:user.uid, companyName:userProfile?.displayName||'', email:user.email, tier:'verified_seller', transactionId:transactionId.trim(), requestedAt:new Date().toISOString(), status:'pending'})
      await setDoc(doc(db,'suppliers',user.uid), {verifiedBadgePending:true},{merge:true})
      setPendingBadge(true); setBadgeSubmitted(true)
    } catch(e) { setBadgeError('Submission failed: '+e.message) }
    setSubmittingBadge(false)
  }

  function startEdit(post) {
    setForm({...EMPTY_POST,...post, moq:String(post.moq||''), samplePrice:String(post.samplePrice||''),
      sampleAvailable:post.sampleAvailable||false,
      availableColors:Array.isArray(post.availableColors)?post.availableColors.join(', '):(post.availableColors||''),
      availableSizes:post.availableSizes||[], sizesEnabled:post.sizesEnabled||false, items:post.items||[],
      bannerUrl:post.bannerUrl||post.imageUrl||'', bannerUrl2:post.bannerUrl2||'', bannerUrl3:post.bannerUrl3||'',
    })
    setEditingPost(post); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'})
  }

  function toggleSize(size) {
    setForm(f=>({...f, availableSizes:f.availableSizes.includes(size)?f.availableSizes.filter(s=>s!==size):[...f.availableSizes,size]}))
  }

  const totalViews = Object.values(postViews).reduce((s,v)=>s+v,0)
  const pendingOrderCount = supplierOrders.filter(o=>['pending_payment','payment_confirmed'].includes(o.status)).length
  const confirmedOrderCount = supplierOrders.filter(o=>o.status==='payment_confirmed').length

  if (!isSupplier) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="card p-8 text-center">
          <div className="text-5xl mb-4">🏭</div>
          <h1 className="font-display text-3xl font-black text-gray-900 uppercase mb-2">Become a Supplier</h1>
          <p className="text-gray-400 text-sm mb-6 font-body">Set up your profile to list products and receive orders.</p>
          <div className="text-left space-y-4">
            <div><label className="label">Company / Brand Name *</label><input className="input" value={companyName} onChange={e=>setCompanyName(e.target.value)} placeholder="Your factory or brand name"/></div>
            <div><label className="label">Location</label><input className="input" value={location} onChange={e=>setLocation(e.target.value)} placeholder="e.g. Dhaka"/></div>
            <button onClick={setupSupplier} disabled={settingUp||!companyName.trim()} className="btn-primary w-full justify-center py-3">{settingUp?'Setting up...':'Start Selling →'}</button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight">My Shop</h1>
            <p className="text-gray-400 text-sm mt-1 font-body">{posts.length} posts · {totalViews} views</p>
          </div>
          {activeTab==='posts' && !showForm && (
            <button onClick={()=>{setShowForm(true);setEditingPost(null);setForm(EMPTY_POST)}} className="btn-primary"><Plus size={16}/> New Post</button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mb-6 border-b border-gray-200">
          {[
            {key:'posts', label:'My Posts', icon:<Package size={14}/>},
            {key:'orders', label:pendingOrderCount>0?`Orders (${pendingOrderCount})`:'Orders', icon:<Bell size={14}/>, badge:confirmedOrderCount>0},
            {key:'pickup', label:'Pickup Info', icon:<MapPin size={14}/>},
          ].map(tab => (
            <button key={tab.key} onClick={()=>setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold font-body border-b-2 transition-all -mb-px ${activeTab===tab.key?'border-brand-600 text-brand-600':'border-transparent text-gray-400 hover:text-gray-700'}`}>
              {tab.icon} {tab.label}
              {tab.badge && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0"/>}
            </button>
          ))}
        </div>

        {/* ORDERS TAB */}
        {activeTab==='orders' && (
          <div>
            {supplierOrders.length===0 ? (
              <div className="text-center py-16 card p-8">
                <Bell size={40} className="text-gray-200 mx-auto mb-3"/>
                <p className="font-display text-xl font-black text-gray-600 uppercase mb-1">No Orders Yet</p>
                <p className="text-gray-400 text-sm font-body">When buyers order your products, they'll appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {supplierOrders.map(order => {
                  const myItems = (order.items||[]).filter(i=>i.supplierId===user.uid)
                  const sc = {
                    pending_payment: {label:'Payment Verification Pending', color:'bg-yellow-50 border-yellow-200 text-yellow-700', icon:<Clock size={14} className="text-yellow-500"/>},
                    payment_confirmed: {label:'Payment Confirmed — Prepare Your Order', color:'bg-green-50 border-green-300 text-green-700', icon:<CheckCircle size={14} className="text-green-500"/>},
                    ready_for_pickup: {label:'Ready for Pickup — Awaiting Collection', color:'bg-blue-50 border-blue-200 text-blue-700', icon:<Truck size={14} className="text-blue-500"/>},
                    in_delivery: {label:'In Delivery', color:'bg-purple-50 border-purple-200 text-purple-700', icon:<Truck size={14} className="text-purple-500"/>},
                    shipped: {label:'Shipped', color:'bg-emerald-50 border-emerald-200 text-emerald-700', icon:<CheckCircle size={14} className="text-emerald-500"/>},
                    delivered: {label:'Delivered', color:'bg-gray-50 border-gray-200 text-gray-500', icon:<CheckCircle size={14} className="text-gray-400"/>},
                  }[order.status] || {label:order.status, color:'bg-gray-50 border-gray-200 text-gray-500', icon:null}
                  return (
                    <div key={order.id} className={`card p-5 border-l-4 ${order.status==='payment_confirmed'?'border-l-green-400':order.status==='pending_payment'?'border-l-yellow-400':'border-l-gray-200'}`}>
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-body mb-3 ${sc.color}`}>
                        {sc.icon} {sc.label}
                      </div>
                      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                        <div>
                          <div className="font-display font-black text-gray-900 uppercase text-sm">Order #{order.id.slice(0,8).toUpperCase()}</div>
                          <div className="text-xs text-gray-400 font-body">Buyer: <strong>{order.buyerName}</strong> · {order.buyerCountry}</div>
                          <div className="text-xs text-gray-300 font-body">{order.createdAt?new Date(order.createdAt).toLocaleDateString():''}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-display font-black text-lg text-gray-900">{order.currencySymbol}{(order.totalAmount||0).toFixed(2)}</div>
                          <div className="text-xs text-gray-400 font-body">{order.currency}</div>
                        </div>
                      </div>
                      <div className="space-y-1.5 mb-3">
                        {myItems.map((item,i) => (
                          <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                            {item.itemImage && <img src={item.itemImage} className="w-8 h-8 rounded-lg object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>}
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-800 text-sm truncate">{item.itemName}</div>
                              <div className="text-xs text-gray-400 font-body">Qty {item.qty}{item.size?` · ${item.size}`:''}{item.color?` · ${item.color}`:''}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {order.status==='payment_confirmed' && (
                        <button onClick={()=>markOrderReady(order.id)} disabled={markingReady===order.id}
                          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-black py-3 rounded-xl text-sm transition-colors disabled:opacity-50">
                          {markingReady===order.id?'Marking...':<><CheckCircle size={15}/> Order Ready — Mark for Pickup</>}
                        </button>
                      )}
                      {order.status==='ready_for_pickup' && (
                        <div className="w-full flex items-center justify-center gap-2 bg-blue-50 border border-blue-200 text-blue-600 font-bold py-2.5 rounded-xl text-sm">
                          <Truck size={14}/> Waiting for pickup agent to collect
                        </div>
                      )}
                      {order.status==='pending_payment' && (
                        <div className="w-full flex items-center justify-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-600 font-bold py-2.5 rounded-xl text-xs font-body">
                          <Clock size={12}/> Waiting for S&S Shop to verify buyer's payment
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* PICKUP INFO TAB */}
        {activeTab==='pickup' && (
          <div className="card p-6">
            <h2 className="font-display text-xl font-black text-gray-900 uppercase mb-1">Pickup Information</h2>
            <p className="text-gray-400 text-sm font-body mb-5">Our delivery agency uses this to collect your orders. Keep it accurate.</p>
            <div className="space-y-4">
              <div><label className="label flex items-center gap-1.5"><User size={13}/> Contact Name *</label><input className="input" value={pickupInfo.name} onChange={e=>setPickupInfo({...pickupInfo,name:e.target.value})} placeholder="Person to contact at pickup"/></div>
              <div><label className="label flex items-center gap-1.5"><Phone size={13}/> Phone Number *</label><input className="input" value={pickupInfo.phone} onChange={e=>setPickupInfo({...pickupInfo,phone:e.target.value})} placeholder="+880 1700 000000"/></div>
              <div><label className="label flex items-center gap-1.5"><MapPin size={13}/> Full Address *</label><textarea className="input resize-none" rows={2} value={pickupInfo.address} onChange={e=>setPickupInfo({...pickupInfo,address:e.target.value})} placeholder="House/floor, road, area"/></div>
              <div><label className="label">City</label><input className="input" value={pickupInfo.city} onChange={e=>setPickupInfo({...pickupInfo,city:e.target.value})} placeholder="e.g. Dhaka, Chittagong"/></div>
              <div><label className="label">Notes for pickup agent</label><input className="input" value={pickupInfo.notes} onChange={e=>setPickupInfo({...pickupInfo,notes:e.target.value})} placeholder="e.g. 3rd floor, ring bell, available 9am-5pm"/></div>
              <button onClick={savePickupInfo} disabled={pickupSaving} className="btn-primary">
                <Save size={15}/> {pickupSaving?'Saving...':pickupSaved?'✓ Saved!':'Save Pickup Info'}
              </button>
            </div>
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab==='posts' && (
          <div>
            {!isVerifiedSeller && !pendingBadge && (
              <div className="card p-5 mb-6 border-2 border-emerald-200 bg-emerald-50">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shrink-0"><ShieldCheck size={24} className="text-white"/></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-display text-xl font-black text-gray-900 uppercase">Verified Seller Badge</h3>
                      <span className="text-xs bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">৳4,999/month</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 mb-3 text-xs text-emerald-800 font-body">
                      {['📊 Post view insights','🔝 Shown before others','✅ Verified badge','🌍 Featured to buyers','📈 Priority search','💬 Higher trust'].map(f=><div key={f}>{f}</div>)}
                    </div>
                    <button onClick={()=>{setShowBadgeModal(true);setBadgeSubmitted(false);setTransactionId('');setBadgeError('')}} className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors">Apply for Verified Badge</button>
                  </div>
                </div>
              </div>
            )}
            {pendingBadge && !isVerifiedSeller && (
              <div className="card p-4 mb-6 bg-yellow-50 border-2 border-yellow-200 text-yellow-700 font-semibold font-body">⏳ Verified Seller badge under review — we'll activate within 24 hours.</div>
            )}
            {isVerifiedSeller && (
              <div className="card p-4 mb-6 bg-emerald-50 border-2 border-emerald-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold font-body"><ShieldCheck size={16}/> Active Verified Seller Badge</div>
                <div className="flex gap-6">
                  <div className="text-center"><div className="font-display font-black text-2xl text-gray-900">{totalViews}</div><div className="text-xs text-gray-400 font-body">Total views</div></div>
                  <div className="text-center"><div className="font-display font-black text-2xl text-gray-900">{posts.length}</div><div className="text-xs text-gray-400 font-body">Posts</div></div>
                </div>
              </div>
            )}

            {showForm && (
              <div className="card p-6 mb-6 border-2 border-brand-200">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-display text-2xl font-black text-gray-900 uppercase">{editingPost?'Edit Post':'New Sale Post'}</h2>
                  <button onClick={()=>{setShowForm(false);setEditingPost(null);setForm(EMPTY_POST);setSaveError('')}} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100"><X size={20}/></button>
                </div>
                {saveError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 flex items-center gap-2 text-sm font-body"><AlertCircle size={15}/> {saveError}</div>}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex gap-2">
                  <Info size={15} className="text-blue-500 shrink-0 mt-0.5"/>
                  <p className="text-xs text-blue-700 font-body"><strong>Free images:</strong> <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="underline">imgur.com/upload</a> → right-click → "Open in new tab" → copy URL.</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Basic Info</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><label className="label">Post Title *</label><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Premium Cotton T-Shirts – Bulk Export"/></div>
                      <div><label className="label">Category</label>
                        <select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                          <option value="">Select</option>{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div><label className="label">Min. Order Qty (pcs) *</label><input className="input" type="number" min="1" value={form.moq} onChange={e=>setForm({...form,moq:e.target.value})} placeholder="e.g. 500"/></div>
                      <div className="sm:col-span-2"><label className="label">Description</label><textarea className="input resize-none" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Fabric, customization, lead time..."/></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Banner Images</h3>
                    <p className="text-xs text-gray-400 font-body mb-3">Shown on product card and top of post page</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[{key:'bannerUrl',label:'Banner 1 (Main)'},{key:'bannerUrl2',label:'Banner 2'},{key:'bannerUrl3',label:'Banner 3'}].map(f=>(
                        <div key={f.key}><label className="label text-xs">{f.label}</label>
                          <input className="input text-xs" value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})} placeholder="https://i.imgur.com/..."/>
                          {form[f.key] && <img src={form[f.key]} className="mt-1.5 h-20 w-full rounded-lg object-cover border border-gray-200" alt="" onError={e=>e.target.style.display='none'}/>}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Individual Items</h3>
                    <p className="text-xs text-gray-400 font-body mb-3">Buyers select these to add to cart with specific prices</p>
                    <ItemEditor items={form.items} onChange={items=>setForm(f=>({...f,items}))}/>
                  </div>
                  <div>
                    <button type="button" onClick={()=>setShowAdvanced(!showAdvanced)} className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-700 font-body">
                      {showAdvanced?<ChevronUp size={15}/>:<ChevronDown size={15}/>} Advanced Options
                    </button>
                    {showAdvanced && (
                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div><label className="label">Material</label><input className="input" value={form.material} onChange={e=>setForm({...form,material:e.target.value})} placeholder="e.g. 100% Cotton, 180 GSM"/></div>
                        <div><label className="label">Production Time</label><input className="input" value={form.productionTime} onChange={e=>setForm({...form,productionTime:e.target.value})} placeholder="e.g. 7–15 days"/></div>
                        <div><label className="label">Colors (comma separated)</label><input className="input" value={form.availableColors} onChange={e=>setForm({...form,availableColors:e.target.value})} placeholder="White, Black, Navy"/></div>
                        <div>
                          <label className="label">Sample?</label>
                          <div className="flex gap-3 mt-1">
                            {[{v:true,l:'Yes'},{v:false,l:'No'}].map(o=>(
                              <label key={String(o.v)} className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={form.sampleAvailable===o.v} onChange={()=>setForm({...form,sampleAvailable:o.v})} className="accent-brand-600"/>
                                <span className="text-sm font-body text-gray-700">{o.l}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                        {form.sampleAvailable && (
                          <div><label className="label">Sample Price (৳ BDT)</label>
                            <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">৳</span>
                              <input className="input pl-7" type="number" min="0" value={form.samplePrice} onChange={e=>setForm({...form,samplePrice:e.target.value})} placeholder="e.g. 1500"/>
                            </div>
                          </div>
                        )}
                        <div className="sm:col-span-2">
                          <label className="flex items-center gap-3 cursor-pointer mb-3">
                            <input type="checkbox" checked={form.sizesEnabled} onChange={e=>setForm({...form,sizesEnabled:e.target.checked})} className="w-4 h-4 accent-brand-600 rounded"/>
                            <span className="text-sm font-semibold text-gray-700 font-body">Enable size selection for buyers</span>
                          </label>
                          {form.sizesEnabled && (
                            <div className="flex flex-wrap gap-2">
                              {COMMON_SIZES.map(s=>(
                                <button key={s} type="button" onClick={()=>toggleSize(s)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${form.availableSizes.includes(s)?'bg-brand-600 border-brand-600 text-white':'bg-white border-gray-200 text-gray-600 hover:border-brand-300'}`}>
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <div><label className="label">Tags</label><input className="input" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="cotton, export, custom label"/></div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={()=>{setShowForm(false);setEditingPost(null);setForm(EMPTY_POST);setSaveError('')}} className="btn-secondary flex-1 justify-center" disabled={saving}>Cancel</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center"><Save size={15}/> {saving?'Saving...':editingPost?'Update Post':'Publish Post'}</button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-16 text-gray-400 font-body">Loading...</div>
            ) : posts.length===0 && !showForm ? (
              <div className="text-center py-20 card p-10">
                <Package size={48} className="text-gray-200 mx-auto mb-4"/>
                <p className="font-display text-2xl font-black text-gray-700 uppercase mb-2">No posts yet</p>
                <button onClick={()=>setShowForm(true)} className="btn-primary mt-2"><Plus size={15}/> Create First Post</button>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map(post => (
                  <div key={post.id} className="card p-4 flex gap-4 items-center">
                    {(post.bannerUrl||post.imageUrl)
                      ? <img src={post.bannerUrl||post.imageUrl} className="w-16 h-16 rounded-xl object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>
                      : <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">📦</div>
                    }
                    <div className="flex-1 min-w-0">
                      <div className="font-display font-black text-gray-900 uppercase text-base leading-tight truncate">{post.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap text-xs">
                        {post.category && <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-body">{post.category}</span>}
                        <span className="text-gray-400 font-body">MOQ {post.moq}</span>
                        <span className="text-blue-600 font-bold font-body">{(post.items||[]).length} items</span>
                        {post.ratingCount>0 && <span className="text-yellow-500 font-bold flex items-center gap-0.5"><Star size={10} className="fill-yellow-400"/> {post.avgRating?.toFixed(1)}</span>}
                        {isVerifiedSeller && <span className="text-emerald-600 font-bold flex items-center gap-1"><Eye size={10}/> {postViews[post.id]||0}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={()=>startEdit(post)} className="btn-ghost p-2 text-gray-400 hover:text-brand-600"><Edit2 size={15}/></button>
                      <button onClick={()=>handleDelete(post.id)} disabled={deleting===post.id} className="btn-ghost p-2 text-gray-400 hover:text-red-500"><Trash2 size={15}/></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Badge modal */}
      {showBadgeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={()=>setShowBadgeModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e=>e.stopPropagation()}>
            {badgeSubmitted ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-display text-2xl font-black text-gray-900 uppercase mb-2">Submitted!</h3>
                <p className="text-gray-400 text-sm mb-4 font-body">Your Verified Seller badge request is pending. We'll activate within 24 hours.</p>
                <button onClick={()=>setShowBadgeModal(false)} className="btn-primary w-full justify-center">Done</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center"><ShieldCheck size={20} className="text-white"/></div>
                  <div><h3 className="font-display text-xl font-black text-gray-900 uppercase">Verified Seller</h3><p className="text-sm text-gray-400 font-body">৳4,999 / month</p></div>
                </div>
                {badgeError && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-body">{badgeError}</div>}
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-4">
                  <p className="text-sm font-bold text-gray-700 mb-2 font-body">Send ৳4,999 via bKash (Send Money):</p>
                  <div className="bg-white border-2 border-emerald-200 rounded-xl py-3 font-mono text-2xl font-black text-emerald-600 text-center tracking-widest">01819103212</div>
                </div>
                <div className="mb-4"><label className="label">bKash Transaction ID *</label><input className="input" value={transactionId} onChange={e=>setTransactionId(e.target.value)} placeholder="e.g. 8G5K3J2L9M" disabled={submittingBadge}/></div>
                <div className="flex gap-3">
                  <button onClick={()=>setShowBadgeModal(false)} className="btn-secondary flex-1 justify-center" disabled={submittingBadge}>Cancel</button>
                  <button onClick={submitBadgeRequest} disabled={!transactionId.trim()||submittingBadge} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-5 py-2.5 rounded-xl flex-1 justify-center flex items-center gap-2 transition-colors disabled:opacity-50">{submittingBadge?'Submitting...':'Submit'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}