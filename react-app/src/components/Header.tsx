import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import '../App.css'
import { useAuth } from '../contexts/AuthContext'
import LoginModal from './LoginModal'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const { user } = useAuth()

  const initials = user
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : ''

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <Link to="/" className="site-title" onClick={() => setOpen(false)}>
              <span style={{ WebkitTextFillColor: 'initial', background: 'none' }}>💰</span> CoinMetrics
            </Link>
          </div>

          <button
            className="nav-toggle"
            aria-label="Menü"
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
          >
            <span className="hamburger" />
          </button>

          <nav className={`site-nav ${open ? 'open' : ''}`} aria-label="Hauptnavigation">
            <Link to="/" onClick={() => setOpen(false)}>Coins</Link>
            <Link to="/liste" onClick={() => setOpen(false)}>Liste</Link>
            <Link to="/about" onClick={() => setOpen(false)}>Impressum</Link>

            {user ? (
              <Link to="/account" className="nav-user-btn" onClick={() => setOpen(false)}>
                {user.picture
                  ? <img src={user.picture} alt={user.name} className="nav-avatar-img" referrerPolicy="no-referrer" />
                  : <span className="nav-avatar-initials">{initials}</span>
                }
                <span className="nav-user-name">{user.name.split(' ')[0]}</span>
              </Link>
            ) : (
              <button className="nav-login-btn" onClick={() => { setShowLogin(true); setOpen(false) }}>
                Login
              </button>
            )}
          </nav>
        </div>
      </header>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </>
  )
}
