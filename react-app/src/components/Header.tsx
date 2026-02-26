import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import '../App.css'

export default function Header() {
  const [open, setOpen] = useState(false)

  return (
    <header className="site-header">
      <div className="header-inner">
        <div className="brand">
          <Link to="/" className="site-title" onClick={() => setOpen(false)}>
            💰 CoinMetrics
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
          <Link to="/" onClick={() => setOpen(false)}>
            Coins
          </Link>
          <Link to="/about" onClick={() => setOpen(false)}>
            Über das Projekt
          </Link>
        </nav>
      </div>
    </header>
  )
}
