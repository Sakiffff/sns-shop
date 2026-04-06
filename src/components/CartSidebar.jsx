import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { X, ShoppingBag, Trash2, Plus, Minus, MessageCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { convertFromBDT, convertFromBDTRaw, getCurrencyForCountry } from '../utils/currency'

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeFromCart, updateQty, clearCart, getTotalInCountry } = useCart()
  const { user } = useAuth()
  const { country } = useCountry()
  const curr = getCurrencyForCountry(country)
  const { total, symbol } = getTotalInCountry(country)

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsOpen(false)} />
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-brand-600" />
            <span className="font-display text-xl font-black text-gray-900 uppercase tracking-wide">Order Cart</span>
            {items.length > 0 && (
              <span className="bg-brand-600 text-white text-xs font-black w-5 h-5 rounded-full flex items-center justify-center">{items.length}</span>
            )}
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Country + currency info */}
        <div className="px-4 pt-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-body flex items-center gap-2">
            <span>🌍</span>
            <span>Prices shown in <strong>{curr.code}</strong> for <strong>{country}</strong></span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingBag size={52} className="text-gray-100 mb-4" />
            <p className="font-display text-xl font-black text-gray-700 uppercase mb-1">Cart is empty</p>
            <p className="text-gray-400 text-sm font-body">Browse products and add items to order</p>
          </div>
        ) : (
          <>
            <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-2 items-start">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-body">
                Prices converted from BDT. Final pricing confirmed with supplier via chat.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {items.map(item => {
                const moq = parseInt(item.post.moq) || 1
                const bdtPrice = parseFloat(item.post.price) || 0
                const lineTotal = convertFromBDTRaw(bdtPrice * item.qty * moq, country)
                const unitPrice = convertFromBDT(bdtPrice, country)
                const curr2 = getCurrencyForCountry(country)

                return (
                  <div key={item.post.id} className="card p-4">
                    <div className="flex gap-3 mb-3">
                      {item.post.imageUrl
                        ? <img src={item.post.imageUrl} className="w-14 h-14 rounded-xl object-cover shrink-0" alt="" onError={e => e.target.style.display='none'} />
                        : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">📦</div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-black text-gray-900 text-sm uppercase leading-tight truncate">{item.post.title}</div>
                        <div className="text-xs text-gray-400 font-body truncate">{item.post.supplierName}</div>
                        <div className="text-xs text-brand-600 font-bold mt-0.5 font-body">
                          {unitPrice}/pc · MOQ {moq} pcs
                        </div>
                        <div className="text-xs text-gray-300 font-body">৳{bdtPrice}/pc (BDT)</div>
                      </div>
                      <button onClick={() => removeFromCart(item.post.id)} className="text-gray-200 hover:text-red-400 transition-colors shrink-0">
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 border border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => updateQty(item.post.id, item.qty - 1)} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500 transition-colors">
                          <Minus size={13} />
                        </button>
                        <span className="text-sm font-black px-2 text-gray-900">{item.qty} × {moq}</span>
                        <button onClick={() => updateQty(item.post.id, item.qty + 1)} className="px-3 py-1.5 hover:bg-gray-50 text-gray-500 transition-colors">
                          <Plus size={13} />
                        </button>
                      </div>
                      <div className="font-display font-black text-gray-900 text-base">
                        {curr2.symbol}{lineTotal >= 1 ? lineTotal.toFixed(2) : lineTotal.toFixed(4)}
                      </div>
                    </div>

                    {user && item.post.supplierId && (
                      <Link to={`/chat/${item.post.supplierId}`} onClick={() => setIsOpen(false)}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 transition-colors rounded-xl py-2">
                        <MessageCircle size={12} /> Chat with Supplier
                      </Link>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-500 font-body text-sm">Estimated Total ({curr.code})</span>
                <span className="font-display font-black text-2xl text-gray-900">
                  {symbol}{total >= 1 ? total.toFixed(2) : total.toFixed(4)}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-body mb-3 text-center">
                Chat with each supplier to confirm order & shipping
              </p>
              {!user ? (
                <Link to="/auth" onClick={() => setIsOpen(false)} className="btn-primary w-full justify-center py-3">
                  Login to Order
                </Link>
              ) : (
                <button className="btn-primary w-full justify-center py-3" onClick={() => setIsOpen(false)}>
                  Contact Suppliers to Confirm
                </button>
              )}
              <button onClick={clearCart} className="w-full text-xs text-gray-300 hover:text-red-400 transition-colors mt-2 py-1">
                Clear cart
              </button>
            </div>
          </>
        )}
      </div>
    </>
  )
}