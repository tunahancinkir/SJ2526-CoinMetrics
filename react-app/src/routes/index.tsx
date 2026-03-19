// src/routes/index.tsx
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useMemo, useRef, useState } from 'react'
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

const TIME_RANGES = [
    { label: '1D',  interval: '15m', limit: 96 },
    { label: '7D',  interval: '1h',  limit: 168 },
    { label: '1M',  interval: '4h',  limit: 180 },
    { label: '3M',  interval: '1d',  limit: 90 },
    { label: 'YTD', interval: '1d',  limit: 0 },
] as const
type TimeRangeLabel = typeof TIME_RANGES[number]['label']

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

function MiniChart({ coin, historyPoints }: { coin: Coin; historyPoints?: { label: string; price: number }[] }) {
    const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
    const svgRef = useRef<SVGSVGElement>(null)

    const points = historyPoints ?? buildChartPoints(coin)
    const prices = points.map(p => p.price)
    const rawMin = Math.min(...prices)
    const rawMax = Math.max(...prices)
    const padding = (rawMax - rawMin) * 0.08 || rawMax * 0.02
    const min = rawMin - padding
    const max = rawMax + padding
    const range = max - min

    const w = 400
    const h = 140
    const pad = { top: 12, right: 10, bottom: 30, left: 62 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom

    const toX = (i: number) => pad.left + (i / (points.length - 1)) * chartW
    const toY = (price: number) => pad.top + chartH - ((price - min) / range) * chartH

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(p.price).toFixed(2)}`).join(' ')
    const areaD = `${pathD} L ${toX(points.length - 1).toFixed(2)} ${h - pad.bottom} L ${toX(0).toFixed(2)} ${h - pad.bottom} Z`

    const isPositive = historyPoints
        ? prices[prices.length - 1] >= prices[0]
        : Number(coin.percent_change_7d) >= 0
    const color = isPositive ? '#4ade80' : '#f87171'
    const gradId = `grad-${coin.id}`

    const labelStep = Math.max(1, Math.ceil(points.length / 4))

    const yTicks = [0, 0.33, 0.67, 1].map(t => min + t * range)
    const fmtY = (price: number) => {
        if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(1)}M`
        if (price >= 1_000) return `$${(price / 1_000).toFixed(price >= 10_000 ? 1 : 2)}K`
        if (price >= 1) return `$${price.toFixed(2)}`
        if (price >= 0.01) return `$${price.toFixed(4)}`
        return `$${price.toPrecision(3)}`
    }

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect()
        const mouseX = ((e.clientX - rect.left) / rect.width) * w
        let closest = 0
        let minDist = Infinity
        points.forEach((_, i) => {
            const dist = Math.abs(toX(i) - mouseX)
            if (dist < minDist) { minDist = dist; closest = i }
        })
        setHoveredIdx(closest)
    }

    const fmtPrice = (price: number) =>
        price.toLocaleString('de-AT', {
            style: 'currency', currency: 'USD',
            minimumFractionDigits: price >= 1 ? 2 : 4,
            maximumFractionDigits: price >= 100 ? 2 : price >= 1 ? 4 : 6,
        })

    const hov = hoveredIdx !== null ? points[hoveredIdx] : null
    const tipW = 120
    const tipH = 38
    const tipX = hov && hoveredIdx !== null
        ? (toX(hoveredIdx) + tipW + 10 > w - pad.right
            ? toX(hoveredIdx) - tipW - 10
            : toX(hoveredIdx) + 10)
        : 0
    const tipY = hov && hoveredIdx !== null
        ? Math.max(pad.top, Math.min(toY(hov.price) - tipH / 2, h - pad.bottom - tipH))
        : 0

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${w} ${h}`}
            className="coin-chart-svg"
            aria-label={`Preisverlauf ${coin.name}`}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: 'crosshair' }}
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Y-axis grid + labels */}
            {yTicks.map((tick, i) => (
                <g key={i}>
                    <line
                        x1={pad.left} y1={toY(tick)}
                        x2={pad.left + chartW} y2={toY(tick)}
                        stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                    />
                    <text x={pad.left - 6} y={toY(tick) + 3.5} textAnchor="end" fontSize="8.5" fill="rgba(255,255,255,0.28)" fontFamily="monospace">
                        {fmtY(tick)}
                    </text>
                </g>
            ))}
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            <path d={areaD} fill={`url(#${gradId})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />

            {!hov && <circle cx={toX(points.length - 1)} cy={toY(prices[prices.length - 1])} r={3} fill={color} />}

            {points.map((p, i) => (
                (i % labelStep === 0 || i === points.length - 1) && (
                    <text key={i} x={toX(i)} y={h - 8} textAnchor="middle" fontSize="8.5" fill="rgba(255,255,255,0.28)">
                        {p.label}
                    </text>
                )
            ))}

            {hov !== null && hoveredIdx !== null && (
                <>
                    <line
                        x1={toX(hoveredIdx)} y1={pad.top}
                        x2={toX(hoveredIdx)} y2={h - pad.bottom}
                        stroke="rgba(255,255,255,0.18)" strokeWidth="1" strokeDasharray="4,3"
                    />
                    <circle cx={toX(hoveredIdx)} cy={toY(hov.price)} r={3.5} fill={color} stroke="rgba(11,18,32,1)" strokeWidth="2" />
                    <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={5} fill="rgba(11,18,32,0.96)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <text x={tipX + 10} y={tipY + 14} fontSize="8" fill="rgba(255,255,255,0.45)">{hov.label}</text>
                    <text x={tipX + 10} y={tipY + 29} fontSize="11" fontWeight="700" fill={color}>{fmtPrice(hov.price)}</text>
                </>
            )}
        </svg>
    )
}

