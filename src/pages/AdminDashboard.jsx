import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { Star, Check, X, Users, Building, Sparkles, ShieldCheck } from 'lucide-react'

export default function AdminDashboard() {
  const [suppliers, setSuppliers] = useState([])
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('requests')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [supSnap, reqSnap] = await Promise.all([
        getDocs(collection(db, 'suppliers')),
        getDocs(collection(db, 'badgeRequests')),
      ])
      setSuppliers(supSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1
        if (b.status === 'pending' && a.status !== 'pending') return 1
        return new Date(b.requestedAt) - new Date(a.requestedAt)
      }))
      setLoading(false)
    }
    load()
  }, [])

  async function approveBadge(req) {
    // Update the badge request
    await updateDoc(doc(db, 'badgeRequests', req.id), {
      status: 'approved',
      reviewedAt: new Date().toISOString(),
    })
    // Update the supplier's badge
    await updateDoc(doc(db, 'suppliers', req.uid), {
      badgeTier: req.tier,
      badgePending: false,
      badgeApprovedAt: new Date().toISOString(),
    })
    setRequests(r => r.map(x => x.id === req.id ? { ...x, status: 'approved' } : x))
    setSuppliers(s => s.map(x => x.id === req.uid ? { ...x, badgeTier: req.tier } : x))
  }

  async function rejectBadge(req) {
    await updateDoc(doc(db, 'badgeRequests', req.id), {
      status: 'rejected',
      reviewedAt: new Date().toISOString(),
    })
    await updateDoc(doc(db, 'suppliers', req.uid), { badgePending: false })
    setRequests(r => r.map(x => x.id === req.id ? { ...x, status: 'rejected' } : x))
  }

  async function removeBadge(supplierId) {
    await updateDoc(doc(db, 'suppliers', supplierId), { badgeTier: 'none' })
    setSuppliers(s => s.map(x => x.id === supplierId ? { ...x, badgeTier: 'none' } : x))
  }

  const pending = requests.filter(r => r.status === 'pending')

  function TierBadge({ tier }) {
    if (!tier || tier === 'none') return <span className="text-sand-300 text-xs">None</span>
    if (tier === 'golden') return <span className="golden-badge text-xs px-2 py-0.5 inline-flex items-center gap-1"><Sparkles size={9} />Golden</span>
    if (tier === 'verified') return <span className="bg-green-100 text-green-700 border border-green-200 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"><ShieldCheck size={9} />Verified</span>
    if (tier === 'regular') return <span className="bg-blue-100 text-blue-600 border border-blue-200 text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1"><Star size={9} />Regular</span>
    return null
  }

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-forest-950">Admin Dashboard</h1>
          <p className="text-sand-500 text-sm mt-1">Private panel — manage suppliers and badge requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Suppliers', value: suppliers.length, icon: <Building size={18} /> },
            { label: 'Golden', value: suppliers.filter(s => s.badgeTier === 'golden').length, icon: <Sparkles size={18} /> },
            { label: 'Verified', value: suppliers.filter(s => s.badgeTier === 'verified').length, icon: <ShieldCheck size={18} /> },
            { label: 'Pending Requests', value: pending.length, icon: <Users size={18} /> },
          ].map(stat => (
            <div key={stat.label} className="card p-4">
              <div className="text-forest-600 mb-2">{stat.icon}</div>
              <div className="font-display text-2xl font-bold text-forest-950">{stat.value}</div>
              <div className="text-xs text-sand-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'requests', label: pending.length > 0 ? `Badge Requests (${pending.length} pending)` : 'Badge Requests' },
            { key: 'suppliers', label: 'All Suppliers' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.key ? 'bg-forest-600 text-white' : 'bg-white border border-sand-200 text-sand-600 hover:border-forest-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-sand-400">Loading...</div>
        ) : tab === 'requests' ? (
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="text-center py-16 text-sand-400">No badge requests yet.</div>
            )}
            {requests.map(req => (
              <div key={req.id} className={`card p-4 ${req.status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''}`}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-forest-900">{req.companyName}</span>
                      <TierBadge tier={req.tier} />
                    </div>
                    <div className="text-sm text-sand-400">{req.email}</div>
                    <div className="text-xs text-sand-400 mt-1">
                      Requested: {new Date(req.requestedAt).toLocaleString()}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-sand-500">bKash TxID:</span>
                      <span className="font-mono text-sm bg-sand-100 px-2 py-0.5 rounded text-forest-900">{req.transactionId}</span>
                    </div>
                    <div className="mt-1 text-xs text-sand-500">
                      Amount: ৳{req.tier === 'golden' ? '30,000' : req.tier === 'verified' ? '2,500' : '500'}/month
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      req.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {req.status}
                    </span>
                    {req.status === 'pending' && (
                      <>
                        <button onClick={() => approveBadge(req)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                          <Check size={12} /> Approve Badge
                        </button>
                        <button onClick={() => rejectBadge(req)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                          <X size={12} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sand-50 border-b border-sand-200">
                  <tr>
                    {['Company', 'Location', 'Categories', 'Badge', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-medium text-sand-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-sand-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-forest-900 whitespace-nowrap">{s.companyName || '—'}</td>
                      <td className="px-4 py-3 text-sand-500 whitespace-nowrap">{s.location || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.categories?.slice(0, 2).map(c => (
                            <span key={c} className="bg-forest-50 text-forest-700 text-xs px-2 py-0.5 rounded-full">{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><TierBadge tier={s.badgeTier} /></td>
                      <td className="px-4 py-3">
                        {s.badgeTier && s.badgeTier !== 'none' && (
                          <button onClick={() => removeBadge(s.id)}
                            className="text-xs px-3 py-1.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors">
                            Remove Badge
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {suppliers.length === 0 && <div className="text-center py-12 text-sand-400">No suppliers yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}