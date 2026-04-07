import { useState, useEffect } from 'react'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Save, Store, ArrowRight, Globe, Truck, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

const BUSINESS_TYPES = ['Manufacturer','Trading Company','Both (Manufacturer + Trading)']

export default function ProfilePage() {
  const { user, userProfile, refreshProfile, isSupplier } = useAuth()
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '')
  const [nameSaving, setNameSaving] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)
  const [nameError, setNameError] = useState('')
  const [sup, setSup] = useState(null)
  const [supLoading, setSupLoading] = useState(true)
  const [supSaving, setSupSaving] = useState(false)
  const [supSaved, setSupSaved] = useState(false)

  useEffect(() => {
    if (isSupplier && user) {
      getDoc(doc(db, 'suppliers', user.uid))
        .then(snap => { if (snap.exists()) setSup(snap.data()); setSupLoading(false) })
        .catch(() => setSupLoading(false))
    } else setSupLoading(false)
  }, [isSupplier, user])

  async function saveName(e) {
    e.preventDefault()
    if (!displayName.trim()) return
    setNameSaving(true); setNameError('')
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      await updateDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() })
      await refreshProfile()
      setNameSaved(true); setTimeout(() => setNameSaved(false), 3000)
    } catch (e) { setNameError('Failed: ' + e.message) }
    setNameSaving(false)
  }

  async function saveSupplier() {
    setSupSaving(true)
    try {
      await setDoc(doc(db, 'suppliers', user.uid), { ...sup, updatedAt: new Date().toISOString() }, { merge: true })
      setSupSaved(true); setTimeout(() => setSupSaved(false), 3000)
    } catch (e) { alert('Save failed: ' + e.message) }
    setSupSaving(false)
  }

  const sf = (key, val) => setSup(p => ({ ...p, [key]: val }))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight mb-8">My Profile</h1>

        {/* Account */}
        <div className="card p-6 mb-5">
          <h2 className="font-display text-lg font-black text-gray-900 uppercase mb-4">Account</h2>
          {nameError && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 font-body">{nameError}</div>}
          <form onSubmit={saveName} className="space-y-4">
            <div><label className="label">Display Name</label>
              <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} required /></div>
            <div><label className="label">Email</label>
              <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.email || ''} disabled />
              <p className="text-xs text-gray-400 mt-1 font-body">Email cannot be changed</p></div>
            <button type="submit" disabled={nameSaving} className="btn-primary">
              <Save size={15} /> {nameSaving ? 'Saving...' : nameSaved ? '✓ Saved!' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Supplier profile editor */}
        {isSupplier && !supLoading && sup && (
          <div className="card p-6 mb-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-black text-gray-900 uppercase">Supplier Profile</h2>
              <button onClick={saveSupplier} disabled={supSaving} className="btn-primary py-2">
                <Save size={14} /> {supSaving ? 'Saving...' : supSaved ? '✓ Saved!' : 'Save'}
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex gap-2">
              <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 font-body">Complete your profile so buyers can trust and contact you easily. WhatsApp is the most important field!</p>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Basic Info</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Company Name</label>
                    <input className="input" value={sup.companyName||''} onChange={e=>sf('companyName',e.target.value)} placeholder="Factory / brand name"/></div>
                  <div><label className="label">Business Type</label>
                    <select className="input" value={sup.businessType||''} onChange={e=>sf('businessType',e.target.value)}>
                      <option value="">Select type</option>
                      {BUSINESS_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                    </select></div>
                  <div><label className="label">Contact Person</label>
                    <input className="input" value={sup.contactPerson||''} onChange={e=>sf('contactPerson',e.target.value)} placeholder="e.g. Rahul Ahmed"/></div>
                  <div><label className="label">City / Location</label>
                    <input className="input" value={sup.location||''} onChange={e=>sf('location',e.target.value)} placeholder="e.g. Dhaka"/></div>
                  <div className="sm:col-span-2"><label className="label">Short Description</label>
                    <textarea className="input resize-none" rows={2} value={sup.description||''} onChange={e=>sf('description',e.target.value)} placeholder="2–3 lines about your factory"/></div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Contact & Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    {key:'whatsapp',label:'WhatsApp ⭐ (most important)',ph:'+880 1700 000000'},
                    {key:'phone',label:'Phone Number',ph:'+880 1700 000000'},
                    {key:'email',label:'Business Email',ph:'factory@example.com'},
                    {key:'website',label:'Website',ph:'https://yourfactory.com'},
                    {key:'instagram',label:'Instagram',ph:'https://instagram.com/...'},
                    {key:'facebook',label:'Facebook',ph:'https://facebook.com/...'},
                  ].map(f=>(
                    <div key={f.key}><label className="label">{f.label}</label>
                      <input className="input" value={sup[f.key]||''} onChange={e=>sf(f.key,e.target.value)} placeholder={f.ph}/></div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Shipping</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><label className="label">Dispatch Location</label>
                    <input className="input" value={sup.dispatchLocation||''} onChange={e=>sf('dispatchLocation',e.target.value)} placeholder="e.g. Dhaka / Chittagong"/></div>
                  <div className="flex flex-col gap-3 pt-6">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={!!sup.shippingAir} onChange={e=>sf('shippingAir',e.target.checked)} className="w-4 h-4 accent-brand-600 rounded"/>
                      <span className="text-sm font-body text-gray-700 flex items-center gap-1.5"><Globe size={13} className="text-blue-400"/> Air Freight</span>
                    </label>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={!!sup.shippingSea} onChange={e=>sf('shippingSea',e.target.checked)} className="w-4 h-4 accent-brand-600 rounded"/>
                      <span className="text-sm font-body text-gray-700 flex items-center gap-1.5"><Truck size={13} className="text-emerald-400"/> Sea Freight</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isSupplier && (
          <div className="card p-6">
            <h2 className="font-display text-lg font-black text-gray-900 uppercase mb-3">Supplier Status</h2>
            <p className="text-gray-400 text-sm mb-4 font-body">You're currently a buyer. Become a supplier to list products.</p>
            <Link to="/my-posts" className="btn-secondary"><Store size={15}/> Become a Supplier <ArrowRight size={14}/></Link>
          </div>
        )}
        {isSupplier && (
          <div className="card p-4 bg-gray-50">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-gray-600 font-semibold font-body text-sm flex items-center gap-2"><Store size={15}/> Active Supplier</span>
              <Link to="/my-posts" className="btn-primary py-2 text-xs">Manage Posts <ArrowRight size={13}/></Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}