function Index() {
    const [coins, setCoins] = useState<Coin[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedHistory, setSelectedHistory] = useState<{ label: string; price: number }[] | null>(null)
    const [timeRange, setTimeRange] = useState<TimeRangeLabel>('1D')
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

    useEffect(() => {
        const symbol = coins.find(c => c.id === effectiveSelectedId)?.symbol
        if (!symbol) return
        const range = TIME_RANGES.find(r => r.label === timeRange)!
        const controller = new AbortController()
        setSelectedHistory(null)
        ;(async () => {
            try {
                const ytdStart = new Date(new Date().getFullYear(), 0, 1).getTime()
                const qs = range.label === 'YTD'
                    ? `startTime=${ytdStart}&endTime=${Date.now()}`
                    : `limit=${range.limit}`
                const res = await fetch(
                    `https://api.binance.com/api/v3/klines?symbol=${symbol}USDT&interval=${range.interval}&${qs}`,
                    { signal: controller.signal },
                )
                if (!res.ok) throw new Error()
                const raw: [number, string, string, string, string][] = await res.json()
                if (!raw?.length) throw new Error()
                const fmt: Intl.DateTimeFormatOptions =
                    range.interval === '15m' ? { hour: '2-digit', minute: '2-digit' }
                    : { day: 'numeric', month: 'short' }
                setSelectedHistory(raw.map(k => ({
                    label: new Date(k[0]).toLocaleDateString('de-AT', fmt),
                    price: Number(k[4]),
                })))
            } catch {
                setSelectedHistory(null)
            }
        })()
        return () => controller.abort()
    }, [effectiveSelectedId, coins, timeRange])

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
                                    <div className="coin-chart-header">
                                        <div className="coin-chart-title">Preisverlauf {selectedHistory ? '' : '(simuliert)'}</div>
                                        <div className="chart-range-selector">
                                            {TIME_RANGES.map(r => (
                                                <button
                                                    key={r.label}
                                                    className={`chart-range-btn${timeRange === r.label ? ' chart-range-btn--active' : ''}`}
                                                    onClick={() => setTimeRange(r.label)}
                                                >
                                                    {r.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <MiniChart coin={selected} historyPoints={selectedHistory ?? undefined} />
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