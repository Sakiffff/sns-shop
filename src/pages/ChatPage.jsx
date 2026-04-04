import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Send, Languages, ArrowLeft, MapPin } from 'lucide-react'

export default function ChatPage() {
  const { supplierId } = useParams()
  const { user, userProfile } = useAuth()
  const [supplier, setSupplier] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [translateEnabled, setTranslateEnabled] = useState(false)
  const bottomRef = useRef()

  const chatId = [user.uid, supplierId].sort().join('_')

  useEffect(() => {
    getDoc(doc(db, 'suppliers', supplierId)).then(snap => {
      if (snap.exists()) setSupplier(snap.data())
    })
  }, [supplierId])

  useEffect(() => {
    const q = query(collection(db, 'messages', chatId, 'msgs'), orderBy('createdAt'))
    return onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [chatId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    if (!text.trim()) return
    const msg = {
      text: text.trim(),
      senderId: user.uid,
      senderName: userProfile?.displayName || 'User',
      senderCountry: userProfile?.country || '',
      senderRole: userProfile?.role || 'buyer',
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'chats', chatId), {
      participants: [user.uid, supplierId],
      updatedAt: new Date().toISOString(),
    }, { merge: true })
    await addDoc(collection(db, 'messages', chatId, 'msgs'), msg)
    setText('')
  }

  async function translateText(txt) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=auto|en`)
      const data = await res.json()
      return data.responseData?.translatedText || txt
    } catch {
      return txt
    }
  }

  async function handleTranslateToggle() {
    if (!translateEnabled) {
      setTranslating(true)
      const updated = await Promise.all(messages.map(async m => ({
        ...m,
        translated: await translateText(m.text)
      })))
      setMessages(updated)
      setTranslating(false)
    }
    setTranslateEnabled(!translateEnabled)
  }

  const isMine = (msg) => msg.senderId === user.uid

  return (
    <div className="min-h-screen bg-sand-50 flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col flex-1">
        {/* Header */}
        <div className="card p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/buyer" className="text-sand-400 hover:text-forest-600 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-10 h-10 bg-forest-50 rounded-full flex items-center justify-center text-xl">🏭</div>
            <div>
              <div className="font-semibold text-forest-900">{supplier?.companyName || 'Loading...'}</div>
              {supplier?.location && (
                <div className="flex items-center gap-1 text-xs text-sand-400">
                  <MapPin size={10} /> {supplier.location}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleTranslateToggle}
            disabled={translating}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-all ${
              translateEnabled ? 'bg-forest-600 text-white border-forest-600' : 'bg-white text-sand-600 border-sand-200 hover:border-forest-300'
            }`}
          >
            <Languages size={14} />
            {translating ? 'Translating...' : translateEnabled ? 'Translated' : 'Translate'}
          </button>
        </div>

        <div className="bg-sand-100 border border-sand-200 rounded-xl p-3 mb-4 text-xs text-sand-500 text-center">
          ⚠️ Transactions and logistics are handled directly between buyers and suppliers.
        </div>

        {/* Messages */}
        <div className="card flex-1 p-4 overflow-y-auto space-y-3 mb-4 min-h-[400px] max-h-[500px]">
          {messages.length === 0 && (
            <div className="text-center text-sand-300 py-16">
              <MessageIcon />
              <p className="mt-3 text-sm">Start a conversation with {supplier?.companyName}</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${isMine(msg) ? 'justify-end' : 'justify-start'} msg-enter`}>
              <div className={`max-w-xs lg:max-w-md ${isMine(msg) ? 'items-end' : 'items-start'} flex flex-col`}>
                {!isMine(msg) && (
                  <div className="text-xs text-sand-400 mb-1 flex items-center gap-1">
                    {msg.senderName}
                    {msg.senderCountry && <span>· 🌍 {msg.senderCountry}</span>}
                  </div>
                )}
                <div className={`px-4 py-2.5 rounded-2xl text-sm ${
                  isMine(msg)
                    ? 'bg-forest-600 text-white rounded-br-sm'
                    : 'bg-white border border-sand-200 text-forest-900 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {translateEnabled && msg.translated && msg.translated !== msg.text && (
                  <div className={`text-xs mt-1 px-3 py-1.5 rounded-xl bg-sand-100 text-sand-500 max-w-xs ${isMine(msg) ? 'text-right' : ''}`}>
                    🌐 {msg.translated}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-3">
          <input
            className="input flex-1"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" className="btn-primary px-4">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}

function MessageIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mx-auto text-sand-300">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}