import { useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { updateProfile } from 'firebase/auth'
import { db, auth } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Save, User, Store, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ProfilePage() {
  const { user, userProfile, refreshProfile, isSupplier } = useAuth()
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  async function handleSave(e) {
    e.preventDefault()
    if (!displayName.trim()) return
    setSaving(true); setError('')
    try {
      await updateProfile(auth.currentUser, { displayName: displayName.trim() })
      await updateDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() })
      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError('Failed to save: ' + e.message)
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-lg mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight mb-8">My Profile</h1>

        <div className="card p-6 mb-5">
          <h2 className="font-display text-lg font-black text-gray-900 uppercase mb-4">Account Info</h2>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 font-body">{error}</div>}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="label">Display Name</label>
              <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name" required />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input bg-gray-50 text-gray-400 cursor-not-allowed" value={user?.email} disabled />
              <p className="text-xs text-gray-400 mt-1 font-body">Email cannot be changed</p>
            </div>
            <button type="submit" disabled={saving} className="btn-primary">
              <Save size={15} /> {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Supplier status */}
        <div className="card p-6">
          <h2 className="font-display text-lg font-black text-gray-900 uppercase mb-3">Supplier Status</h2>
          {isSupplier ? (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-green-700 font-semibold text-sm font-body">Active Supplier</span>
              </div>
              <p className="text-gray-400 text-sm mb-4 font-body">You can create and manage sale posts.</p>
              <Link to="/my-posts" className="btn-primary">
                <Store size={15} /> My Sale Posts <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-gray-400 text-sm mb-4 font-body">You're currently a buyer. Become a supplier to list products and receive orders.</p>
              <Link to="/my-posts" className="btn-secondary">
                <Store size={15} /> Become a Supplier <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
