// src/routes/index.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import mainLogoNoBackground from '../assets/main-logo-noBackground (1).png'

export const Route = createFileRoute('/')({
    component: Index,
})

type Coin = {
    id: string
    name: string
    symbol: string
    nameid: string
    rank: number
    price_usd: string
    percent_change_1h: string
    percent_change_24h: string
    percent_change_7d: string
    market_cap_usd: string
    volume24: number
    csupply: string
    tsupply: string
    msupply: string
}

type CoinLoreResponse = {
    data: Coin[]
}

function buildChartPoints(coin: Coin): { label: string; price: number }[] {
    const now = Number(coin.price_usd)
    const p1h = Number(coin.percent_change_1h) / 100
    const p24h = Number(coin.percent_change_24h) / 100
    const p7d = Number(coin.percent_change_7d) / 100

    const price7d = now / (1 + p7d)
    const price24h = now / (1 + p24h)
    const price1h = now / (1 + p1h)

    return [
        { label: 'vor 7T', price: price7d },
        { label: 'vor 4T', price: price7d + (price24h - price7d) * 0.4 },
        { label: 'vor 2T', price: price7d + (price24h - price7d) * 0.75 },
        { label: 'vor 24h', price: price24h },
        { label: 'vor 12h', price: price24h + (price1h - price24h) * 0.4 },
        { label: 'vor 1h', price: price1h },
        { label: 'Jetzt', price: now },
    ]
}

function MiniChart({ coin }: { coin: Coin }) {
    const points = buildChartPoints(coin)
    const prices = points.map(p => p.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const range = max - min || 1

    const w = 400
    const h = 120
    const pad = { top: 10, right: 10, bottom: 28, left: 10 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom

    const toX = (i: number) => pad.left + (i / (points.length - 1)) * chartW
    const toY = (price: number) => pad.top + chartH - ((price - min) / range) * chartH

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.price)}`).join(' ')
    const areaD = `${pathD} L ${toX(points.length - 1)} ${h - pad.bottom} L ${toX(0)} ${h - pad.bottom} Z`

    const isPositive = Number(coin.percent_change_7d) >= 0
    const color = isPositive ? '#4ade80' : '#f87171'
    const gradId = `grad-${coin.id}`

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="coin-chart-svg" aria-label={`Preisverlauf ${coin.name}`}>
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map(t => (
                <line
                    key={t}
                    x1={pad.left} y1={pad.top + chartH * (1 - t)}
                    x2={pad.left + chartW} y2={pad.top + chartH * (1 - t)}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                />
            ))}
            <path d={areaD} fill={`url(#${gradId})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={toX(points.length - 1)} cy={toY(prices[prices.length - 1])} r="4" fill={color} />
            {points.map((p, i) => (
                <text
                    key={i}
                    x={toX(i)}
                    y={h - 6}
                    textAnchor="middle"
                    fontSize="9"
                    fill="rgba(255,255,255,0.35)"
                >
                    {p.label}
                </text>
            ))}
        </svg>
    )
}

