import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

type FavoriteCoin = {
  id: string
  name?: string
  symbol?: string
}

type ToggleInput = FavoriteCoin | string

export function useFavorites() {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    let active = true

    if (!user?.id) {
      setFavorites(new Set())
      return
    }

    const loadFavorites = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('user_favorites')
        .select('coin_id')
        .eq('user_id', user.id)

      if (!active) return

      if (error) {
        console.error('Failed to load favorites from Supabase:', error)
        setFavorites(new Set())
      } else {
        setFavorites(new Set(data.map((row) => row.coin_id)))
      }

      setIsLoading(false)
    }

    void loadFavorites()

    return () => {
      active = false
    }
  }, [user?.id])

  const toggle = useCallback(async (coin: ToggleInput) => {
    if (!user?.id) return

    const normalizedCoin: FavoriteCoin =
      typeof coin === 'string' ? { id: coin } : coin

    const coinId = normalizedCoin.id

    if (favorites.has(coinId)) {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('coin_id', coinId)

      if (error) {
        console.error('Failed to remove favorite in Supabase:', error)
        return
      }

      setFavorites((prev) => {
        const next = new Set(prev)
        next.delete(coinId)
        return next
      })
    } else {
      const { error } = await supabase.from('user_favorites').insert({
        user_id: user.id,
        coin_id: coinId,
        coin_name: normalizedCoin.name ?? null,
        coin_symbol: normalizedCoin.symbol ?? null,
      })

      if (error) {
        console.error('Failed to add favorite in Supabase:', error)
        return
      }

      setFavorites((prev) => {
        const next = new Set(prev)
        next.add(coinId)
        return next
      })
    }
  }, [favorites, user?.id])

  const isFavorite = useCallback((coinId: string) => favorites.has(coinId), [favorites])

  const syncFavoriteMetadata = useCallback(async (coins: FavoriteCoin[]) => {
    if (!user?.id || favorites.size === 0 || coins.length === 0) return

    const rows = coins
      .filter((coin) => favorites.has(coin.id))
      .map((coin) => ({
        user_id: user.id,
        coin_id: coin.id,
        coin_name: coin.name ?? null,
        coin_symbol: coin.symbol ?? null,
      }))

    if (rows.length === 0) return

    const { error } = await supabase
      .from('user_favorites')
      .upsert(rows, { onConflict: 'user_id,coin_id' })

    if (error) {
      console.error('Failed to sync favorite metadata in Supabase:', error)
    }
  }, [favorites, user?.id])

  return { favorites, toggle, isFavorite, syncFavoriteMetadata, isLoggedIn: !!user, isLoading }
}
