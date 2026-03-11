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

function Liste() {
    const [coins, setCoins] = useState<CoinLoreCoin[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
                                <th>Name</th>
                                <th>Symbol</th>
                                <th>Preis (USD)</th>
                                <th>Marktkapitalisierung</th>
                                <th>24h</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formattedCoins.map((coin, index) => (
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
