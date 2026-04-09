import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { X, ShoppingBag, Trash2, Plus, Minus, MessageCircle, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { convertFromBDT, convertFromBDTRaw, getCurrencyForCountry } from '../utils/currency'

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQty, clearCart, getTotalInCountry } = useCart()
  const { user } = useAuth()
  const { country } = useCountry()
  const curr = getCurrencyForCountry(country)
  const { total, symbol } = getTotalInCountry(country)

  if (!isOpen) return null

  // Group by supplier for display
  const bySupplier = {}
  items.forEach(i => {
    if (!bySupplier[i.supplierId]) bySupplier[i.supplierId] = { name: i.supplierName, id: i.supplierId, items: [] }
    bySupplier[i.supplierId].items.push(i)
  })

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

        <div className="px-4 pt-3">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-500 font-body flex items-center gap-2">
            🌍 Prices in <strong>{curr.code}</strong> · {country}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <ShoppingBag size={52} className="text-gray-100 mb-4" />
            <p className="font-display text-xl font-black text-gray-700 uppercase mb-1">Cart is empty</p>
            <p className="text-gray-400 text-sm font-body">Select items from product listings</p>
          </div>
        ) : (
          <>
            <div className="mx-4 mt-3 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex gap-2 items-start">
              <AlertCircle size={14} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-body">Prices converted from BDT. Confirm final pricing with supplier via chat.</p>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {Object.values(bySupplier).map(sup => (
                <div key={sup.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase font-body">{sup.name}</span>
                    {user && (
                      <Link to={`/chat/${sup.id}`} onClick={() => setIsOpen(false)}
                        className="text-xs text-brand-600 font-bold hover:text-brand-800 flex items-center gap-1 font-body">
                        <MessageCircle size={11} /> Chat
                      </Link>
                    )}
                  </div>
                  <div className="space-y-2">
                    {sup.items.map(cartItem => {
                      const bdtPrice = parseFloat(cartItem.item.price) || 0
                      const lineTotal = convertFromBDTRaw(bdtPrice * cartItem.qty, country)
                      const unitPrice = convertFromBDT(bdtPrice, country)
                      return (
                        <div key={cartItem.key} className="card p-3">
                          <div className="flex gap-3 mb-2">
                            {cartItem.item.imageUrl
                              ? <img src={cartItem.item.imageUrl} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" onError={e => e.target.style.display='none'} />
                              : <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center text-xl shrink-0">📦</div>
                            }
                            <div className="flex-1 min-w-0">
                              <div className="font-display font-black text-gray-900 text-xs uppercase leading-tight truncate">{cartItem.item.name}</div>
                              <div className="text-xs text-gray-400 font-body truncate">{cartItem.postTitle}</div>
                              {(cartItem.size || cartItem.color) && (
                                <div className="flex gap-2 mt-0.5">
                                  {cartItem.size && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-body">{cartItem.size}</span>}
                                  {cartItem.color && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-body">{cartItem.color}</span>}
                                </div>
                              )}
                              <div className="text-xs text-brand-600 font-bold font-body mt-0.5">{unitPrice}/pc</div>
                            </div>
                            <button onClick={() => removeItem(cartItem.key)} className="text-gray-200 hover:text-red-400 transition-colors shrink-0">
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                              <button onClick={() => updateQty(cartItem.key, cartItem.qty - 1)} className="px-2 py-1 hover:bg-gray-50 text-gray-500 transition-colors">
                                <Minus size={12} />
                              </button>
                              <span className="text-sm font-black px-2 text-gray-900">{cartItem.qty}</span>
                              <button onClick={() => updateQty(cartItem.key, cartItem.qty + 1)} className="px-2 py-1 hover:bg-gray-50 text-gray-500 transition-colors">
                                <Plus size={12} />
                              </button>
                            </div>
                            <div className="font-display font-black text-gray-900">
                              {curr.symbol}{lineTotal >= 1 ? lineTotal.toFixed(2) : lineTotal.toFixed(4)}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-4 border-t border-gray-100 bg-white">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-500 font-body text-sm">Estimated Total ({curr.code})</span>
                <span className="font-display font-black text-2xl text-gray-900">
                  {symbol}{total >= 1 ? total.toFixed(2) : total.toFixed(4)}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-body mb-3 text-center">Chat each supplier to confirm order & shipping</p>
              {!user ? (
                <Link to="/auth" onClick={() => setIsOpen(false)} className="btn-primary w-full justify-center py-3">Login to Order</Link>
              ) : (
                <Link to="/order-confirm" onClick={() => setIsOpen(false)}
                  className="btn-primary w-full justify-center py-3">
                  Confirm Order →
                </Link>
              )}
              <button onClick={clearCart} className="w-full text-xs text-gray-300 hover:text-red-400 transition-colors mt-2 py-1">Clear cart</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}