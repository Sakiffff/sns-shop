import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { Star, Check, X, Users, Building, Sparkles, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react'

export default function AdminDashboard() {
  const [suppliers, setSuppliers] = useState([])
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('requests')
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(null)

  async function loadData() {
    setLoading(true)
    setActionError('')
    try {
      const [supSnap, reqSnap] = await Promise.all([
        getDocs(collection(db, 'suppliers')),
        getDocs(collection(db, 'badgeRequests')),
      ])
      setSuppliers(supSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setRequests(
        reqSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => {
            if (a.status === 'pending' && b.status !== 'pending') return -1
            if (b.status === 'pending' && a.status !== 'pending') return 1
            return new Date(b.requestedAt) - new Date(a.requestedAt)
          })
      )
    } catch (e) {
      setActionError('Failed to load data: ' + e.message)
    }
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  async function approveBadge(req) {
    setActionLoading(req.id); setActionError('')
    try {
      // Update badge request status
      await setDoc(doc(db, 'badgeRequests', req.id), {
        status: 'approved',
        reviewedAt: new Date().toISOString(),
      }, { merge: true })

      // Update supplier badge — use setDoc merge in case doc structure varies
      await setDoc(doc(db, 'suppliers', req.uid), {
        badgeTier: req.tier,
        badgePending: false,
        badgeApprovedAt: new Date().toISOString(),
      }, { merge: true })

      setRequests(r => r.map(x => x.id === req.id ? { ...x, status: 'approved' } : x))
      setSuppliers(s => s.map(x => x.id === req.uid ? { ...x, badgeTier: req.tier } : x))
    } catch (e) {
      console.error('approve error', e)
      setActionError('Approve failed: ' + e.message)
    }
    setActionLoading(null)
  }

  async function rejectBadge(req) {
    setActionLoading(req.id); setActionError('')
    try {
      await setDoc(doc(db, 'badgeRequests', req.id), {
        status: 'rejected',
        reviewedAt: new Date().toISOString(),
      }, { merge: true })
      await setDoc(doc(db, 'suppliers', req.uid), { badgePending: false }, { merge: true })
      setRequests(r => r.map(x => x.id === req.id ? { ...x, status: 'rejected' } : x))
    } catch (e) {
      console.error('reject error', e)
      setActionError('Reject failed: ' + e.message)
    }
    setActionLoading(null)
  }

  async function removeBadge(supplierId) {
    setActionLoading(supplierId); setActionError('')
    try {
      await setDoc(doc(db, 'suppliers', supplierId), { badgeTier: 'none' }, { merge: true })
      setSuppliers(s => s.map(x => x.id === supplierId ? { ...x, badgeTier: 'none' } : x))
    } catch (e) {
      setActionError('Remove badge failed: ' + e.message)
    }
    setActionLoading(null)
  }

  const pending = requests.filter(r => r.status === 'pending')

  function TierBadge({ tier }) {
    if (!tier || tier === 'none') return <span className="text-gray-300 text-xs font-body">None</span>
    if (tier === 'golden') return <span className="badge-golden text-xs"><Sparkles size={9}/>Golden</span>
    if (tier === 'verified') return <span className="badge-verified"><ShieldCheck size={9}/>Verified</span>
    if (tier === 'regular') return <span className="badge-regular"><Star size={9}/>Regular</span>
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight">Admin Panel</h1>
            <p className="text-gray-400 text-sm mt-1 font-body">Manage suppliers and badge requests</p>
          </div>
          <button onClick={loadData} className="btn-secondary gap-2">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {actionError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-start gap-2 text-sm font-body">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <strong>Error:</strong> {actionError}
              <div className="mt-1 text-xs text-red-400">
                Make sure your Firestore rules allow admin writes to badgeRequests and suppliers collections.
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Suppliers', value: suppliers.length, icon: <Building size={18} /> },
            { label: 'Golden', value: suppliers.filter(s => s.badgeTier === 'golden').length, icon: <Sparkles size={18} className="text-yellow-500" /> },
            { label: 'Verified', value: suppliers.filter(s => s.badgeTier === 'verified').length, icon: <ShieldCheck size={18} className="text-emerald-600" /> },
            { label: 'Pending Requests', value: pending.length, icon: <Users size={18} className="text-brand-600" /> },
          ].map(stat => (
            <div key={stat.label} className="card p-5">
              <div className="mb-2">{stat.icon}</div>
              <div className="font-display text-3xl font-black text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-400 font-body">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'requests', label: pending.length > 0 ? `Badge Requests (${pending.length} pending)` : 'Badge Requests' },
            { key: 'suppliers', label: `All Suppliers (${suppliers.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all font-body ${
                tab === t.key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-body">Loading...</div>
        ) : tab === 'requests' ? (
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="text-center py-16 text-gray-400 font-body">No badge requests yet.</div>
            )}
            {requests.map(req => (
              <div key={req.id} className={`card p-5 ${req.status === 'pending' ? 'border-l-4 border-l-yellow-400' : ''}`}>
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-display font-bold text-gray-900 text-lg uppercase">{req.companyName || '(no name)'}</span>
                      <TierBadge tier={req.tier} />
                    </div>
                    <div className="text-sm text-gray-400 font-body">{req.email}</div>
                    <div className="text-xs text-gray-300 mt-0.5 font-body">
                      {req.requestedAt ? new Date(req.requestedAt).toLocaleString() : ''}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-400 font-body">bKash TxID:</span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-0.5 rounded-lg text-gray-800 font-bold">
                        {req.transactionId}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1 font-body">
                      Amount: ৳{req.tier === 'golden' ? '30,000' : req.tier === 'verified' ? '2,500' : '500'}/month
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold font-body ${
                      req.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                      req.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                      'bg-red-100 text-red-700 border border-red-200'
                    }`}>
                      {req.status}
                    </span>
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => approveBadge(req)}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-1 text-xs px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors font-bold disabled:opacity-50"
                        >
                          {actionLoading === req.id ? '...' : <><Check size={12} /> Approve Badge</>}
                        </button>
                        <button
                          onClick={() => rejectBadge(req)}
                          disabled={actionLoading === req.id}
                          className="flex items-center gap-1 text-xs px-3 py-2 rounded-xl bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-bold disabled:opacity-50"
                        >
                          {actionLoading === req.id ? '...' : <><X size={12} /> Reject</>}
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
              <table className="w-full text-sm font-body">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Company','Location','Categories','Badge','Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {suppliers.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">{s.companyName || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{s.location || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.categories?.slice(0,2).map(c => (
                            <span key={c} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">{c}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3"><TierBadge tier={s.badgeTier} /></td>
                      <td className="px-4 py-3">
                        {s.badgeTier && s.badgeTier !== 'none' && (
                          <button
                            onClick={() => removeBadge(s.id)}
                            disabled={actionLoading === s.id}
                            className="text-xs px-3 py-1.5 rounded-lg text-red-600 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === s.id ? '...' : 'Remove Badge'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {suppliers.length === 0 && <div className="text-center py-12 text-gray-400 font-body">No suppliers yet.</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}