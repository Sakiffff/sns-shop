import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { Star, Check, X, Users, Building } from 'lucide-react'

export default function AdminDashboard() {
  const [suppliers, setSuppliers] = useState([])
  const [requests, setRequests] = useState([])
  const [tab, setTab] = useState('suppliers')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [supSnap, reqSnap] = await Promise.all([
        getDocs(collection(db, 'suppliers')),
        getDocs(collection(db, 'sponsorRequests')),
      ])
      setSuppliers(supSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setRequests(reqSnap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }
    load()
  }, [])

  async function toggleSponsored(supplierId, current) {
    await updateDoc(doc(db, 'suppliers', supplierId), { sponsored: !current })
    setSuppliers(s => s.map(x => x.id === supplierId ? { ...x, sponsored: !current } : x))
  }

  async function handleRequest(reqId, supplierId, approve) {
    await updateDoc(doc(db, 'sponsorRequests', reqId), {
      status: approve ? 'approved' : 'rejected',
      reviewedAt: new Date().toISOString(),
    })
    if (approve) {
      await updateDoc(doc(db, 'suppliers', supplierId), { sponsored: true })
      setSuppliers(s => s.map(x => x.id === supplierId ? { ...x, sponsored: true } : x))
    }
    setRequests(r => r.map(x => x.id === reqId ? { ...x, status: approve ? 'approved' : 'rejected' } : x))
  }

  const pending = requests.filter(r => r.status === 'pending')

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-forest-950">Admin Dashboard</h1>
          <p className="text-sand-500 text-sm mt-1">Private panel — manage suppliers and sponsored requests</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Suppliers', value: suppliers.length, icon: <Building size={18} /> },
            { label: 'Sponsored', value: suppliers.filter(s => s.sponsored).length, icon: <Star size={18} /> },
            { label: 'Pending Requests', value: pending.length, icon: <Users size={18} /> },
            { label: 'Total Requests', value: requests.length, icon: <Users size={18} /> },
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
          {['suppliers', 'requests'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                tab === t ? 'bg-forest-600 text-white' : 'bg-white border border-sand-200 text-sand-600 hover:border-forest-300'
              }`}>
              {t === 'requests' && pending.length > 0 ? `Requests (${pending.length})` : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-sand-400">Loading...</div>
        ) : tab === 'suppliers' ? (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand-50 border-b border-sand-200">
                <tr>
                  {['Company', 'Location', 'Categories', 'Sponsored', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-sand-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-sand-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-forest-900">{s.companyName || '—'}</td>
                    <td className="px-4 py-3 text-sand-500">{s.location || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {s.categories?.slice(0, 2).map(c => (
                          <span key={c} className="bg-forest-50 text-forest-700 text-xs px-2 py-0.5 rounded-full">{c}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.sponsored
                        ? <span className="badge-sponsored"><Star size={10} />Yes</span>
                        : <span className="text-sand-300 text-xs">No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleSponsored(s.id, s.sponsored)}
                        className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                          s.sponsored
                            ? 'text-red-600 border-red-200 hover:bg-red-50'
                            : 'text-forest-600 border-forest-200 hover:bg-forest-50'
                        }`}>
                        {s.sponsored ? 'Remove Sponsored' : 'Add Sponsored'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {suppliers.length === 0 && <div className="text-center py-12 text-sand-400">No suppliers yet.</div>}
          </div>
        ) : (
          <div className="space-y-4">
            {requests.length === 0 && <div className="text-center py-12 text-sand-400">No requests yet.</div>}
            {requests.map(req => (
              <div key={req.id} className="card p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="font-medium text-forest-900">{req.companyName}</div>
                  <div className="text-sm text-sand-400">{req.email} · {new Date(req.requestedAt).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    req.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                    req.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                    'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {req.status}
                  </span>
                  {req.status === 'pending' && (
                    <>
                      <button onClick={() => handleRequest(req.id, req.id, true)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition-colors">
                        <Check size={12} /> Approve
                      </button>
                      <button onClick={() => handleRequest(req.id, req.id, false)}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors">
                        <X size={12} /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}