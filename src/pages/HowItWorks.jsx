import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Search, MessageCircle, Package, ShieldCheck, ArrowRight, Phone, Globe, Truck, HelpCircle } from 'lucide-react'

const STEPS = [
  {
    num: '01',
    icon: <Search size={28} className="text-brand-600" />,
    title: 'Browse Products',
    desc: 'Search by product name, category, or price. Filter by MOQ to find suppliers that match your order size. Every listing shows real prices in your local currency.'
  },
  {
    num: '02',
    icon: <ShieldCheck size={28} className="text-emerald-600" />,
    title: 'Check the Supplier',
    desc: 'Look for the Verified badge. Check their product photos, factory location, MOQ, and WhatsApp number. Verified suppliers have been manually reviewed by our team.'
  },
  {
    num: '03',
    icon: <MessageCircle size={28} className="text-blue-500" />,
    title: 'Contact Directly',
    desc: 'Tap WhatsApp or use the in-platform chat to message the supplier. Ask for samples, negotiate price, and confirm order details. No middlemen involved.'
  },
  {
    num: '04',
    icon: <Package size={28} className="text-orange-500" />,
    title: 'Place Your Order',
    desc: 'Once you agree on terms, the supplier ships directly to you via Air or Sea freight from Dhaka or Chittagong. Handle payment directly with your supplier.'
  },
]

