import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { convertFromBDT, getCurrencyForCountry } from '../utils/currency'
import Navbar from '../components/Navbar'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, ShieldCheck, ExternalLink, MessageCircle, Copy, Check } from 'lucide-react'
import { useState } from 'react'

export default function OrderConfirmation() {
  const { items, getTotalInCountry, clearCart } = useCart()
  const { country } = useCountry()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const curr = getCurrencyForCountry(country)
  const { total, symbol } = getTotalInCountry(country)

  // Group by supplier
  const bySupplier = {}
  items.forEach(i => {
    if (!bySupplier[i.supplierId]) bySupplier[i.supplierId] = { name: i.supplierName, id: i.supplierId, items: [] }
    bySupplier[i.supplierId].items.push(i)
  })
  const supplierList = Object.values(bySupplier)

  function buildOrderSummary() {
    return supplierList.map(sup => {
      const lines = sup.items.map(i => `- ${i.item.name} x${i.qty}${i.size ? ` (${i.size})` : ''}${i.color ? ` [${i.color}]` : ''}: ${convertFromBDT(parseFloat(i.item.price)||0, country)} each`)
      return `Supplier: ${sup.name}\n${lines.join('\n')}`
    }).join('\n\n')
  }

  function copyOrder() {
    navigator.clipboard.writeText(buildOrderSummary())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32 px-4">
          <div className="text-center">
            <div className="text-5xl mb-4">🛒</div>
            <p className="font-display text-2xl font-black text-gray-700 uppercase mb-4">Your cart is empty</p>
            <Link to="/" className="btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">

        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-600 text-sm mb-6 transition-colors font-body">
          <ArrowLeft size={15} /> Back to cart
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-200 text-brand-700 text-xs font-bold px-4 py-2 rounded-full mb-4 font-body uppercase tracking-wide">
            <ShieldCheck size={13} /> Secure Order Process
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-gray-900 uppercase tracking-tight mb-2">
            Confirm Your Order
          </h1>
          <p className="text-gray-400 font-body">Follow these steps to complete your purchase safely</p>
        </div>

        {/* Order summary */}
        <div className="card p-5 mb-6">
          <h2 className="font-display text-lg font-black text-gray-900 uppercase mb-4">Your Order</h2>
          <div className="space-y-4">
            {supplierList.map(sup => (
              <div key={sup.id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase font-body">{sup.name}</span>
                  <Link to={`/chat/${sup.id}`} className="text-xs text-brand-600 font-bold flex items-center gap-1 font-body hover:underline">
                    <MessageCircle size={11}/> Chat supplier
                  </Link>
                </div>
                <div className="space-y-2">
                  {sup.items.map(cartItem => (
                    <div key={cartItem.key} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      {cartItem.item.imageUrl
                        ? <img src={cartItem.item.imageUrl} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>
                        : <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-lg shrink-0">📦</div>
                      }
                      <div className="flex-1 min-w-0">
                        <div className="font-display font-black text-gray-900 uppercase text-sm truncate">{cartItem.item.name}</div>
                        <div className="flex gap-2 text-xs text-gray-400 font-body">
                          <span>Qty: {cartItem.qty}</span>
                          {cartItem.size && <span>· {cartItem.size}</span>}
                          {cartItem.color && <span>· {cartItem.color}</span>}
                        </div>
                      </div>
                      <div className="font-display font-black text-gray-900 text-sm shrink-0">
                        {convertFromBDT(parseFloat(cartItem.item.price)||0, country)}
                        <span className="text-xs font-body text-gray-400">/pc</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
            <span className="text-gray-500 font-body">Estimated Total</span>
            <span className="font-display font-black text-2xl text-gray-900">{symbol}{total.toFixed(2)} <span className="text-sm font-body text-gray-400">{curr.code}</span></span>
          </div>
          <button onClick={copyOrder} className="mt-3 w-full flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-600 transition-colors font-body">
            {copied ? <><Check size={13} className="text-green-500"/> Copied!</> : <><Copy size={13}/> Copy order summary</>}
          </button>
        </div>

        {/* Payment steps */}
        <div className="space-y-4 mb-8">

          {/* Step 1 */}
          <div className="card p-5 border-l-4 border-l-brand-600">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-display font-black text-sm shrink-0">1</div>
              <div className="flex-1">
                <h3 className="font-display font-black text-gray-900 uppercase text-base mb-1">Send Payment via TapTapSend</h3>
                <p className="text-gray-500 text-sm font-body mb-3">
                  Transfer your payment to <strong>S&S Shop</strong> using TapTapSend. We hold the payment securely until your order is confirmed and dispatched.
                </p>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-3">
                  <div className="text-xs text-gray-400 font-body mb-1">Send to</div>
                  <div className="font-display font-black text-gray-900 text-xl">S&S Shop</div>
                  <div className="text-sm text-gray-500 font-body">via TapTapSend international transfer</div>
                </div>
                <a href="https://www.taptapsend.com" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
                  Open TapTapSend <ExternalLink size={14}/>
                </a>
                <p className="text-xs text-gray-400 mt-2 font-body">
                  TapTapSend supports transfers from USA, UK, Europe, Canada, Australia and more.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card p-5 border-l-4 border-l-gray-300">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-display font-black text-sm shrink-0">2</div>
              <div className="flex-1">
                <h3 className="font-display font-black text-gray-900 uppercase text-base mb-1">We Forward to Your Supplier</h3>
                <p className="text-gray-500 text-sm font-body mb-3">
                  Once we receive your payment, S&S Shop forwards the correct amount to your supplier in Bangladesh. This protects you from fraud and ensures the supplier is verified before receiving funds.
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={12} className="text-white"/></div>
                    <span className="text-xs font-bold text-emerald-700 font-body">Buyer protected</span>
                  </div>
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center"><Check size={12} className="text-white"/></div>
                    <span className="text-xs font-bold text-blue-700 font-body">Refunds available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card p-5 border-l-4 border-l-gray-300">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-display font-black text-sm shrink-0">3</div>
              <div className="flex-1">
                <h3 className="font-display font-black text-gray-900 uppercase text-base mb-1">Supplier Ships Your Order</h3>
                <p className="text-gray-500 text-sm font-body mb-3">
                  The supplier receives payment and ships your order. Track your shipment directly with your supplier via chat or WhatsApp.
                </p>
                <div className="flex gap-2 flex-wrap">
                  {supplierList.map(sup => (
                    <Link key={sup.id} to={`/chat/${sup.id}`}
                      className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors font-body">
                      <MessageCircle size={11}/> Chat {sup.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Refund policy */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <h3 className="font-display font-black text-gray-900 uppercase text-sm mb-2">Refund Policy</h3>
          <p className="text-sm text-amber-800 font-body leading-relaxed">
            If your order is not fulfilled or the goods don't match the description, S&S Shop will process a refund via TapTapSend within 5–7 business days. Contact us via chat before accepting any delivery you're unsure about.
          </p>
        </div>

        {/* CTA */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => navigate(-1)} className="btn-secondary flex-1 sm:flex-none justify-center py-3">
            <ArrowLeft size={15}/> Back to Cart
          </button>
          <a href="https://www.taptapsend.com" target="_blank" rel="noreferrer"
            className="btn-primary flex-1 justify-center py-3 text-base font-black">
            Pay via TapTapSend <ExternalLink size={16}/>
          </a>
        </div>

        <p className="text-center text-xs text-gray-300 font-body mt-4">
          ⚠️ S&S Shop facilitates payment and supplier matching. Final order terms are between buyer and supplier.
        </p>
      </div>
    </div>
  )
}
