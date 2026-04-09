import { useState } from 'react'
import { useCart } from '../contexts/CartContext'
import { useCountry } from '../contexts/CountryContext'
import { useAuth } from '../contexts/AuthContext'
import { convertFromBDT, getCurrencyForCountry, convertFromBDTRaw } from '../utils/currency'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../firebase'
import Navbar from '../components/Navbar'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, CheckCircle, Copy, Check, ShieldCheck, Clock, Package } from 'lucide-react'

const STEPS = ['Review Order', 'Pay via Remitly', 'Confirm Payment']

export default function OrderConfirmation() {
  const { items, getTotalInCountry, clearCart } = useCart()
  const { country } = useCountry()
  const { user, userProfile } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [remitlyRef, setRemitlyRef] = useState('')
  const [senderName, setSenderName] = useState(userProfile?.displayName || '')
  const [senderEmail, setSenderEmail] = useState(user?.email || '')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [orderId, setOrderId] = useState(null)
  const [copied, setCopied] = useState(false)

  const curr = getCurrencyForCountry(country)
  const { total, symbol } = getTotalInCountry(country)

  // Group by supplier
  const bySupplier = {}
  items.forEach(i => {
    if (!bySupplier[i.supplierId]) bySupplier[i.supplierId] = { name: i.supplierName, id: i.supplierId, items: [] }
    bySupplier[i.supplierId].items.push(i)
  })
  const supplierList = Object.values(bySupplier)

  function buildOrderItems() {
    return items.map(i => ({
      postId: i.postId,
      postTitle: i.postTitle,
      itemId: i.item.id,
      itemName: i.item.name,
      itemImage: i.item.imageUrl || '',
      supplierId: i.supplierId,
      supplierName: i.supplierName,
      qty: i.qty,
      size: i.size || '',
      color: i.color || '',
      priceBDT: parseFloat(i.item.price) || 0,
      priceConverted: convertFromBDTRaw(parseFloat(i.item.price) || 0, country),
      currency: curr.code,
    }))
  }

  function copyRecipient() {
    navigator.clipboard.writeText('S&S Shop — snsshop.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function submitOrder() {
    if (!remitlyRef.trim()) { setSubmitError('Please enter your Remitly reference number'); return }
    if (!senderName.trim()) { setSubmitError('Please enter your full name'); return }
    setSubmitting(true); setSubmitError('')

    try {
      const orderData = {
        // Buyer info
        buyerId: user.uid,
        buyerName: senderName.trim(),
        buyerEmail: senderEmail.trim(),
        buyerCountry: country,

        // Payment info
        remitlyRef: remitlyRef.trim(),
        totalAmount: total,
        totalBDT: items.reduce((s, i) => s + (parseFloat(i.item.price)||0) * i.qty, 0),
        currency: curr.code,
        currencySymbol: curr.symbol,

        // Order items
        items: buildOrderItems(),
        suppliers: supplierList.map(s => ({ id: s.id, name: s.name })),

        // Notes
        notes: notes.trim(),

        // Status
        status: 'pending_payment',  // → 'payment_confirmed' → 'in_delivery' → 'delivered'
        statusLabel: 'Payment Pending Verification',

        // Timestamps
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const ref = await addDoc(collection(db, 'orders'), orderData)
      setOrderId(ref.id)
      clearCart()
      setStep(3) // success step
    } catch(e) {
      console.error(e)
      setSubmitError('Failed to submit: ' + e.message)
    }
    setSubmitting(false)
  }

  if (items.length === 0 && step !== 3) {
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

  // ── SUCCESS STATE ──
  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h1 className="font-display text-4xl font-black text-gray-900 uppercase mb-3">Order Submitted!</h1>
          <p className="text-gray-500 font-body mb-2">
            Your payment reference has been received. Our team will verify your Remitly transfer and confirm your order within <strong>1–3 hours</strong>.
          </p>
          {orderId && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 inline-block my-4">
              <div className="text-xs text-gray-400 font-body mb-0.5">Order Reference</div>
              <div className="font-mono font-black text-gray-800 text-sm">{orderId.slice(0, 12).toUpperCase()}</div>
            </div>
          )}
          <div className="space-y-3 text-left mb-8 mt-4">
            {[
              { icon: <Clock size={16} className="text-yellow-500"/>, text: 'Status: Payment pending verification' },
              { icon: <CheckCircle size={16} className="text-blue-500"/>, text: 'You\'ll be notified once payment is confirmed' },
              { icon: <Package size={16} className="text-emerald-500"/>, text: 'After confirmation, order moves to delivery' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
                {item.icon}
                <span className="text-sm text-gray-600 font-body">{item.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/my-orders" className="btn-primary">View My Orders</Link>
            <Link to="/" className="btn-secondary">Continue Browsing</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <button onClick={() => step === 0 ? navigate(-1) : setStep(s => s - 1)}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-600 text-sm mb-6 transition-colors font-body">
          <ArrowLeft size={15} /> {step === 0 ? 'Back to cart' : 'Back'}
        </button>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold font-body transition-all ${
                i === step ? 'bg-brand-600 text-white' :
                i < step ? 'bg-green-100 text-green-700' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? <Check size={12}/> : <span>{i + 1}</span>}
                {s}
              </div>
              {i < STEPS.length - 1 && <div className={`w-6 h-0.5 shrink-0 ${i < step ? 'bg-green-300' : 'bg-gray-200'}`}/>}
            </div>
          ))}
        </div>

        {/* ── STEP 0: Review Order ── */}
        {step === 0 && (
          <div>
            <h1 className="font-display text-3xl font-black text-gray-900 uppercase mb-6">Review Your Order</h1>
            <div className="card p-5 mb-4">
              <div className="space-y-4">
                {supplierList.map(sup => (
                  <div key={sup.id}>
                    <div className="text-xs font-bold text-gray-400 uppercase font-body mb-2">{sup.name}</div>
                    <div className="space-y-2">
                      {sup.items.map(ci => (
                        <div key={ci.key} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                          {ci.item.imageUrl
                            ? <img src={ci.item.imageUrl} className="w-10 h-10 rounded-lg object-cover shrink-0" alt="" onError={e=>e.target.style.display='none'}/>
                            : <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-lg shrink-0">📦</div>
                          }
                          <div className="flex-1 min-w-0">
                            <div className="font-display font-black text-gray-900 uppercase text-sm truncate">{ci.item.name}</div>
                            <div className="text-xs text-gray-400 font-body">
                              Qty: {ci.qty}
                              {ci.size && ` · ${ci.size}`}
                              {ci.color && ` · ${ci.color}`}
                            </div>
                          </div>
                          <div className="font-display font-black text-gray-900 text-sm shrink-0">
                            {convertFromBDT(parseFloat(ci.item.price)||0, country)}
                            <span className="text-xs font-body text-gray-400">/pc</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
                <div>
                  <div className="text-gray-400 text-sm font-body">Total to pay</div>
                  <div className="font-display font-black text-2xl text-gray-900">
                    {symbol}{total.toFixed(2)} <span className="text-sm font-body text-gray-400">{curr.code}</span>
                  </div>
                </div>
                <div className="text-right text-xs text-gray-400 font-body">
                  <div>{items.length} item{items.length !== 1 ? 's' : ''}</div>
                  <div>{supplierList.length} supplier{supplierList.length !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
            <button onClick={() => setStep(1)} className="btn-primary w-full justify-center py-3 text-base font-black">
              Proceed to Payment →
            </button>
          </div>
        )}

        {/* ── STEP 1: Pay via Remitly ── */}
        {step === 1 && (
          <div>
            <h1 className="font-display text-3xl font-black text-gray-900 uppercase mb-2">Pay via Remitly</h1>
            <p className="text-gray-400 font-body mb-6 text-sm">Send your payment to S&S Shop using Remitly, then come back here to confirm.</p>

            {/* Amount box */}
            <div className="hero-pattern rounded-2xl p-5 mb-5 text-white">
              <div className="text-red-200 text-xs font-body uppercase tracking-wider mb-1">Amount to send</div>
              <div className="font-display font-black text-4xl">{symbol}{total.toFixed(2)}</div>
              <div className="text-red-200 text-sm font-body">{curr.code} · {country}</div>
            </div>

            {/* Remitly recipient details */}
            <div className="card p-5 mb-5">
              <h3 className="font-display font-black text-gray-900 uppercase text-sm mb-4">Send to this recipient on Remitly</h3>
              <div className="space-y-3">
                {[
                  { label: 'Recipient Name', value: 'S&S Shop' },
                  { label: 'Country', value: 'Bangladesh 🇧🇩' },
                  { label: 'Purpose', value: 'Family Support / Personal Transfer' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <div className="text-xs text-gray-400 font-body">{row.label}</div>
                      <div className="font-bold text-gray-800 text-sm font-body">{row.value}</div>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <div className="text-xs text-gray-400 font-body">Recipient (copy this)</div>
                    <div className="font-bold text-gray-800 text-sm font-body">S&S Shop — snsshop.com</div>
                  </div>
                  <button onClick={copyRecipient} className="text-xs text-brand-600 font-bold flex items-center gap-1 font-body hover:text-brand-800 shrink-0 ml-3">
                    {copied ? <><Check size={12} className="text-green-500"/> Copied</> : <><Copy size={12}/> Copy</>}
                  </button>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-5">
              <h4 className="font-bold text-blue-800 text-sm mb-2 font-body">How to send:</h4>
              <ol className="space-y-1.5 text-sm text-blue-700 font-body">
                <li className="flex items-start gap-2"><span className="font-black shrink-0">1.</span> Open Remitly app or go to <a href="https://www.remitly.com" target="_blank" rel="noreferrer" className="underline font-bold">remitly.com <ExternalLink size={11} className="inline"/></a></li>
                <li className="flex items-start gap-2"><span className="font-black shrink-0">2.</span> Sign up or log in, then select <strong>Bangladesh</strong> as destination</li>
                <li className="flex items-start gap-2"><span className="font-black shrink-0">3.</span> Enter amount: <strong>{symbol}{total.toFixed(2)} {curr.code}</strong></li>
                <li className="flex items-start gap-2"><span className="font-black shrink-0">4.</span> Use recipient name: <strong>S&S Shop</strong></li>
                <li className="flex items-start gap-2"><span className="font-black shrink-0">5.</span> Complete the transfer and <strong>copy the Reference Number</strong></li>
                <li className="flex items-start gap-2"><span className="font-black shrink-0">6.</span> Come back here and click "I've Paid" below</li>
              </ol>
            </div>

            <a href="https://www.remitly.com" target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-xl text-base transition-colors mb-3 w-full">
              Open Remitly <ExternalLink size={16}/>
            </a>

            <button onClick={() => setStep(2)}
              className="w-full btn-secondary justify-center py-3 text-base font-black">
              I've Paid — Enter Reference →
            </button>
          </div>
        )}

        {/* ── STEP 2: Confirm Payment ── */}
        {step === 2 && (
          <div>
            <h1 className="font-display text-3xl font-black text-gray-900 uppercase mb-2">Confirm Your Payment</h1>
            <p className="text-gray-400 font-body mb-6 text-sm">Enter your Remitly reference number so we can verify your payment.</p>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm font-body">{submitError}</div>
            )}

            <div className="card p-5 mb-5 space-y-4">
              <div>
                <label className="label">Remitly Reference / Tracking Number *</label>
                <input className="input font-mono text-base" value={remitlyRef} onChange={e => setRemitlyRef(e.target.value)}
                  placeholder="e.g. R1234567890" />
                <p className="text-xs text-gray-400 mt-1 font-body">Find this in your Remitly app under "Transfer Details"</p>
              </div>
              <div>
                <label className="label">Your Full Name *</label>
                <input className="input" value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="As shown on Remitly" />
              </div>
              <div>
                <label className="label">Your Email</label>
                <input className="input" type="email" value={senderEmail} onChange={e => setSenderEmail(e.target.value)} placeholder="For order updates" />
              </div>
              <div>
                <label className="label">Order Notes (optional)</label>
                <textarea className="input resize-none" rows={2} value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Any special instructions for your order..." />
              </div>
            </div>

            {/* Order summary mini */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-5">
              <div className="flex items-center justify-between text-sm font-body">
                <span className="text-gray-500">Order total</span>
                <span className="font-black text-gray-900">{symbol}{total.toFixed(2)} {curr.code}</span>
              </div>
              <div className="flex items-center justify-between text-sm font-body mt-1">
                <span className="text-gray-500">Items</span>
                <span className="text-gray-700">{items.length} item{items.length!==1?'s':''} from {supplierList.length} supplier{supplierList.length!==1?'s':''}</span>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-xs text-amber-700 font-body">
              <strong>Important:</strong> Only submit after you have actually completed the Remitly transfer. Submitting without paying will delay your order.
            </div>

            <button onClick={submitOrder} disabled={submitting || !remitlyRef.trim() || !senderName.trim()}
              className="btn-primary w-full justify-center py-3.5 text-base font-black disabled:opacity-40">
              {submitting ? 'Submitting...' : 'Submit Order & Payment Reference →'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}