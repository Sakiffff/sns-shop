import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { MessageCircle } from 'lucide-react'

export default function Chats() {
  const { user } = useAuth()
  const [chats, setChats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid))
    return onSnapshot(q, async snap => {
      const chatList = await Promise.all(snap.docs.map(async d => {
        const data = d.data()
        // Get the other participant's info
        const otherId = data.participants.find(p => p !== user.uid)
        let otherName = 'Unknown'
        let companyName = null
        try {
          const supplierSnap = await getDoc(doc(db, 'suppliers', otherId))
          if (supplierSnap.exists()) companyName = supplierSnap.data().companyName
          const userSnap = await getDoc(doc(db, 'users', otherId))
          if (userSnap.exists()) otherName = userSnap.data().displayName
        } catch {}
        return { id: d.id, ...data, otherId, otherName: companyName || otherName }
      }))
      setChats(chatList.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)))
      setLoading(false)
    })
  }, [user.uid])

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold text-forest-950 mb-6">Chats</h1>

        {loading ? (
          <div className="text-center py-20 text-sand-400">Loading...</div>
        ) : chats.length === 0 ? (
          <div className="text-center py-24">
            <MessageCircle size={48} className="text-sand-300 mx-auto mb-4" />
            <p className="text-sand-500 text-lg mb-2">No conversations yet</p>
            <p className="text-sand-400 text-sm mb-6">Browse suppliers and start a chat</p>
            <Link to="/" className="btn-primary">Browse Suppliers</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map(chat => (
              <Link
                key={chat.id}
                to={`/chat/${chat.otherId}`}
                className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-forest-50 rounded-full flex items-center justify-center text-xl shrink-0">
                  🏭
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-forest-900">{chat.otherName}</div>
                  <div className="text-xs text-sand-400 truncate">
                    {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : ''}
                  </div>
                </div>
                <MessageCircle size={16} className="text-sand-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}