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
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()

  const chatId = [user.uid, supplierId].sort().join('_')

  useEffect(() => {
    getDoc(doc(db, 'suppliers', supplierId)).then(snap => {
      if (snap.exists()) setSupplier(snap.data())
    }).catch(() => {})
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
    if (!text.trim() || sending) return
    setSending(true)
    const msgText = text.trim()
    setText('')
    try {
      const msg = {
        text: msgText,
        senderId: user.uid,
        senderName: userProfile?.displayName || 'User',
        senderCountry: userProfile?.country || '',
        createdAt: new Date().toISOString(),
      }
      await setDoc(doc(db, 'chats', chatId), {
        participants: [user.uid, supplierId],
        updatedAt: new Date().toISOString(),
      }, { merge: true })
      await addDoc(collection(db, 'messages', chatId, 'msgs'), msg)
    } catch (e) {
      console.error('send error', e)
      setText(msgText) // restore on failure
    }
    setSending(false)
    inputRef.current?.focus()
  }

  async function translateText(txt) {
    try {
      const res = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(txt)}&langpair=auto|en`)
      const data = await res.json()
      return data.responseData?.translatedText || txt
    } catch { return txt }
  }

  async function handleTranslateToggle() {
    if (!translateEnabled) {
      setTranslating(true)
      const updated = await Promise.all(messages.map(async m => ({
        ...m, translated: await translateText(m.text)
      })))
      setMessages(updated)
      setTranslating(false)
    }
    setTranslateEnabled(!translateEnabled)
  }

  const isMine = (msg) => msg.senderId === user.uid

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col flex-1">

        {/* Header */}
        <div className="card p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/chats" className="text-gray-400 hover:text-brand-600 transition-colors p-1">
              <ArrowLeft size={18} />
            </Link>
            <div className="w-10 h-10 bg-brand-50 rounded-2xl flex items-center justify-center text-xl border border-brand-100">
              🏭
            </div>
            <div>
              <div className="font-display font-black text-gray-900 uppercase text-lg leading-tight">
                {supplier?.companyName || 'Loading...'}
              </div>
              {supplier?.location && (
                <div className="flex items-center gap-1 text-xs text-gray-400 font-body">
                  <MapPin size={10} /> {supplier.location}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleTranslateToggle}
            disabled={translating}
            className={`flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl border font-bold transition-all font-body ${
              translateEnabled
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'
            }`}
          >
            <Languages size={14} />
            {translating ? 'Translating...' : translateEnabled ? 'Translated' : 'Translate'}
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700 text-center font-body">
          ⚠️ Transactions & logistics are handled directly between buyers and suppliers.
        </div>

        {/* Messages */}
        <div className="card flex-1 p-4 overflow-y-auto space-y-3 mb-4 min-h-[400px] max-h-[500px]">
          {messages.length === 0 && (
            <div className="text-center text-gray-300 py-16">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm font-body">Start a conversation with {supplier?.companyName || 'this supplier'}</p>
            </div>
          )}
          {messages.map(msg => (
            <div key={msg.id} className={`flex ${isMine(msg) ? 'justify-end' : 'justify-start'} msg-enter`}>
              <div className={`flex flex-col max-w-xs lg:max-w-md ${isMine(msg) ? 'items-end' : 'items-start'}`}>
                {!isMine(msg) && (
                  <div className="text-xs text-gray-400 mb-1 font-body px-1">
                    {msg.senderName}
                    {msg.senderCountry && <span className="text-gray-300"> · {msg.senderCountry}</span>}
                  </div>
                )}
                {/* BUBBLE — fixed colors */}
                <div className={`px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                  isMine(msg)
                    ? 'bg-brand-600 text-white rounded-br-sm'
                    : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                }`}>
                  {msg.text}
                </div>
                {translateEnabled && msg.translated && msg.translated !== msg.text && (
                  <div className={`text-xs mt-1 px-3 py-1.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 max-w-xs font-body ${isMine(msg) ? 'text-right' : ''}`}>
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
            ref={inputRef}
            className="input flex-1"
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
          />
          <button type="submit" disabled={!text.trim() || sending} className="btn-primary px-4 disabled:opacity-50">
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  )
}