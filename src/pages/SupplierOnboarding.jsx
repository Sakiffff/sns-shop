import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Save, Info, Sparkles, ShieldCheck, Star, CheckCircle } from 'lucide-react'

const CATEGORIES = ['T-Shirts', 'Denim', 'Hoodies', 'Polo Shirts', 'Activewear', 'Outerwear', 'Dresses', 'Knitwear', 'Accessories']

const BADGE_TIERS = [
  {
    id: 'regular',
    name: 'Regular',
    price: '500',
    period: 'month',
    color: 'blue',
    icon: <Star size={20} className="text-blue-500" />,
    description: 'Get listed with a Regular badge. Great for new suppliers.',
    features: ['Listed in directory', 'Regular badge on profile', 'Direct buyer contact'],
    className: 'border-blue-200 bg-blue-50',
    badgeClass: 'bg-blue-100 text-blue-600 border-blue-200',
  },
  {
    id: 'verified',
    name: 'Verified',
    price: '2,500',
    period: 'month',
    color: 'green',
    icon: <ShieldCheck size={20} className="text-green-600" />,
    description: 'Stand out with a Verified badge. More trust from buyers.',
    features: ['Everything in Regular', 'Verified badge on profile', 'Higher search ranking'],
    className: 'border-green-200 bg-green-50',
    badgeClass: 'bg-green-100 text-green-700 border-green-200',
  },
  {
    id: 'golden',
    name: 'Golden Supplier',
    price: '30,000',
    period: 'month',
    color: 'yellow',
    icon: <Sparkles size={20} className="text-yellow-500" />,
    description: 'Top placement and premium golden badge. Maximum visibility.',
    features: ['Everything in Verified', 'Golden badge with animation', 'Top of search results', 'Featured placement'],
    className: 'border-yellow-300 bg-yellow-50',
    badgeClass: 'golden-badge',
    premium: true,
  },
]

