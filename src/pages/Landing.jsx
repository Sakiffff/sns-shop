import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { Search, MessageCircle, Star, ArrowRight, Package, Globe, Shield } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="section-tag">B2B Garment Marketplace</div>
        <h1 className="font-display text-5xl sm:text-6xl font-bold text-forest-950 mb-6 leading-tight">
          Source garments from<br />
          <span className="text-forest-600">Bangladesh</span> — easily and directly
        </h1>
        <p className="text-lg text-sand-700 max-w-2xl mx-auto mb-10">
          Save time, reduce costs, and connect with real suppliers. No middlemen, no hassle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/auth?mode=signup" className="btn-primary text-base px-8 py-4">
            Get Started <ArrowRight size={18} />
          </Link>
          <Link to="/auth" className="btn-secondary text-base px-8 py-4">
            Login
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-sand-200 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <div className="section-tag">How It Works</div>
            <h2 className="font-display text-3xl font-bold text-forest-950">Three simple steps</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Search size={28} />, step: '01', title: 'Browse Suppliers', desc: 'Search verified Bangladeshi garment factories by category, MOQ, and location.' },
              { icon: <MessageCircle size={28} />, step: '02', title: 'Contact Directly', desc: 'Chat inside the platform or reach out via WhatsApp, email, or social media.' },
              { icon: <Package size={28} />, step: '03', title: 'Close the Deal', desc: 'Negotiate terms directly with the supplier and manage logistics together.' },
            ].map((item) => (
              <div key={item.step} className="card p-8 text-center">
                <div className="w-14 h-14 bg-forest-50 rounded-2xl flex items-center justify-center text-forest-600 mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="font-mono text-xs text-sand-400 mb-2">{item.step}</div>
                <h3 className="font-display text-xl font-semibold text-forest-900 mb-3">{item.title}</h3>
                <p className="text-sand-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="section-tag">Why S&S Shop</div>
          <h2 className="font-display text-3xl font-bold text-forest-950">Built for global buyers</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Globe size={22} />, title: 'Auto Translation', desc: 'Chat messages auto-translated so language is never a barrier.' },
            { icon: <Star size={22} />, title: 'Verified Suppliers', desc: 'Sponsored and featured suppliers for faster discovery.' },
            { icon: <Shield size={22} />, title: 'Direct Communication', desc: 'No middlemen. Talk straight to the factory.' },
          ].map((f) => (
            <div key={f.title} className="card p-6">
              <div className="w-10 h-10 bg-forest-50 rounded-xl flex items-center justify-center text-forest-600 mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-forest-900 mb-2">{f.title}</h3>
              <p className="text-sand-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-forest-600 py-20 text-center">
        <h2 className="font-display text-4xl font-bold text-sand-50 mb-4">Ready to source smarter?</h2>
        <p className="text-forest-200 mb-8 text-lg">Join buyers and suppliers already using S&S Shop.</p>
        <Link to="/auth?mode=signup" className="bg-sand-50 text-forest-700 px-8 py-4 rounded-lg font-medium hover:bg-white transition-colors inline-flex items-center gap-2">
          Create Free Account <ArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-sand-200 py-8 text-center text-sand-500 text-sm">
        <p>© 2024 S&S Shop — snsshop.com · Connecting global buyers with Bangladeshi garment suppliers</p>
        <p className="mt-2 text-xs">⚠️ Payments and logistics are handled directly between buyers and suppliers.</p>
      </footer>
    </div>
  )
}