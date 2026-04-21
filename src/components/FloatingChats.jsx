import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, onSnapshot, query, orderBy, doc, getDoc, setDoc, getDocs, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { MessageCircle, X, Minus, Maximize2, Send, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'

// Individual chat window
function ChatWindow({ chatId, supplierId, supplierName, supplierInitial, onClose, onMinimize, minimized }) {
  const { user, userProfile } = useAuth()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()
  const inputRef = useRef()

  useEffect(() => {
    const q = query(collection(db, 'messages', chatId, 'msgs'), orderBy('createdAt'))
    return onSnapshot(q, snap => setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
  }, [chatId])

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, minimized])

  useEffect(() => {
    if (!minimized) setTimeout(() => inputRef.current?.focus(), 100)
  }, [minimized])

  async function send(e) {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const msgText = text.trim()
    setText('')
    try {
      await setDoc(doc(db, 'chats', chatId), { participants: [user.uid, supplierId], updatedAt: new Date().toISOString() }, { merge: true })
      await addDoc(collection(db, 'messages', chatId, 'msgs'), {
        text: msgText, senderId: user.uid,
        senderName: userProfile?.displayName || 'User',
        createdAt: new Date().toISOString(),
      })
    } catch(e) { setText(msgText) }
    setSending(false)
    inputRef.current?.focus()
  }

  if (minimized) return null

  return (
    <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl" style={{
      width: '320px', height: '420px',
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      border: '1px solid rgba(0,0,0,0.1)',
    }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ background: 'rgba(229,20,20,1)' }}>
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {supplierInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-white font-semibold text-sm truncate font-body">{supplierName}</div>
          <div className="text-red-200 text-xs font-body">Supplier</div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onMinimize} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Minus size={14}/>
          </button>
          <Link to={`/chat/${supplierId}`} onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <Maximize2 size={13}/>
          </Link>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all">
            <X size={14}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-xs text-gray-400 font-body">Start a conversation with {supplierName}</p>
          </div>
        )}
        {messages.map(msg => {
          const isMe = msg.senderId === user?.uid
          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm font-body leading-relaxed ${
                isMe
                  ? 'text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
                style={isMe ? { background: '#e51414' } : {}}>
                {msg.text}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <form onSubmit={send} className="flex items-center gap-2 px-3 py-2.5 shrink-0" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <input ref={inputRef} value={text} onChange={e => setText(e.target.value)}
          className="flex-1 text-sm px-3 py-2 rounded-xl font-body outline-none"
          style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)' }}
          placeholder="Message..." disabled={sending}/>
        <button type="submit" disabled={!text.trim() || sending}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
          style={{ background: '#e51414' }}>
          <Send size={13}/>
        </button>
      </form>
    </div>
  )
}

// The main floating chat manager
export default function FloatingChats() {
  const { user } = useAuth()
  const [recentChats, setRecentChats] = useState([]) // [{supplierId, supplierName, chatId, unread}]
  const [openWindows, setOpenWindows] = useState([]) // [{supplierId, supplierName, chatId, minimized}]
  const [hubOpen, setHubOpen] = useState(false)
  const [supplierCache, setSupplierCache] = useState({})

  useEffect(() => {
    if (!user) return
    // Listen for chats this user is in
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.uid))
    return onSnapshot(q, async snap => {
      const chats = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => new Date(b.updatedAt||0) - new Date(a.updatedAt||0))
        .slice(0, 10)

      // Get supplier info for each
      const results = await Promise.all(chats.map(async chat => {
        const otherId = chat.participants?.find(p => p !== user.uid)
        if (!otherId) return null
        if (supplierCache[otherId]) return { chatId: chat.id, supplierId: otherId, supplierName: supplierCache[otherId] }
        try {
          const snap = await getDoc(doc(db, 'suppliers', otherId))
          const name = snap.exists() ? (snap.data().companyName || 'Supplier') : 'Supplier'
          setSupplierCache(c => ({ ...c, [otherId]: name }))
          return { chatId: chat.id, supplierId: otherId, supplierName: name }
        } catch { return { chatId: chat.id, supplierId: otherId, supplierName: 'Supplier' } }
      }))
      setRecentChats(results.filter(Boolean))
    })
  }, [user])

  function openChat(supplierId, supplierName, chatId) {
    setHubOpen(false)
    setOpenWindows(prev => {
      const exists = prev.find(w => w.supplierId === supplierId)
      if (exists) return prev.map(w => w.supplierId === supplierId ? { ...w, minimized: false } : w)
      // Max 3 open windows
      const trimmed = prev.length >= 3 ? prev.slice(1) : prev
      return [...trimmed, { supplierId, supplierName, chatId: chatId || [user.uid, supplierId].sort().join('_'), minimized: false }]
    })
  }

  function closeWindow(supplierId) {
    setOpenWindows(prev => prev.filter(w => w.supplierId !== supplierId))
  }

  function minimizeWindow(supplierId) {
    setOpenWindows(prev => prev.map(w => w.supplierId === supplierId ? { ...w, minimized: !w.minimized } : w))
  }

  if (!user) return null

  const activeWindows = openWindows.filter(w => !w.minimized)
  const minimizedWindows = openWindows.filter(w => w.minimized)

  return (
    <>
      {/* Chat windows — bottom right, stacked horizontally */}
      <div className="fixed bottom-4 right-4 z-50 flex items-end gap-3 pointer-events-none">
        {/* Open windows */}
        {activeWindows.map((win, i) => (
          <div key={win.supplierId} className="pointer-events-auto">
            <ChatWindow
              chatId={win.chatId}
              supplierId={win.supplierId}
              supplierName={win.supplierName}
              supplierInitial={(win.supplierName||'S')[0].toUpperCase()}
              onClose={() => closeWindow(win.supplierId)}
              onMinimize={() => minimizeWindow(win.supplierId)}
              minimized={false}
            />
          </div>
        ))}

        {/* Minimized bubbles + hub button */}
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          {/* Minimized chat bubbles */}
          {minimizedWindows.map(win => (
            <button key={win.supplierId} onClick={() => minimizeWindow(win.supplierId)}
              className="relative w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-white font-bold text-sm transition-all hover:scale-110"
              style={{ background: '#e51414', border: '2px solid white' }}
              title={win.supplierName}>
              {(win.supplierName||'S')[0].toUpperCase()}
            </button>
          ))}

          {/* Main hub bubble */}
          <div className="relative">
            <button onClick={() => setHubOpen(!hubOpen)}
              className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 ${hubOpen ? 'rotate-0' : ''}`}
              style={{ background: 'linear-gradient(135deg, #e51414, #c00d0d)', boxShadow: '0 8px 24px rgba(229,20,20,0.4)' }}>
              {hubOpen ? <X size={22}/> : <MessageCircle size={22}/>}
            </button>
            {recentChats.length > 0 && !hubOpen && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gray-900 text-white text-xs font-bold rounded-full flex items-center justify-center" style={{ fontSize: '10px' }}>
                {Math.min(recentChats.length, 9)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hub panel — list of recent chats */}
      {hubOpen && (
        <div className="fixed bottom-24 right-4 z-50 rounded-2xl overflow-hidden shadow-2xl"
          style={{ width: '280px', background: 'rgba(255,255,255,0.97)', backdropFilter: 'blur(30px)', WebkitBackdropFilter: 'blur(30px)', border: '1px solid rgba(0,0,0,0.1)', maxHeight: '400px' }}>
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
            <span className="font-display font-bold text-gray-900 text-sm" style={{ letterSpacing: '-0.02em' }}>Chats</span>
            <Link to="/chats" onClick={() => setHubOpen(false)} className="text-xs text-brand-600 font-semibold font-body hover:underline">See all</Link>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: '320px' }}>
            {recentChats.length === 0 ? (
              <div className="text-center py-10 px-4">
                <div className="text-3xl mb-2">💬</div>
                <p className="text-xs text-gray-400 font-body">No chats yet. Visit a supplier to start chatting.</p>
              </div>
            ) : (
              recentChats.map(chat => (
                <button key={chat.supplierId} onClick={() => openChat(chat.supplierId, chat.supplierName, chat.chatId)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ background: '#e51414' }}>
                    {(chat.supplierName||'S')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-sm font-body truncate">{chat.supplierName}</div>
                    <div className="text-xs text-gray-400 font-body">Tap to open chat</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}