export default function SupplierOnboarding() {
  const { user, userProfile, refreshProfile } = useAuth()
  const [profile, setProfile] = useState({
    companyName: '', description: '', location: '', moq: '',
    whatsapp: '', email: '', website: '', instagram: '', facebook: '',
    imageUrl: '', categories: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingData, setExistingData] = useState(null)

  // Badge request state
  const [showBadgeModal, setShowBadgeModal] = useState(false)
  const [selectedTier, setSelectedTier] = useState(null)
  const [transactionId, setTransactionId] = useState('')
  const [badgeSubmitted, setBadgeSubmitted] = useState(false)
  const [submittingBadge, setSubmittingBadge] = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'suppliers', user.uid))
      if (snap.exists()) {
        const data = snap.data()
        setExistingData(data)
        setProfile(p => ({ ...p, ...data }))
      }
      setLoading(false)
    }
    load()
  }, [user.uid])

  async function handleSave() {
    setSaving(true)
    const data = {
      ...profile,
      uid: user.uid,
      displayName: userProfile?.displayName || '',
      updatedAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'suppliers', user.uid), data, { merge: true })
    // Mark user as supplier
    await setDoc(doc(db, 'users', user.uid), { isSupplier: true }, { merge: true })
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setExistingData(data)
    setTimeout(() => setSaved(false), 3000)
  }

  async function submitBadgeRequest() {
    if (!transactionId.trim()) return
    setSubmittingBadge(true)
    await setDoc(doc(db, 'badgeRequests', `${user.uid}_${Date.now()}`), {
      uid: user.uid,
      companyName: profile.companyName,
      email: userProfile?.email,
      tier: selectedTier,
      transactionId: transactionId.trim(),
      requestedAt: new Date().toISOString(),
      status: 'pending',
    })
    setSubmittingBadge(false)
    setBadgeSubmitted(true)
  }

  function toggleCategory(cat) {
    setProfile(p => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter(c => c !== cat)
        : [...p.categories, cat]
    }))
  }

  if (loading) return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center text-sand-400">Loading...</div>
  )

  const currentBadge = existingData?.badgeTier
  const pendingRequest = existingData?.badgePending

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-forest-950">
              {existingData ? 'My Supplier Profile' : 'Become a Supplier'}
            </h1>
            <p className="text-sand-500 text-sm mt-1">
              {existingData ? 'Edit your profile seen by international buyers' : 'Set up your profile to start receiving orders'}
            </p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save size={16} />
            {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </div>

        {/* Image tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>Free image hosting:</strong> Go to{' '}
            <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="underline">imgur.com/upload</a>
            {' '}→ upload photo → right-click image → "Copy image address" → paste below.
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-forest-900">Basic Information</h2>
            <div>
              <label className="label">Company Name *</label>
              <input className="input" value={profile.companyName} onChange={e => setProfile({ ...profile, companyName: e.target.value })} placeholder="Your factory or company name" />
            </div>
            <div>
              <label className="label">Profile / Product Image URL</label>
              <input className="input" value={profile.imageUrl} onChange={e => setProfile({ ...profile, imageUrl: e.target.value })} placeholder="https://i.imgur.com/yourimage.jpg" />
              {profile.imageUrl && (
                <img src={profile.imageUrl} alt="preview" className="mt-2 h-32 rounded-lg object-cover border border-sand-200" onError={e => e.target.style.display = 'none'} />
              )}
            </div>
            <div>
              <label className="label">Short Description</label>
              <textarea className="input resize-none" rows={3} value={profile.description} onChange={e => setProfile({ ...profile, description: e.target.value })} placeholder="What do you produce? MOQ? Speciality?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City / Location</label>
                <input className="input" value={profile.location} onChange={e => setProfile({ ...profile, location: e.target.value })} placeholder="e.g. Dhaka, Chittagong" />
              </div>
              <div>
                <label className="label">Min. Order Qty (pcs)</label>
                <input className="input" type="number" value={profile.moq} onChange={e => setProfile({ ...profile, moq: e.target.value })} placeholder="e.g. 500" />
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="card p-6">
            <h2 className="font-semibold text-forest-900 mb-4">Product Categories</h2>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    profile.categories.includes(cat)
                      ? 'bg-forest-600 border-forest-600 text-white'
                      : 'bg-white border-sand-200 text-sand-600 hover:border-forest-300'
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-forest-900">Contact & Links</h2>
            {[
              { key: 'whatsapp', label: 'WhatsApp Number', placeholder: '+880 1700 000000' },
              { key: 'email', label: 'Business Email', placeholder: 'factory@example.com' },
              { key: 'website', label: 'Website URL', placeholder: 'https://yourfactory.com' },
              { key: 'instagram', label: 'Instagram URL', placeholder: 'https://instagram.com/yourpage' },
              { key: 'facebook', label: 'Facebook URL', placeholder: 'https://facebook.com/yourpage' },
            ].map(field => (
              <div key={field.key}>
                <label className="label">{field.label}</label>
                <input className="input" value={profile[field.key] || ''} onChange={e => setProfile({ ...profile, [field.key]: e.target.value })} placeholder={field.placeholder} />
              </div>
            ))}
          </div>

          {/* Badge Tiers */}
          {existingData && (
            <div className="card p-6">
              <h2 className="font-semibold text-forest-900 mb-1">Supplier Badge</h2>
              <p className="text-sand-500 text-sm mb-5">Boost your visibility with a badge. Pay via bKash and submit your transaction ID.</p>

              {currentBadge && currentBadge !== 'none' && (
                <div className="mb-5 p-3 bg-forest-50 border border-forest-200 rounded-lg flex items-center gap-2 text-sm text-forest-700">
                  <CheckCircle size={16} className="text-forest-600" />
                  Your current badge: <strong className="capitalize">{currentBadge}</strong>
                </div>
              )}

              {pendingRequest && (
                <div className="mb-5 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                  ⏳ Badge request pending admin review. We'll activate it within 24 hours.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {BADGE_TIERS.map(tier => (
                  <div
                    key={tier.id}
                    className={`rounded-xl border-2 p-4 cursor-pointer transition-all ${tier.className} ${
                      tier.premium ? 'golden-card-hover' : 'hover:shadow-md'
                    }`}
                    onClick={() => { setSelectedTier(tier.id); setShowBadgeModal(true); setBadgeSubmitted(false); setTransactionId('') }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {tier.icon}
                      <span className="font-semibold text-forest-900">{tier.name}</span>
                    </div>
                    <div className="text-2xl font-bold text-forest-950 mb-1">
                      ৳{tier.price}
                      <span className="text-sm font-normal text-sand-500">/{tier.period}</span>
                    </div>
                    <p className="text-xs text-sand-500 mb-3">{tier.description}</p>
                    <ul className="space-y-1">
                      {tier.features.map(f => (
                        <li key={f} className="text-xs text-sand-600 flex items-center gap-1.5">
                          <span className="text-forest-500">✓</span> {f}
                        </li>
                      ))}
                    </ul>
                    <button className={`mt-4 w-full py-2 rounded-lg text-xs font-semibold border transition-all ${
                      tier.id === 'golden'
                        ? 'bg-yellow-400 hover:bg-yellow-300 text-yellow-900 border-yellow-400'
                        : tier.id === 'verified'
                          ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                          : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500'
                    }`}>
                      Apply for {tier.name}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Badge Modal */}
      {showBadgeModal && selectedTier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4" onClick={() => setShowBadgeModal(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            {badgeSubmitted ? (
              <div className="text-center py-4">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-display text-xl font-bold text-forest-950 mb-2">Request Submitted!</h3>
                <p className="text-sand-500 text-sm mb-4">
                  Your <strong className="capitalize">{selectedTier}</strong> badge request is pending review.
                  We'll activate it within 24 hours after confirming your payment.
                </p>
                <button onClick={() => setShowBadgeModal(false)} className="btn-primary w-full justify-center">Done</button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl font-bold text-forest-950 mb-1">
                  Apply for {BADGE_TIERS.find(t => t.id === selectedTier)?.name} Badge
                </h3>
                <p className="text-sand-500 text-sm mb-5">
                  Cost: <strong>৳{BADGE_TIERS.find(t => t.id === selectedTier)?.price}/month</strong>
                </p>

                <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 mb-5">
                  <p className="text-sm font-semibold text-forest-900 mb-1">Payment Instructions</p>
                  <p className="text-sm text-sand-600 mb-2">Send payment via <strong>bKash</strong> to:</p>
                  <div className="bg-white border border-sand-300 rounded-lg px-4 py-2 font-mono text-lg font-bold text-forest-900 text-center tracking-widest mb-2">
                    01819103212
                  </div>
                  <p className="text-xs text-sand-400 text-center">Send Money (not payment)</p>
                </div>

                <div className="mb-5">
                  <label className="label">bKash Transaction ID</label>
                  <input
                    className="input"
                    value={transactionId}
                    onChange={e => setTransactionId(e.target.value)}
                    placeholder="e.g. 8G5K3J2L9M"
                  />
                  <p className="text-xs text-sand-400 mt-1">You'll find this in your bKash transaction history</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setShowBadgeModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button
                    onClick={submitBadgeRequest}
                    disabled={!transactionId.trim() || submittingBadge}
                    className="btn-primary flex-1 justify-center"
                  >
                    {submittingBadge ? 'Submitting...' : 'Submit Request'}
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