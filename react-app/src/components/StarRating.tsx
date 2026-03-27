// src/components/StarRating.tsx
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

type Props = {
    coinId: string
    coinName: string
    size?: 'normal' | 'large'
}

export function StarRating({ coinId, coinName, size = 'normal' }: Props) {
    const { user } = useAuth()
    const [avgRating, setAvgRating] = useState<number>(0)
    const [ratingCount, setRatingCount] = useState<number>(0)
    const [userRating, setUserRating] = useState<number>(0)
    const [hovered, setHovered] = useState<number>(0)
    const [justSaved, setJustSaved] = useState(false)
    const [loading, setLoading] = useState(false)

    // Durchschnitt + Anzahl laden (für alle sichtbar)
    const fetchStats = useCallback(async () => {
        const { data, error } = await supabase
            .from('coin_ratings')
            .select('rating')
            .eq('coin_id', coinId)

        if (error || !data) return

        if (data.length === 0) {
            setAvgRating(0)
            setRatingCount(0)
            return
        }

        const total = data.reduce((sum, row) => sum + row.rating, 0)
        setAvgRating(total / data.length)
        setRatingCount(data.length)
    }, [coinId])

    // Eigenes Rating des eingeloggten Users laden
    const fetchUserRating = useCallback(async () => {
        if (!user?.id) return

        const { data, error } = await supabase
            .from('coin_ratings')
            .select('rating')
            .eq('coin_id', coinId)
            .eq('user_id', user.id)
            .maybeSingle()

        if (error || !data) return
        setUserRating(data.rating)
    }, [coinId, user?.id])

    useEffect(() => {
        void fetchStats()
        void fetchUserRating()
    }, [fetchStats, fetchUserRating])

    const handleRate = async (stars: number) => {
        if (!user?.id || loading) return

        setLoading(true)
        try {
            // UPSERT: erstellt oder überschreibt das Rating des Users
            const { error } = await supabase
                .from('coin_ratings')
                .upsert(
                    {
                        coin_id: coinId,
                        user_id: user.id,
                        rating: stars,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: 'coin_id,user_id' }
                )

            if (error) {
                console.error('Rating konnte nicht gespeichert werden:', error)
                return
            }

            setUserRating(stars)
            setJustSaved(true)
            setTimeout(() => setJustSaved(false), 1500)

            // Durchschnitt neu laden
            await fetchStats()
        } finally {
            setLoading(false)
        }
    }

    const displayStars = hovered || userRating
    const isLarge = size === 'large'

    return (
        <div className={`star-rating ${isLarge ? 'star-rating--large' : ''}`} title={`${coinName} bewerten`}>
            <div className="stars-row">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        className={`star-btn ${star <= displayStars ? 'star-active' : 'star-empty'}`}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        onClick={() => void handleRate(star)}
                        disabled={!user || loading}
                        aria-label={`${star} Sterne`}
                        title={!user ? 'Anmelden um zu bewerten' : undefined}
                    >
                        ★
                    </button>
                ))}
            </div>
            <span className="rating-info">
                {justSaved ? (
                    <span className="rating-saved">✓ Gespeichert</span>
                ) : avgRating > 0 ? (
                    <>
                        <span className="rating-avg">{avgRating.toFixed(1)}</span>
                        <span className="rating-count">({ratingCount})</span>
                    </>
                ) : (
                    <span className="rating-none">–</span>
                )}
            </span>
        </div>
    )
}