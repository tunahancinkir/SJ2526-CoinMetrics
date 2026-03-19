import { useState, useEffect } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../contexts/AuthContext'

interface Props {
  onClose: () => void
}

export default function LoginModal({ onClose }: Props) {
  const { login, signup, loginWithGoogle } = useAuth()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(email, password)
      } else {
        if (!name.trim()) throw new Error('Please enter your name.')
        await signup(name, email, password)
      }
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const switchTab = (t: 'login' | 'signup') => {
    setTab(t)
    setError('')
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={e => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="auth-header">
          <span className="auth-logo">💰</span>
          <h2>CoinMetrics</h2>
          <p>{tab === 'login' ? 'Welcome back' : 'Create your account'}</p>
        </div>

        <div className="auth-tabs">
          <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
            Login
          </button>
          <button className={`auth-tab ${tab === 'signup' ? 'active' : ''}`} onClick={() => switchTab('signup')}>
            Sign Up
          </button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {tab === 'signup' && (
            <input
              className="auth-input"
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              autoFocus
            />
          )}
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus={tab === 'login'}
          />
          <input
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error && <p className="auth-error">{error}</p>}
          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'Loading…' : tab === 'login' ? 'Login' : 'Create Account'}
          </button>
        </form>

        <div className="auth-divider"><span>or continue with</span></div>

        <div className="auth-google-wrap">
          <GoogleLogin
            onSuccess={async res => {
              if (res.credential) {
                setError('')
                setLoading(true)
                try {
                  await loginWithGoogle(res.credential)
                  onClose()
                } catch (err: unknown) {
                  setError(err instanceof Error ? err.message : 'Google sign-in failed.')
                } finally {
                  setLoading(false)
                }
              }
            }}
            onError={() => setError('Google sign-in failed. Make sure VITE_GOOGLE_CLIENT_ID is set.')}
            theme="filled_black"
            shape="rectangular"
            width="320"
            text={tab === 'login' ? 'signin_with' : 'signup_with'}
          />
        </div>
      </div>
    </div>
  )
}
