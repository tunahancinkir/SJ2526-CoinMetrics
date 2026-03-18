import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import defaultAccounts from '../data/defaultAccounts.json'

export interface User {
  name: string
  email: string
  picture?: string
  provider: 'google' | 'email'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

function parseJwt(token: string) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

function seedDefaultAccounts() {
  for (const account of defaultAccounts) {
    const key = `cm_account_${account.email}`
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, JSON.stringify({ name: account.name, email: account.email, password: account.password }))
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  seedDefaultAccounts()

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('coinmetrics_user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (user) localStorage.setItem('coinmetrics_user', JSON.stringify(user))
    else localStorage.removeItem('coinmetrics_user')
  }, [user])

  const login = async (email: string, password: string) => {
    const stored = localStorage.getItem(`cm_account_${email}`)
    if (!stored) throw new Error('Account not found. Please sign up first.')
    const account = JSON.parse(stored)
    if (account.password && account.password !== password)
      throw new Error('Incorrect password.')
    setUser({ name: account.name, email, provider: 'email' })
  }

  const signup = async (name: string, email: string, password: string) => {
    if (localStorage.getItem(`cm_account_${email}`))
      throw new Error('An account with this email already exists.')
    localStorage.setItem(`cm_account_${email}`, JSON.stringify({ name, email, password }))
    setUser({ name, email, provider: 'email' })
  }

  const loginWithGoogle = (credential: string) => {
    const payload = parseJwt(credential)
    setUser({ name: payload.name, email: payload.email, picture: payload.picture, provider: 'google' })
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
