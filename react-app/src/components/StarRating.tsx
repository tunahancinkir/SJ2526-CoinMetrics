// src/components/StarRating.tsx
import { useEffect, useState } from 'react'

type RatingData = {
    totalScore: number
    count: number
}

type AllRatings = Record<string, RatingData>

type Props = {
    coinId: string
    coinName: string
    size?: 'normal' | 'large'
}

const STORAGE_KEY = 'coinratings-v1'

function loadAllRatings(): AllRatings {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? (JSON.parse(raw) as AllRatings) : {}
    } catch {
        return {}
    }
}

function saveAllRatings(ratings: AllRatings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(ratings))
    } catch {
        // localStorage not available
    }
}

function loadUserRating(coinId: string): number {
    try {
        const raw = localStorage.getItem(`userrating-${coinId}`)
        return raw ? Number(raw) : 0
    } catch {
        return 0
    }
}

function saveUserRating(coinId: string, stars: number): void {
    try {
        localStorage.setItem(`userrating-${coinId}`, String(stars))
    } catch {
        // localStorage not available
    }
}

export function StarRating({ coinId, coinName, size = 'normal' }: Props) {
    const [allRatings, setAllRatings] = useState<AllRatings>({})
    const [userRating, setUserRating] = useState<number>(0)
    const [hovered, setHovered] = useState<number>(0)
    const [justSaved, setJustSaved] = useState(false)

    useEffect(() => {
        setAllRatings(loadAllRatings())
        setUserRating(loadUserRating(coinId))
    }, [coinId])

    const avgRating = allRatings[coinId]
        ? allRatings[coinId].totalScore / allRatings[coinId].count
        : 0

    const ratingCount = allRatings[coinId]?.count ?? 0

    const handleRate = (stars: number) => {
        const prev = userRating
        const latest = loadAllRatings()
        const existing = latest[coinId] ?? { totalScore: 0, count: 0 }

        const newTotal = existing.totalScore - prev + stars
        const newCount = prev === 0 ? existing.count + 1 : existing.count

        const updated: AllRatings = {
            ...latest,
            [coinId]: { totalScore: newTotal, count: newCount },
        }

        saveAllRatings(updated)
        saveUserRating(coinId, stars)

        setAllRatings(updated)
        setUserRating(stars)
        setJustSaved(true)
        setTimeout(() => setJustSaved(false), 1500)
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
                        onClick={() => handleRate(star)}
                        aria-label={`${star} Sterne`}
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