function Index() {
    const [coins, setCoins] = useState<Coin[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const res = await fetch('https://api.coinlore.net/api/tickers/?start=0&limit=30', {
                    signal: controller.signal,
                })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const payload: CoinLoreResponse = await res.json()
                setCoins(payload.data)
                setSelectedId(payload.data[0]?.id ?? null)
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return
                setError('Daten konnten nicht geladen werden.')
            } finally {
                setIsLoading(false)
            }
        }
        void load()
        return () => controller.abort()
    }, [])

    const formattedCoins = useMemo(
        () => coins.map(c => ({
            ...c,
            price: Number(c.price_usd),
            marketCap: Number(c.market_cap_usd),
            change24h: Number(c.percent_change_24h),
        })),
        [coins],
    )

    const filteredCoins = useMemo(() => {
        const q = searchQuery.trim().toLowerCase()
        if (!q) return formattedCoins
        return formattedCoins.filter(
            (coin) =>
                coin.name.toLowerCase().startsWith(q) ||
                coin.symbol.toLowerCase().startsWith(q),
        )
    }, [formattedCoins, searchQuery])

    const effectiveSelectedId = useMemo(() => {
        if (!selectedId) return null
        const stillVisible = filteredCoins.some(c => c.id === selectedId)
        return stillVisible ? selectedId : (filteredCoins[0]?.id ?? null)
    }, [filteredCoins, selectedId])

    const selected = coins.find(c => c.id === effectiveSelectedId) ?? null

    const fmt = (val: string | number, decimals = 2) =>
        Number(val).toLocaleString('de-AT', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: decimals, maximumFractionDigits: decimals,
        })
    const fmtNum = (val: string | number) =>
        Number(val).toLocaleString('de-AT', { maximumFractionDigits: 0 })
    const chgClass = (v: string | number) => Number(v) >= 0 ? 'is-positive' : 'is-negative'
    const chgSign = (v: string | number) => Number(v) >= 0 ? '+' : ''

    return (
        <div className="coins-container">
            <section className="hero-section">
                <img src={mainLogoNoBackground} alt="CoinMetrics" style={{ height: '60px' }} />
                <p className="hero-subtitle">Echtzeit-Daten des Kryptowährungsmarkts</p>
                <p className="hero-description">
                    Verfolge die Top-Kryptowährungen mit aktuellen Preisen, Marktkapitalisierungen und Kursverläufen.
                </p>
            </section>

            {isLoading && <p className="section-info">Marktdaten werden geladen...</p>}
            {!isLoading && error && <p className="liste-error">{error}</p>}

            {!isLoading && !error && (
                <>
                    <div className="search-bar-wrap">
                        <input
                            className="search-input"
                            type="text"
                            placeholder="🔍 Coin suchen (Name oder Symbol)..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <span className="search-result-count">
                                {filteredCoins.length} Ergebnis{filteredCoins.length !== 1 ? 'se' : ''}
                            </span>
                        )}
                    </div>

                    <div className="coins-layout">
                        <div className="coins-table-col">
                            <div className="coins-table-wrap">
                                <table className="coins-table">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Name</th>
                                            <th>Preis</th>
                                            <th>24h</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredCoins.length > 0 ? (
                                            filteredCoins.map((coin, index) => (
                                                <tr
                                                    key={coin.id}
                                                    className={`coins-table-row-clickable${effectiveSelectedId === coin.id ? ' is-selected' : ''}`}
                                                    onClick={() => setSelectedId(coin.id)}
                                                >
                                                    <td className="rank-cell">{index + 1}</td>
                                                    <td>
                                                        <span className="coin-name-text">{coin.name}</span>
                                                        <span className="coin-symbol-small">{coin.symbol}</span>
                                                    </td>
                                                    <td className="price-cell">
                                                        {coin.price.toLocaleString('de-AT', {
                                                            style: 'currency', currency: 'USD',
                                                            minimumFractionDigits: 2, maximumFractionDigits: 4,
                                                        })}
                                                    </td>
                                                    <td className={chgClass(coin.change24h)}>
                                                        {chgSign(coin.change24h)}{coin.change24h.toFixed(2)}%
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={4} className="search-no-results">
                                                    Keine Coins gefunden für „{searchQuery}"
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {selected && (
                            <div className="coin-detail-col">
                                <div className="coin-detail-header">
                                    <div className="coin-detail-title">
                                        <span className="coin-detail-rank">#{selected.rank}</span>
                                        <h2>{selected.name}</h2>
                                        <span className="coin-detail-symbol">{selected.symbol}</span>
                                    </div>
                                    <div className="coin-detail-price">
                                        <span className="coin-price-big">{fmt(selected.price_usd, 4)}</span>
                                        <span className={`coin-change-badge ${chgClass(selected.percent_change_24h)}`}>
                                            {Number(selected.percent_change_24h) >= 0 ? '▲' : '▼'}{' '}
                                            {Math.abs(Number(selected.percent_change_24h)).toFixed(2)}% (24h)
                                        </span>
                                    </div>
                                </div>

                                <div className="coin-chart-wrap">
                                    <div className="coin-chart-title">Preisverlauf (simuliert)</div>
                                    <MiniChart coin={selected} />
                                </div>

                                <div className="coin-changes-grid">
                                    {[
                                        { label: '1 Stunde', val: selected.percent_change_1h },
                                        { label: '24 Stunden', val: selected.percent_change_24h },
                                        { label: '7 Tage', val: selected.percent_change_7d },
                                    ].map(({ label, val }) => (
                                        <div key={label} className="coin-change-card">
                                            <span className="coin-change-label">{label}</span>
                                            <span className={`coin-change-value ${chgClass(val)}`}>
                                                {chgSign(val)}{val}%
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="coin-stats-grid">
                                    <div className="coin-stat-card">
                                        <span className="coin-stat-label">Marktkapitalisierung</span>
                                        <span className="coin-stat-value">{fmt(selected.market_cap_usd, 0)}</span>
                                    </div>
                                    <div className="coin-stat-card">
                                        <span className="coin-stat-label">24h Volumen</span>
                                        <span className="coin-stat-value">{fmt(selected.volume24, 0)}</span>
                                    </div>
                                    <div className="coin-stat-card">
                                        <span className="coin-stat-label">Umlaufmenge</span>
                                        <span className="coin-stat-value">{fmtNum(selected.csupply)} {selected.symbol}</span>
                                    </div>
                                    {selected.msupply && (
                                        <div className="coin-stat-card">
                                            <span className="coin-stat-label">Max. Angebot</span>
                                            <span className="coin-stat-value">{fmtNum(selected.msupply)} {selected.symbol}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="coin-detail-goto">
                                    <button
                                        className="goto-detail-btn"
                                        onClick={() => navigate({ to: '/posts/$id', params: { id: selected.id } })}
                                    >
                                        Vollständige Details ansehen →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}