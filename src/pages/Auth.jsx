import { useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'

export default function Auth() {
  const [params] = useSearchParams()
  const [isSignup, setIsSignup] = useState(params.get('mode') === 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
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
      if (isSignup) await signup(email, password, displayName)
      else await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err.message.replace('Firebase: ', '').replace(/\(auth.*\)/, '').trim())
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-brand-600 text-sm mb-8 transition-colors font-body">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div className="card p-8">
          <div className="text-center mb-8">
            {/* Logo component — base64 embedded, always works */}
            <Logo className="h-12 w-auto mx-auto mb-5" />
            <h1 className="font-display text-3xl font-black text-gray-900 uppercase tracking-wide">
              {isSignup ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="text-gray-400 text-sm mt-1 font-body">
              {isSignup ? 'Join S&S Shop for free' : 'Sign in to continue'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)} required placeholder="Your name" />
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required placeholder="Min. 6 characters" minLength={6} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base font-black">
              {loading ? 'Please wait...' : isSignup ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6 font-body">
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <button onClick={() => { setIsSignup(!isSignup); setError('') }} className="text-brand-600 font-semibold hover:underline">
              {isSignup ? 'Sign in' : 'Sign up free'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}