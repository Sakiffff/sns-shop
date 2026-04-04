import { useState, useEffect } from 'react'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Save, Star, ExternalLink, Info } from 'lucide-react'

const CATEGORIES = ['T-Shirts','Denim','Hoodies','Polo Shirts','Activewear','Outerwear','Dresses','Knitwear','Accessories']

export default function SupplierDashboard() {
  const { user, userProfile } = useAuth()
  const [profile, setProfile] = useState({
    companyName: '', description: '', location: '', moq: '',
    whatsapp: '', email: '', website: '', instagram: '', facebook: '',
    imageUrl: '', categories: [],
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sponsorRequested, setSponsorRequested] = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'suppliers', user.uid))
      if (snap.exists()) setProfile({ ...profile, ...snap.data() })
      setLoading(false)
    }
    load()
  }, [user.uid])

  async function handleSave() {
    setSaving(true)
    await setDoc(doc(db, 'suppliers', user.uid), {
      ...profile,
      uid: user.uid,
      displayName: userProfile?.displayName || '',
      updatedAt: new Date().toISOString(),
    }, { merge: true })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function requestSponsored() {
    await setDoc(doc(db, 'sponsorRequests', user.uid), {
      uid: user.uid,
      companyName: profile.companyName,
      email: userProfile?.email,
      requestedAt: new Date().toISOString(),
      status: 'pending',
    })
    setSponsorRequested(true)
  }

  function toggleCategory(cat) {
    setProfile(p => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter(c => c !== cat)
        : [...p.categories, cat]
    }))
  }

  if (loading) return <div className="min-h-screen bg-sand-50 flex items-center justify-center text-sand-400">Loading...</div>

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-forest-950">Supplier Dashboard</h1>
            <p className="text-sand-500 text-sm mt-1">Manage your profile visible to international buyers</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            <Save size={16} /> {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Profile'}
          </button>
        </div>

        {/* Image URL tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex gap-3">
          <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <strong>Free image hosting:</strong> Go to <a href="https://imgur.com/upload" target="_blank" rel="noreferrer" className="underline">imgur.com/upload</a> → upload your photo → right-click the image → "Copy image address" → paste below.
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold text-forest-900">Basic Information</h2>
            <div>
              <label className="label">Company Name *</label>
              <input className="input" value={profile.companyName} onChange={e => setProfile({...profile, companyName: e.target.value})} placeholder="Your factory or company name" />
            </div>
            <div>
              <label className="label">Profile Image URL</label>
              <input className="input" value={profile.imageUrl} onChange={e => setProfile({...profile, imageUrl: e.target.value})} placeholder="https://i.imgur.com/yourimage.jpg" />
              {profile.imageUrl && <img src={profile.imageUrl} alt="preview" className="mt-2 h-32 rounded-lg object-cover" />}
            </div>
            <div>
              <label className="label">Short Description</label>
              <textarea className="input resize-none" rows={3} value={profile.description} onChange={e => setProfile({...profile, description: e.target.value})} placeholder="What do you produce? What makes you stand out?" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">City / Location</label>
                <input className="input" value={profile.location} onChange={e => setProfile({...profile, location: e.target.value})} placeholder="e.g. Dhaka, Chittagong" />
              </div>
              <div>
                <label className="label">Minimum Order Qty (pcs)</label>
                <input className="input" type="number" value={profile.moq} onChange={e => setProfile({...profile, moq: e.target.value})} placeholder="e.g. 500" />
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
                <input className="input" value={profile[field.key]} onChange={e => setProfile({...profile, [field.key]: e.target.value})} placeholder={field.placeholder} />
              </div>
            ))}
          </div>

          {/* Sponsored */}
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Star size={18} className="text-sand-500" />
              <h2 className="font-semibold text-forest-900">Sponsored Badge</h2>
            </div>
            {profile.sponsored ? (
              <div className="bg-sand-50 border border-sand-200 rounded-lg px-4 py-3 text-sm text-sand-700">
                ✨ You have an active <strong>Sponsored</strong> badge! Your profile is featured to buyers.
              </div>
            ) : sponsorRequested ? (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
                ✅ Request submitted! Send payment via <strong>bKash</strong> to <strong>01700-000000</strong> and our team will activate your badge within 24 hours.
              </div>
            ) : (
              <div>
                <p className="text-sm text-sand-500 mb-4">Get featured at the top of search results and show a "Sponsored" badge on your profile.</p>
                <button onClick={requestSponsored} className="btn-secondary">
                  <Star size={16} /> Apply for Sponsored Badge
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}