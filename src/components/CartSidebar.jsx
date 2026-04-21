import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { X, ShoppingBag, Trash2, Plus, Minus, MessageCircle, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { convertFromBDT, convertFromBDTRaw, getCurrencyForCountry } from '../utils/currency'

export default function CartSidebar() {
  const { items, isOpen, setIsOpen, removeItem, updateQty, clearCart, getTotalInCountry } = useCart()
  const { user } = useAuth()
  const { country } = useCountry()
  const curr = getCurrencyForCountry(country)
  const { total, symbol } = getTotalInCountry(country)

  const bySupplier = {}
  items.forEach(i => {
    if (!bySupplier[i.supplierId]) bySupplier[i.supplierId] = { name: i.supplierName, id: i.supplierId, items: [] }
    bySupplier[i.supplierId].items.push(i)
  })

  return (
    <>
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ background: isOpen ? 'rgba(0,0,0,0.2)' : 'transparent', backdropFilter: isOpen ? 'blur(6px)' : 'none', WebkitBackdropFilter: isOpen ? 'blur(6px)' : 'none' }}
        onClick={() => setIsOpen(false)}
      />
      <div
        className={`fixed right-0 top-0 h-full z-50 flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: '400px', maxWidth: '100vw', background: 'rgba(252,252,252,0.95)', backdropFilter: 'blur(40px) saturate(200%)', WebkitBackdropFilter: 'blur(40px) saturate(200%)', borderLeft: '1px solid rgba(0,0,0,0.08)', boxShadow: '-24px 0 80px rgba(0,0,0,0.12)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand-600 flex items-center justify-center shadow-sm">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <div>
              <div className="font-display font-bold text-gray-900 text-sm leading-tight" style={{ letterSpacing: '-0.02em' }}>Order Cart</div>
              <div className="text-xs text-gray-400 font-body">
                {items.length === 0 ? 'Nothing added yet' : `${items.reduce((s,i)=>s+i.qty,0)} item${items.reduce((s,i)=>s+i.qty,0)!==1?'s':''} · ${curr.code}`}
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all"
            style={{ background: 'rgba(0,0,0,0.05)' }}>
            <X size={16} />
          </button>
        </div>

        {/* Currency row */}
        <div className="px-5 pt-3 pb-1">
          <div className="flex items-center gap-2 text-xs font-body text-gray-500">
            <span className="text-base">🌍</span>
            Showing prices in <strong className="text-gray-700 font-semibold">{curr.code}</strong>
            <span className="text-gray-300">·</span>
            <span>{country}</span>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)' }}>
              <ShoppingBag size={32} className="text-gray-200" />
            </div>
            <p className="font-display font-bold text-gray-800 text-lg mb-1.5" style={{ letterSpacing: '-0.02em' }}>Your cart is empty</p>
            <p className="text-gray-400 text-sm font-body leading-relaxed">Browse products and select items to add them here</p>
            <button onClick={() => setIsOpen(false)} className="mt-5 btn-primary text-sm">Browse Products</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              {Object.values(bySupplier).map(sup => (
                <div key={sup.id}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest font-body">{sup.name}</span>
                    {user && (
                      <Link to={`/chat/${sup.id}`} onClick={() => setIsOpen(false)}
                        className="flex items-center gap-1 text-xs text-brand-600 font-bold hover:text-brand-800 font-body">
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
                        <div key={cartItem.key} className="rounded-2xl p-3 flex gap-3 group"
                          style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                          {cartItem.item.imageUrl
                            ? <img src={cartItem.item.imageUrl} className="w-14 h-14 rounded-xl object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'} />
                            : <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl shrink-0">📦</div>
                          }
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-bold text-gray-900 text-xs leading-snug truncate" style={{ letterSpacing: '-0.01em' }}>{cartItem.item.name}</div>
                            <div className="text-xs text-gray-400 font-body truncate mt-0.5">{cartItem.postTitle}</div>
                            {(cartItem.size || cartItem.color) && (
                              <div className="flex gap-1.5 mt-1">
                                {cartItem.size && <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium text-gray-500" style={{ background: 'rgba(0,0,0,0.05)' }}>{cartItem.size}</span>}
                                {cartItem.color && <span className="text-xs px-2 py-0.5 rounded-full font-body font-medium text-gray-500" style={{ background: 'rgba(0,0,0,0.05)' }}>{cartItem.color}</span>}
                              </div>
                            )}
                            <div className="text-xs text-brand-600 font-semibold font-body mt-1">{unitPrice}/pc</div>
                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.1)' }}>
                                <button onClick={() => updateQty(cartItem.key, cartItem.qty - 1)}
                                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-black/5 transition-colors">
                                  <Minus size={11} />
                                </button>
                                <span className="text-sm font-bold px-2 text-gray-900 w-8 text-center font-body">{cartItem.qty}</span>
                                <button onClick={() => updateQty(cartItem.key, cartItem.qty + 1)}
                                  className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-black/5 transition-colors">
                                  <Plus size={11} />
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-gray-900 text-sm" style={{ letterSpacing: '-0.02em' }}>
                                  {curr.symbol}{lineTotal >= 1 ? lineTotal.toFixed(2) : lineTotal.toFixed(4)}
                                </span>
                                <button onClick={() => removeItem(cartItem.key)}
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 pt-4" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-sm text-gray-500 font-body">Estimated Total</span>
                <div>
                  <span className="font-display font-black text-2xl text-gray-900" style={{ letterSpacing: '-0.03em' }}>
                    {symbol}{total >= 1 ? total.toFixed(2) : total.toFixed(4)}
                  </span>
                  <span className="text-xs text-gray-400 font-body ml-1">{curr.code}</span>
                </div>
              </div>
              {!user ? (
                <Link to="/auth" onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold text-sm transition-all text-white"
                  style={{ background: 'linear-gradient(135deg, #e51414, #c00d0d)', boxShadow: '0 4px 16px rgba(229,20,20,0.3)', letterSpacing: '-0.01em' }}>
                  Login to Order
                </Link>
              ) : (
                <Link to="/order-confirm" onClick={() => setIsOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-display font-bold text-sm transition-all text-white"
                  style={{ background: 'linear-gradient(135deg, #e51414, #c00d0d)', boxShadow: '0 4px 16px rgba(229,20,20,0.3)', letterSpacing: '-0.01em' }}>
                  Confirm Order <ChevronRight size={15} />
                </Link>
              )}
              <button onClick={clearCart} className="w-full text-xs text-gray-300 hover:text-red-400 transition-colors mt-2 py-1 font-body">Clear cart</button>
            </div>
          </>
        )}
      </div>
    </>
  )
}