const FAQS = [
  {
    q: 'Are the prices on S&S Shop real?',
    a: 'Yes. Prices are entered directly by suppliers in BDT and automatically converted to your local currency. Final pricing is confirmed directly with the supplier — there may be small variations based on order size.'
  },
  {
    q: 'How do I order samples?',
    a: 'Many suppliers offer samples. Check the product listing for "Sample Available" details, then contact the supplier directly via WhatsApp or chat to request one.'
  },
  {
    q: 'How does shipping work?',
    a: 'Suppliers ship from Bangladesh (mainly Dhaka and Chittagong) via Air freight (faster, 3–7 days) or Sea freight (slower, 20–40 days, cheaper for bulk). Costs are discussed directly with the supplier.'
  },
  {
    q: 'Is S&S Shop free to use?',
    a: 'Yes. Browsing and contacting suppliers is completely free for buyers. Suppliers can list products for free, with optional paid Verified badges for more visibility.'
  },
  {
    q: 'What is the "Verified" badge?',
    a: 'Verified Seller badges are given to suppliers who have been manually reviewed by the S&S Shop team. It means their business details, photos, and contact info have been checked.'
  },
  {
    q: 'What if a supplier doesn\'t respond?',
    a: 'Try reaching them on WhatsApp directly. If a supplier is consistently unresponsive, you can report them by emailing us. We monitor supplier quality regularly.'
  },
  {
    q: 'How do I know if a supplier is legitimate?',
    a: 'Look for: Verified badge, real factory photos, clear contact details, and product reviews from other buyers. Suppliers with WhatsApp numbers and factory photos are much more trustworthy.'
  },
  {
    q: 'Can I order from multiple suppliers?',
    a: 'Yes. Use the cart to track multiple suppliers and their products, then contact each one individually via chat or WhatsApp to confirm your orders.'
  },
]

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="hero-pattern py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="font-display text-5xl sm:text-6xl font-black text-white uppercase tracking-tight mb-4">
            How S&S Shop Works
          </h1>
          <p className="text-red-100 text-lg font-body max-w-xl mx-auto mb-8">
            Source garments from Bangladesh in 4 simple steps. No agents, no markup, no confusion.
          </p>
          <Link to="/" className="btn-white px-8 py-3 font-bold">
            Start Browsing <ArrowRight size={15} />
          </Link>
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-black text-gray-900 uppercase">The Process</h2>
          <p className="text-gray-400 font-body mt-2">From discovery to deal in under 30 minutes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {STEPS.map(step => (
            <div key={step.num} className="card p-6 flex gap-5">
              <div className="shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-2">
                  {step.icon}
                </div>
                <div className="font-mono text-xs text-gray-300 text-center">{step.num}</div>
              </div>
              <div>
                <h3 className="font-display text-xl font-black text-gray-900 uppercase mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed font-body">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping explained */}
      <div className="bg-white border-y border-gray-100 py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-4xl font-black text-gray-900 uppercase">Shipping from Bangladesh</h2>
            <p className="text-gray-400 font-body mt-2">All suppliers ship from Dhaka or Chittagong</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="card p-6 border-2 border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                  <Globe size={24} className="text-blue-500" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 uppercase">Air Freight</h3>
                  <p className="text-xs text-blue-600 font-bold font-body">3–7 business days</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-500 font-body">
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold mt-0.5">✓</span> Fast delivery worldwide</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold mt-0.5">✓</span> Best for small–medium orders</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold mt-0.5">✓</span> Higher cost per kg than sea</li>
                <li className="flex items-start gap-2"><span className="text-blue-400 font-bold mt-0.5">✓</span> Ships from Dhaka (DAC) airport</li>
              </ul>
            </div>
            <div className="card p-6 border-2 border-emerald-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <Truck size={24} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-black text-gray-900 uppercase">Sea Freight</h3>
                  <p className="text-xs text-emerald-600 font-bold font-body">20–40 days</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-500 font-body">
                <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">✓</span> Much cheaper for bulk orders</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">✓</span> Best for large containers</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">✓</span> FCL or LCL options</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400 font-bold mt-0.5">✓</span> Ships from Chittagong port</li>
              </ul>
            </div>
          </div>
          <p className="text-center text-gray-400 text-sm font-body mt-6">
            💡 Always confirm shipping method and cost directly with your supplier before placing an order.
          </p>
        </div>
      </div>

      {/* Trust section */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl font-black text-gray-900 uppercase">How We Build Trust</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {[
            { icon: <ShieldCheck size={22} className="text-emerald-600" />, title: 'Verified Sellers', desc: 'Manually reviewed suppliers with real photos, working WhatsApp, and confirmed business details.' },
            { icon: <Phone size={22} className="text-blue-500" />, title: 'Direct Contact', desc: 'WhatsApp and chat connect you directly to the factory. No agents, no delays.' },
            { icon: <Package size={22} className="text-orange-500" />, title: 'Real Product Photos', desc: 'All listings require actual product photos. Stock photos and fake images are rejected.' },
          ].map(item => (
            <div key={item.title} className="card p-5 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                {item.icon}
              </div>
              <h3 className="font-display text-lg font-black text-gray-900 uppercase mb-2">{item.title}</h3>
              <p className="text-gray-400 text-sm font-body leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-10">
            <HelpCircle size={32} className="text-brand-600 mx-auto mb-3" />
            <h2 className="font-display text-4xl font-black text-gray-900 uppercase">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <details key={faq.q} className="card p-5 group cursor-pointer">
                <summary className="font-display font-black text-gray-900 uppercase text-base list-none flex items-center justify-between">
                  {faq.q}
                  <span className="text-brand-600 text-xl font-black group-open:rotate-45 transition-transform duration-200 shrink-0 ml-3">+</span>
                </summary>
                <p className="text-gray-500 text-sm leading-relaxed font-body mt-3 border-t border-gray-50 pt-3">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="hero-pattern py-16 text-center">
        <h2 className="font-display text-4xl font-black text-white uppercase mb-3">Ready to Source?</h2>
        <p className="text-red-100 font-body mb-6">Browse real products from verified Bangladeshi suppliers</p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link to="/" className="btn-white px-8 py-3 font-bold">Browse Products <ArrowRight size={15} /></Link>
          <Link to="/auth?mode=signup" className="border-2 border-white/50 text-white hover:bg-white/10 px-8 py-3 rounded-xl font-bold font-body transition-colors">
            Create Free Account
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-8 text-center">
        <p className="text-gray-300 text-sm font-body">© 2025 S&S Shop — Bangladesh Garment B2B Platform</p>
        <p className="text-gray-200 text-xs font-body mt-1">Transactions and logistics are handled directly between buyers and suppliers.</p>
      </footer>
    </div>
  )
}
