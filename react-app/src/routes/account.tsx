import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export const Route = createFileRoute('/account')({
  component: AccountPage,
})

function AccountPage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate({ to: '/' })
  }, [user, navigate])

  if (!user) return null

  const initials = user.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/' })
  }

  return (
    <div className="account-page">
      <div className="account-card">
        <div className="account-avatar">
          {user.picture
            ? <img src={user.picture} alt={user.name} referrerPolicy="no-referrer" />
            : <span>{initials}</span>
          }
        </div>

        <h1 className="account-name">{user.name}</h1>
        <p className="account-email">{user.email}</p>
        <span className="account-badge">
          {user.provider === 'google' ? '🔵 Google Account' : '📧 Email Account'}
        </span>

        <div className="account-divider" />

        <div className="account-info-grid">
          <div className="account-info-item">
            <span className="account-info-label">Name</span>
            <span className="account-info-value">{user.name}</span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Email</span>
            <span className="account-info-value">{user.email}</span>
          </div>
          <div className="account-info-item">
            <span className="account-info-label">Sign-in method</span>
            <span className="account-info-value" style={{ textTransform: 'capitalize' }}>{user.provider}</span>
          </div>
        </div>

        <button className="account-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  )
}
