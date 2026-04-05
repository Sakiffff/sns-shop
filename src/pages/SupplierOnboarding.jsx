import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Save, Info, Sparkles, ShieldCheck, Star, CheckCircle, AlertCircle } from 'lucide-react'

const CATEGORIES = ['T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories']

const BADGE_TIERS = [
  {
    id: 'regular', name: 'Regular', price: '500',
    icon: <Star size={22} className="text-blue-500" />,
    description: 'Get listed with a Regular badge.',
    features: ['Listed in directory','Regular badge on profile','Direct buyer contact'],
    cardClass: 'border-blue-200 bg-blue-50',
    btnClass: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500',
  },
  {
    id: 'verified', name: 'Verified', price: '2,500',
    icon: <ShieldCheck size={22} className="text-emerald-600" />,
    description: 'Stand out with a Verified badge. More trust.',
    features: ['Everything in Regular','Verified badge on profile','Higher search ranking'],
    cardClass: 'border-emerald-200 bg-emerald-50',
    btnClass: 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600',
  },
  {
    id: 'golden', name: 'Golden Supplier', price: '30,000',
    icon: <Sparkles size={22} className="text-yellow-500" />,
    description: 'Top placement and premium golden badge.',
    features: ['Everything in Verified','Golden badge with animation','Top of search results'],
    cardClass: 'border-yellow-300 bg-yellow-50',
    btnClass: 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900 border-yellow-400',
    premium: true,
  },
]

