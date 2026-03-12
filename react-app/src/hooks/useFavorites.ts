import { useState, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

function storageKey(email: string) {
  return `cm_favorites_${email}`
}

function loadFavorites(email: string): Set<string> {
  try {
    const raw = localStorage.getItem(storageKey(email))
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveFavorites(email: string, favorites: Set<string>) {
  localStorage.setItem(storageKey(email), JSON.stringify([...favorites]))
}

export function useFavorites() {
  const { user } = useAuth()

  const [favorites, setFavorites] = useState<Set<string>>(() =>
    user ? loadFavorites(user.email) : new Set()
  )

  const toggle = useCallback((coinId: string) => {
    if (!user) return
    setFavorites(prev => {
      const next = new Set(prev)
      if (next.has(coinId)) next.delete(coinId)
      else next.add(coinId)
      saveFavorites(user.email, next)
      return next
    })
  }, [user])

  const isFavorite = useCallback((coinId: string) => favorites.has(coinId), [favorites])

  return { favorites, toggle, isFavorite, isLoggedIn: !!user }
}
