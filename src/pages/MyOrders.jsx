import { useState, useEffect } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Link } from 'react-router-dom'
import { Package, Clock, CheckCircle, Truck, ShoppingBag, MessageCircle, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_CONFIG = {
  pending_payment: {
    label: 'Payment Pending Verification',
    sublabel: 'We\'re verifying your Remitly transfer',
    icon: <Clock size={16} className="text-yellow-500"/>,
    color: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    dot: 'bg-yellow-400',
  },
  payment_confirmed: {
    label: 'Payment Confirmed',
    sublabel: 'Moving to delivery queue',
    icon: <CheckCircle size={16} className="text-blue-500"/>,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    dot: 'bg-blue-400',
  },
  in_delivery: {
    label: 'In Delivery Queue',
    sublabel: 'Your order is being prepared for shipment',
    icon: <Truck size={16} className="text-purple-500"/>,
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    dot: 'bg-purple-400',
  },
  shipped: {
    label: 'Shipped',
    sublabel: 'Your order is on its way',
    icon: <Truck size={16} className="text-emerald-500"/>,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    dot: 'bg-emerald-400',
  },
  delivered: {
    label: 'Delivered',
    sublabel: 'Order complete',
    icon: <CheckCircle size={16} className="text-emerald-600"/>,
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    dot: 'bg-emerald-500',
  },
}

function OrderCard({ order }) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment
  const date = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start gap-3">
        <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${status.dot} ${order.status === 'pending_payment' ? 'animate-pulse' : ''}`}/>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="font-display font-black text-gray-900 uppercase text-sm">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </div>
              <div className="text-xs text-gray-400 font-body">{date}</div>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold font-body ${status.color}`}>
              {status.icon} {status.label}
            </div>
          </div>
          <p className="text-xs text-gray-400 font-body mt-1">{status.sublabel}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 pb-3 flex items-center justify-between border-t border-gray-50 pt-3">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {(order.items || []).slice(0, 3).map((item, i) => (
              <div key={i} className="w-8 h-8 rounded-lg border-2 border-white bg-gray-100 overflow-hidden shrink-0">
                {item.itemImage
                  ? <img src={item.itemImage} className="w-full h-full object-cover" alt="" onError={e=>e.target.style.display='none'}/>
                  : <div className="w-full h-full flex items-center justify-center text-xs">📦</div>
                }
              </div>
            ))}
            {(order.items || []).length > 3 && (
              <div className="w-8 h-8 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                +{order.items.length - 3}
              </div>
            )}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-700 font-body">
              {order.currencySymbol || '$'}{(order.totalAmount || 0).toFixed(2)} {order.currency}
            </div>
            <div className="text-xs text-gray-400 font-body">{(order.items||[]).length} items</div>
          </div>
        </div>
        <button onClick={() => setExpanded(!expanded)} className="text-xs text-brand-600 font-bold flex items-center gap-1 font-body hover:text-brand-800">
          {expanded ? <><ChevronUp size={13}/> Less</> : <><ChevronDown size={13}/> Details</>}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-3">
          {/* Items */}
          <div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Items Ordered</div>
            <div className="space-y-2">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-200">
                  {item.itemImage
                    ? <img src={item.itemImage} className="w-9 h-9 rounded-lg object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>
                    : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-base">📦</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="font-display font-black text-gray-900 uppercase text-xs truncate">{item.itemName}</div>
                    <div className="text-xs text-gray-400 font-body">
                      {item.supplierName} · Qty {item.qty}
                      {item.size && ` · ${item.size}`}
                      {item.color && ` · ${item.color}`}
                    </div>
                  </div>
                  <Link to={`/chat/${item.supplierId}`} className="text-brand-600 hover:text-brand-800 shrink-0 p-1">
                    <MessageCircle size={14}/>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Payment info */}
          <div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Payment Reference</div>
            <div className="bg-white rounded-xl p-3 border border-gray-200">
              <div className="text-xs text-gray-400 font-body">Remitly Reference</div>
              <div className="font-mono font-black text-gray-800">{order.remitlyRef}</div>
              {order.notes && (
                <>
                  <div className="text-xs text-gray-400 font-body mt-2">Notes</div>
                  <div className="text-sm text-gray-600 font-body">{order.notes}</div>
                </>
              )}
            </div>
          </div>

          {/* Status timeline */}
          <div>
            <div className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Order Timeline</div>
            <div className="space-y-2">
              {[
                { s: 'pending_payment', label: 'Order submitted' },
                { s: 'payment_confirmed', label: 'Payment confirmed by S&S Shop' },
                { s: 'in_delivery', label: 'Moved to delivery queue' },
                { s: 'shipped', label: 'Shipped by supplier' },
                { s: 'delivered', label: 'Delivered' },
              ].map((step, i) => {
                const statuses = ['pending_payment','payment_confirmed','in_delivery','shipped','delivered']
                const currentIdx = statuses.indexOf(order.status)
                const stepIdx = statuses.indexOf(step.s)
                const isDone = stepIdx <= currentIdx
                const isCurrent = step.s === order.status
                return (
                  <div key={step.s} className="flex items-center gap-2.5">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isDone ? 'bg-brand-600' : 'bg-gray-200'} ${isCurrent ? 'ring-2 ring-brand-300' : ''}`}/>
                    <span className={`text-xs font-body ${isDone ? 'text-gray-700 font-semibold' : 'text-gray-300'}`}>{step.label}</span>
                    {isCurrent && order.updatedAt && (
                      <span className="text-xs text-gray-300 font-body ml-auto">
                        {new Date(order.updatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MyOrders() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'orders'), where('buyerId', '==', user.uid))
    const unsub = onSnapshot(q, snap => {
      setOrders(snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => new Date(b.createdAt||0) - new Date(a.createdAt||0)))
      setLoading(false)
    })
    return unsub
  }, [user.uid])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-display text-4xl font-black text-gray-900 uppercase tracking-tight mb-2">My Orders</h1>
        <p className="text-gray-400 font-body text-sm mb-8">Track your orders and payment status in real time</p>

        {loading ? (
          <div className="text-center py-20 text-gray-400 font-body">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-24 card p-10">
            <ShoppingBag size={48} className="text-gray-200 mx-auto mb-4"/>
            <p className="font-display text-2xl font-black text-gray-700 uppercase mb-2">No orders yet</p>
            <p className="text-gray-400 text-sm font-body mb-6">Browse products and place your first order</p>
            <Link to="/" className="btn-primary">Browse Products</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(order => <OrderCard key={order.id} order={order}/>)}
          </div>
        )}
      </div>
    </div>
  )
}
