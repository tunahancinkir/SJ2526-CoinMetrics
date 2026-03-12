// src/routes/liste.tsx
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'

export const Route = createFileRoute('/liste')({
    component: Liste,
})

type CoinLoreCoin = {
    id: string
    name: string
    symbol: string
    price_usd: string
    market_cap_usd: string
    percent_change_24h: string
}

type CoinLoreResponse = {
    data: CoinLoreCoin[]
}

type SortKey = 'name' | 'price' | 'change24h'
type SortDirection = 'asc' | 'desc'

function Liste() {
    const [coins, setCoins] = useState<CoinLoreCoin[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [sortKey, setSortKey] = useState<SortKey | null>(null)
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

    useEffect(() => {
        const controller = new AbortController()

        const loadCoins = async () => {
            setIsLoading(true)
            setError(null)

            try {
                const response = await fetch('https://api.coinlore.net/api/tickers/?start=0&limit=30', {
                    signal: controller.signal,
                })

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`)
                }

                const payload: CoinLoreResponse = await response.json()
                setCoins(payload.data)
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return
                }
                setError('Daten konnten nicht geladen werden. Bitte später erneut versuchen.')
            } finally {
                setIsLoading(false)
            }
        }

        void loadCoins()

        return () => {
            controller.abort()
        }
    }, [])

    const formattedCoins = useMemo(
        () =>
            coins.map((coin) => ({
                ...coin,
                price: Number(coin.price_usd),
                marketCap: Number(coin.market_cap_usd),
                change24h: Number(coin.percent_change_24h),
            })),
        [coins],
    )

    const sortedCoins = useMemo(() => {
        if (!sortKey) return formattedCoins

        return [...formattedCoins].sort((a, b) => {
            let comparison = 0

            if (sortKey === 'name') {
                comparison = a.name.localeCompare(b.name)
            } else if (sortKey === 'price') {
                comparison = a.price - b.price
            } else if (sortKey === 'change24h') {
                comparison = a.change24h - b.change24h
            }

            return sortDirection === 'asc' ? comparison : -comparison
        })
    }, [formattedCoins, sortKey, sortDirection])

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortKey(key)
            setSortDirection('asc')
        }
    }

    const getSortIndicator = (key: SortKey) => {
        if (sortKey !== key) return ' ↕'
        return sortDirection === 'asc' ? ' ↑' : ' ↓'
    }

    return (
        <div className="liste-container">
            <section className="liste-header">
                <h1>Krypto-Liste</h1>
                <p>Live-Marktdaten der Top Coins aus der CoinLore API.</p>
            </section>

            {isLoading ? <p className="section-info">Marktdaten werden geladen...</p> : null}

            {!isLoading && error ? <p className="liste-error">{error}</p> : null}

            {!isLoading && !error ? (
                <div className="coins-table-wrap">
                    <table className="coins-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th
                                    className={`sortable ${sortKey === 'name' ? 'is-sorted' : ''}`}
                                    onClick={() => handleSort('name')}
                                >
                                    Name{getSortIndicator('name')}
                                </th>
                                <th>Symbol</th>
                                <th
                                    className={`sortable ${sortKey === 'price' ? 'is-sorted' : ''}`}
                                    onClick={() => handleSort('price')}
                                >
                                    Preis (USD){getSortIndicator('price')}
                                </th>
                                <th>Marktkapitalisierung</th>
                                <th
                                    className={`sortable ${sortKey === 'change24h' ? 'is-sorted' : ''}`}
                                    onClick={() => handleSort('change24h')}
                                >
                                    24h{getSortIndicator('change24h')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedCoins.map((coin, index) => (
                                <tr key={coin.id}>
                                    <td>{index + 1}</td>
                                    <td>{coin.name}</td>
                                    <td>{coin.symbol}</td>
                                    <td>
                                        {coin.price.toLocaleString('de-AT', {
                                            style: 'currency',
                                            currency: 'USD',
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 6,
                                        })}
                                    </td>
                                    <td>
                                        {coin.marketCap.toLocaleString('de-AT', {
                                            style: 'currency',
                                            currency: 'USD',
                                            maximumFractionDigits: 0,
                                        })}
                                    </td>
                                    <td className={coin.change24h >= 0 ? 'is-positive' : 'is-negative'}>
                                        {coin.change24h.toFixed(2)}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}