export default function SupplierOnboarding() {
  const { user, userProfile, refreshProfile } = useAuth()
  const [profile, setProfile] = useState({
    companyName:'', description:'', location:'', moq:'',
    whatsapp:'', email:'', website:'', instagram:'', facebook:'',
    imageUrl:'', categories:[],
  })
  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [existingData, setExistingData] = useState(null)

  const [showModal, setShowModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [transactionId, setTransactionId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'suppliers', user.uid))
        if (snap.exists()) {
          const data = snap.data()
          setExistingData(data)
          setProfile(p => ({ ...p, ...data }))
        }
      } catch (e) { console.error('load profile error', e) }
      setPageLoading(false)
    }
    load()
  }, [user.uid])

  async function handleSave() {
    setSaving(true); setSaveError('')
    try {
      const data = {
        ...profile,
        uid: user.uid,
        displayName: userProfile?.displayName || '',
        updatedAt: new Date().toISOString(),
      }
      await setDoc(doc(db, 'suppliers', user.uid), data, { merge: true })
      await setDoc(doc(db, 'users', user.uid), { isSupplier: true }, { merge: true })
      await refreshProfile()
      setExistingData(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error('save error', e)
      setSaveError('Save failed: ' + e.message)
    }
    setSaving(false)
  }

  async function submitBadgeRequest() {
    if (!transactionId.trim()) return
    setSubmitting(true); setSubmitError('')
    try {
      // Use addDoc with auto-generated ID to avoid permission issues
      await addDoc(collection(db, 'badgeRequests'), {
        uid: user.uid,
        companyName: profile.companyName || userProfile?.displayName || '',
        email: user.email,
        tier: selectedTier,
        transactionId: transactionId.trim(),
        requestedAt: new Date().toISOString(),
        status: 'pending',
      })
      // Mark pending on supplier doc
      await setDoc(doc(db, 'suppliers', user.uid), { badgePending: true }, { merge: true })
      setSubmitted(true)
    } catch (e) {
      console.error('badge request error', e)
      setSubmitError('Submission failed: ' + e.message + '. Please check Firestore rules.')
    }
    setSubmitting(false)
  }

  function toggleCategory(cat) {
    setProfile(p => ({
      ...p,
      categories: p.categories.includes(cat) ? p.categories.filter(c => c !== cat) : [...p.categories, cat]
    }))
  }

  function openModal(tierId) {
    setSelectedTier(tierId)
    setTransactionId('')
    setSubmitted(false)
    setSubmitError('')
    setShowModal(true)
  }

  if (pageLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 font-body">Loading...</div>
  )

  const tierInfo = BADGE_TIERS.find(t => t.id === selectedTier)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight">
              {existingData ? 'My Supplier Profile' : 'Become a Supplier'}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-body">
              {existingData ? 'Edit your profile visible to international buyers' : 'Set up your profile to start receiving inquiries'}
            </p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save size={15} />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </div>

        {saveError && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-body">
            <AlertCircle size={16} /> {saveError}
          </div>
        )}

        {/* Image tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Info size={17} className="text-blue-500 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 font-body">
            <strong>Free images:</strong> Upload to{' '}
            <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="underline">imgur.com/upload</a>
            {' '}→ right-click image → "Copy image address" → paste below.
          </p>
        </div>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-gray-900 uppercase">Basic Information</h2>
            <div>
              <label className="label">Company Name *</label>
              <input className="input" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} placeholder="Your factory or company name" />
            </div>
            <div>
              <label className="label">Profile / Product Image URL</label>
              <input className="input" value={profile.imageUrl} onChange={e => setProfile({...profile, imageUrl: e.target.value})} placeholder="https://i.imgur.com/yourimage.jpg" />
              {profile.imageUrl && (
                <img src={profile.imageUrl} alt="preview" className="mt-2 h-32 rounded-xl object-cover border border-gray-200" onError={e => e.target.style.display='none'} />
              )}
            </div>
            <div>
              <label className="label">Short Description</label>
              <textarea className="input resize-none" rows={3} value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} placeholder="What do you produce? MOQ? Speciality?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City / Location</label>
                <input className="input" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} placeholder="e.g. Dhaka, Chittagong" />
              </div>
              <div>
                <label className="label">Min. Order Qty (pcs)</label>
                <input className="input" type="number" value={profile.moq} onChange={e => setProfile({...profile, moq: e.target.value})} placeholder="e.g. 500" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="card p-6">
            <h2 className="font-display text-xl font-bold text-gray-900 uppercase mb-4">Product Categories</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all font-body ${
                    profile.categories.includes(cat)
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-brand-300'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="card p-6 space-y-4">
            <h2 className="font-display text-xl font-bold text-gray-900 uppercase">Contact & Links</h2>
            {[
              { key:'whatsapp', label:'WhatsApp Number', placeholder:'+880 1700 000000' },
              { key:'email', label:'Business Email', placeholder:'factory@example.com' },
              { key:'website', label:'Website URL', placeholder:'https://yourfactory.com' },
              { key:'instagram', label:'Instagram URL', placeholder:'https://instagram.com/yourpage' },
              { key:'facebook', label:'Facebook URL', placeholder:'https://facebook.com/yourpage' },
            ].map(f => (
              <div key={f.key}>
                <label className="label">{f.label}</label>
                <input className="input" value={profile[f.key]||''} onChange={e => setProfile({...profile,[f.key]:e.target.value})} placeholder={f.placeholder} />
              </div>
            ))}
          </div>

          {/* Badge Tiers — only shown after first save */}
          {existingData && (
            <div className="card p-6">
              <h2 className="font-display text-xl font-bold text-gray-900 uppercase mb-1">Supplier Badge</h2>
              <p className="text-gray-400 text-sm mb-5 font-body">
                Boost your visibility. Pay via bKash and submit your transaction ID for review.
              </p>

              {existingData.badgeTier && existingData.badgeTier !== 'none' && (
                <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-sm text-green-700 font-body">
                  <CheckCircle size={16} /> Active badge: <strong className="capitalize">{existingData.badgeTier}</strong>
                </div>
              )}
              {existingData.badgePending && (
                <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700 font-body">
                  ⏳ Badge request under review. We'll activate within 24h after payment confirmation.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BADGE_TIERS.map(tier => (
                  <div key={tier.id} className={`rounded-2xl border-2 p-5 cursor-pointer hover:shadow-lg transition-all ${tier.cardClass}`}
                    onClick={() => openModal(tier.id)}>
                    <div className="flex items-center gap-2 mb-2">{tier.icon}<span className="font-display font-bold text-gray-900 uppercase tracking-wide">{tier.name}</span></div>
                    <div className="font-display text-3xl font-black text-gray-900 mb-1">
                      ৳{tier.price}<span className="text-sm font-body font-normal text-gray-400">/mo</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-3 font-body">{tier.description}</p>
                    <ul className="space-y-1 mb-4">
                      {tier.features.map(f => (
                        <li key={f} className="text-xs text-gray-600 flex items-center gap-1.5 font-body">
                          <span className="text-brand-500 font-bold">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button className={`w-full py-2 rounded-xl text-xs font-bold border transition-all ${tier.btnClass}`}
                      onClick={e => { e.stopPropagation(); openModal(tier.id) }}>
                      Apply for {tier.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {submitted ? (
              <div className="text-center py-6">
                <div className="text-6xl mb-4">✅</div>
                <h3 className="font-display text-2xl font-black text-gray-900 uppercase mb-2">Request Submitted!</h3>
                <p className="text-gray-400 text-sm mb-6 font-body">
                  Your <strong className="capitalize">{selectedTier}</strong> badge request is pending review.
                  We'll activate it within 24 hours.
                </p>
                <button onClick={() => setShowModal(false)} className="btn-primary w-full justify-center">Done</button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-2xl font-black text-gray-900 uppercase mb-1">
                  Apply for {tierInfo?.name}
                </h3>
                <p className="text-gray-400 text-sm mb-5 font-body">
                  ৳{tierInfo?.price}/month · Pay via bKash then enter your transaction ID below
                </p>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-body flex items-start gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div>{submitError}</div>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-5">
                  <p className="text-sm font-bold text-gray-700 mb-3 font-body">Payment Instructions</p>
                  <p className="text-sm text-gray-500 mb-3 font-body">
                    Open bKash → <strong>Send Money</strong> → enter number:
                  </p>
                  <div className="bg-white border-2 border-brand-200 rounded-xl py-3 font-mono text-2xl font-black text-brand-600 text-center tracking-widest mb-2">
                    01819103212
                  </div>
                  <p className="text-xs text-gray-400 text-center font-body">Use "Send Money", not "Payment"</p>
                </div>

                <div className="mb-5">
                  <label className="label">bKash Transaction ID *</label>
                  <input
                    className="input"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="e.g. 8G5K3J2L9M"
                    disabled={submitting}
                  />
                  <p className="text-xs text-gray-400 mt-1 font-body">Find this in your bKash transaction history</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center" disabled={submitting}>Cancel</button>
                  <button
                    onClick={submitBadgeRequest}
                    disabled={!transactionId.trim() || submitting}
                    className="btn-primary flex-1 justify-center"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
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