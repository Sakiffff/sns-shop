import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { MessageCircle, ArrowRight } from 'lucide-react'

export default function Chats() {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid))
    return onSnapshot(q, async snap => {
      const chatList = await Promise.all(snap.docs.map(async d => {
        const data = d.data()
        const otherId = data.participants.find(p => p !== user.uid)
        let otherName = 'Unknown'
        try {
          const supplierSnap = await getDoc(doc(db, 'suppliers', otherId))
          if (supplierSnap.exists()) { otherName = supplierSnap.data().companyName; return { id: d.id, ...data, otherId, otherName } }
          const userSnap = await getDoc(doc(db, 'users', otherId))
          if (userSnap.exists()) otherName = userSnap.data().displayName
        } catch {}
        return { id: d.id, ...data, otherId, otherName }
      }))
      setChats(chatList.sort((a,b) => new Date(b.updatedAt||0) - new Date(a.updatedAt||0)))
      setLoading(false)
    })
  }, [user.uid])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight mb-6">Chats</h1>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-body">Loading...</div>
        ) : chats.length === 0 ? (
          <div className="text-center py-24">
            <MessageCircle size={48} className="text-gray-200 mx-auto mb-4" />
            <p className="font-display text-2xl font-black text-gray-700 uppercase mb-2">No conversations yet</p>
            <p className="text-gray-400 text-sm mb-6 font-body">Browse suppliers and start a chat</p>
            <Link to="/" className="btn-primary">Browse Suppliers <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map(chat => (
              <Link key={chat.id} to={`/chat/${chat.otherId}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-xl shrink-0 border border-brand-100">
                  🏭
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold text-gray-900 uppercase text-lg leading-tight">{chat.otherName}</div>
                  <div className="text-xs text-gray-400 font-body">
                    {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : 'No messages yet'}
                  </div>
                </div>
                <MessageCircle size={16} className="text-brand-400 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}