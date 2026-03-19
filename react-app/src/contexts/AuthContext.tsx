import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'

export interface User {
  id?: string
  name: string
  email: string
  picture?: string
  provider: 'google' | 'email'
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  loginWithGoogle: (credential: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

type SupabaseUserLike = {
  id: string
  email?: string
  user_metadata?: {
    full_name?: string
    name?: string
    picture?: string
    avatar_url?: string
  }
}

function mapSupabaseUser(user: SupabaseUserLike): User {
  const nameFromMetadata = user.user_metadata?.full_name || user.user_metadata?.name
  const picture = user.user_metadata?.picture || user.user_metadata?.avatar_url

  return {
    id: user.id,
    email: user.email || '',
    name: nameFromMetadata || user.email?.split('@')[0] || 'User',
    picture,
    provider: picture ? 'google' : 'email',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let mounted = true

    void (async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      if (error) {
        setUser(null)
        return
      }
      setUser(data.session?.user ? mapSupabaseUser(data.session.user) : null)
    })()

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapSupabaseUser(session.user) : null)
    })

    return () => {
      mounted = false
      authSubscription.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    if (!data.user) throw new Error('Login failed.')
    setUser(mapSupabaseUser(data.user))
  }

  const signup = async (name: string, email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    })

    if (error) throw error
    if (!data.user) throw new Error('Signup failed.')
    setUser(mapSupabaseUser(data.user))
  }

  const loginWithGoogle = async (credential: string) => {
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })

    if (error) throw error
    if (!data.user) throw new Error('Google login failed.')
    setUser(mapSupabaseUser(data.user))
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
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
