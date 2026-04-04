import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

const COUNTRIES = ['United States','United Kingdom','Germany','France','Italy','Spain','Netherlands','Belgium','Sweden','Denmark','Norway','Australia','Canada','Japan','South Korea','China','India','UAE','Saudi Arabia','Turkey','Other']

export default function Auth() {
  const [params] = useSearchParams()
  const [isSignup, setIsSignup] = useState(params.get('mode') === 'signup')
  const [role, setRole] = useState('buyer')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [country, setCountry] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signup, login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isSignup) {
        await signup(email, password, role, displayName, country)
      } else {
        await login(email, password)
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, ''))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-sand-600 hover:text-forest-700 text-sm mb-8 transition-colors">
          <ArrowLeft size={16} /> Back to home
        </Link>

        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-forest-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-sand-50 font-display font-bold text-xl">S</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-forest-950">
              {isSignup ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sand-500 text-sm mt-1">
              {isSignup ? 'Join S&S Shop for free' : 'Sign in to your account'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <>
                <div>
                  <label className="label">I am a</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['buyer', 'supplier'].map((r) => (
                      <button
                        key={r} type="button"
                        onClick={() => setRole(r)}
                        className={`py-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                          role === r
                            ? 'bg-forest-600 border-forest-600 text-white'
                            : 'bg-white border-sand-200 text-sand-600 hover:border-forest-300'
                        }`}
                      >
                        {r === 'buyer' ? '🌍 Buyer' : '🏭 Supplier'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Full Name / Company Name</label>
                  <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your name or company" />
                </div>
                {role === 'buyer' && (
                  <div>
                    <label className="label">Your Country</label>
                    <select className="input" value={country} onChange={e => setCountry(e.target.value)} required>
                      <option value="">Select country</option>
                      {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-sand-400 hover:text-sand-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-sand-500 mt-6">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => setIsSignup(!isSignup)} className="text-forest-600 font-medium hover:underline">
              {isSignup ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}