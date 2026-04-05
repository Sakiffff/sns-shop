import { useCart } from '../contexts/CartContext'
import { X, ShoppingBag, Trash2, Plus, Minus, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeFromCart, updateNote, updateQty, clearCart } = useCart()
  const { user } = useAuth()

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setIsOpen(false)} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-600" />
            <span className="font-display text-xl font-bold text-gray-900 uppercase tracking-wide">
              Inquiry Cart
            </span>
            <span className="bg-brand-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {items.length}
            </span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingBag size={48} className="text-gray-200 mb-4" />
            <p className="text-gray-500 font-semibold mb-1">Your cart is empty</p>
            <p className="text-gray-400 text-sm">Add suppliers to send bulk inquiries</p>
          </div>
        ) : (
          <>
            {/* Info banner */}
            <div className="mx-4 mt-4 bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 text-xs text-brand-700">
              💡 This is an <strong>inquiry cart</strong> — you're collecting suppliers to contact, not placing a direct order.
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.map(item => (
                <div key={item.supplier.id} className="card p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {item.supplier.imageUrl
                        ? <img src={item.supplier.imageUrl} className="w-10 h-10 rounded-lg object-cover" alt="" />
                        : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg">🏭</div>
                      }
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">{item.supplier.companyName}</div>
                        <div className="text-xs text-gray-400">{item.supplier.location}</div>
                      </div>
                    </div>
                    <button onClick={() => removeFromCart(item.supplier.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Qty */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-gray-500">Est. Qty:</span>
                    <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                      <button onClick={() => updateQty(item.supplier.id, item.qty - 1)} className="px-2 py-1 hover:bg-gray-50 text-gray-500">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold px-2">{item.qty * (item.supplier.moq || 100)}</span>
                      <button onClick={() => updateQty(item.supplier.id, item.qty + 1)} className="px-2 py-1 hover:bg-gray-50 text-gray-500">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="text-xs text-gray-400">pcs</span>
                  </div>

                  {/* Note */}
                  <textarea
                    className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-brand-400 placeholder-gray-300"
                    rows={2}
                    placeholder="Add a note (e.g. color, size, spec)"
                    value={item.note}
                    onChange={e => updateNote(item.supplier.id, e.target.value)}
                  />

                  {/* Chat link */}
                  {user && (
                    <Link
                      to={`/chat/${item.supplier.id}`}
                      onClick={() => setIsOpen(false)}
                      className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors rounded-lg py-2"
                    >
                      <MessageCircle size={12} /> Chat with Supplier
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-4 py-4 border-t border-gray-100 space-y-3">
              {!user ? (
                <Link to="/auth" onClick={() => setIsOpen(false)} className="btn-primary w-full justify-center">
                  Login to Contact Suppliers
                </Link>
              ) : (
                <div className="text-center text-xs text-gray-400">
                  Chat with each supplier individually to discuss pricing & logistics
                </div>
              )}
              <button onClick={clearCart} className="w-full text-xs text-gray-400 hover:text-red-400 transition-colors">
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}
