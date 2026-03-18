import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'


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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  // Beim Start: prüfen ob User noch eingeloggt ist
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.name || session.user.email || '',
          email: session.user.email || '',
          picture: session.user.user_metadata?.picture,
          provider: 'email'
        })
      }
    })

    // Auth-Änderungen automatisch tracken
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          name: session.user.user_metadata?.name || session.user.email || '',
          email: session.user.email || '',
          picture: session.user.user_metadata?.picture,
          provider: 'email'
        })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(error.message)
  }

  const signup = async (name: string, email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name } // name wird in user_metadata gespeichert
      }
    })
    if (error) throw new Error(error.message)
  }

  const loginWithGoogle = (credential: string) => {
    const payload = parseJwt(credential)
    setUser({
      name: payload.name,
      email: payload.email,
      picture: payload.picture,
      provider: 'google'
    })
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

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
