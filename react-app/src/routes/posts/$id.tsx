// src/routes/posts/$id.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useRef, useState, useCallback } from 'react'
import { StarRating } from '../../components/StarRating'
import { supabase } from '../../lib/supabase'

export const Route = createFileRoute('/posts/$id')({
    component: CoinDetail,
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

type RatingRow = {
    id: number
    rating: number
    updated_at: string
    user_id: string
    profiles?: { name: string } | null
}

const RATINGS_PER_PAGE = 15

const TIME_RANGES = [
    { label: '1D',  interval: '15m', limit: 96 },
    { label: '7D',  interval: '1h',  limit: 168 },
    { label: '1M',  interval: '4h',  limit: 180 },
    { label: '3M',  interval: '1d',  limit: 90 },
    { label: 'YTD', interval: '1d',  limit: 0 },
    { label: '1J',  interval: '1w',  limit: 52 },
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

    const w = 600
    const h = 180
    const pad = { top: 16, right: 16, bottom: 36, left: 68 }
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
    const gradId = `grad-detail-${coin.id}`

    const labelStep = Math.max(1, Math.ceil(points.length / 4))

    const yTicks = [0, 0.25, 0.5, 0.75, 1].map(t => min + t * range)
    const fmtY = (price: number) => {
        if (price >= 1_000_000) return `$${(price / 1_000_000).toFixed(2)}M`
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
    const tipW = 148
    const tipH = 42
    const tipX = hov && hoveredIdx !== null
        ? (toX(hoveredIdx) + tipW + 14 > w - pad.right
            ? toX(hoveredIdx) - tipW - 14
            : toX(hoveredIdx) + 14)
        : 0
    const tipY = hov && hoveredIdx !== null
        ? Math.max(pad.top, Math.min(toY(hov.price) - tipH / 2, h - pad.bottom - tipH))
        : 0

    return (
        <svg
            ref={svgRef}
            viewBox={`0 0 ${w} ${h}`}
            className="coin-chart-svg coin-chart-svg--large"
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

            {yTicks.map((tick, i) => (
                <g key={i}>
                    <line
                        x1={pad.left} y1={toY(tick)}
                        x2={pad.left + chartW} y2={toY(tick)}
                        stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                    />
                    <text
                        x={pad.left - 8} y={toY(tick) + 4}
                        textAnchor="end" fontSize="9.5"
                        fill="rgba(255,255,255,0.28)" fontFamily="monospace"
                    >
                        {fmtY(tick)}
                    </text>
                </g>
            ))}

            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={h - pad.bottom} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            <path d={areaD} fill={`url(#${gradId})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />

            {!hov && (
                <circle cx={toX(points.length - 1)} cy={toY(prices[prices.length - 1])} r={3.5} fill={color} />
            )}

            {points.map((p, i) => (
                (i % labelStep === 0 || i === points.length - 1) && (
                    <text key={i} x={toX(i)} y={h - 10} textAnchor="middle" fontSize="9.5" fill="rgba(255,255,255,0.3)">
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
                    <circle cx={toX(hoveredIdx)} cy={toY(hov.price)} r={4} fill={color} stroke="rgba(11,18,32,1)" strokeWidth="2" />
                    <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={6} fill="rgba(11,18,32,0.96)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                    <text x={tipX + 12} y={tipY + 15} fontSize="9" fill="rgba(255,255,255,0.45)">{hov.label}</text>
                    <text x={tipX + 12} y={tipY + 31} fontSize="13" fontWeight="700" fill={color}>{fmtPrice(hov.price)}</text>
                </>
            )}
        </svg>
    )
}

// ── Community Ratings Liste mit Pagination ─────────────────────────────────
function CommunityRatings({ coinId }: { coinId: string }) {
    const [ratings, setRatings] = useState<RatingRow[]>([])
    const [totalCount, setTotalCount] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [isLoading, setIsLoading] = useState(true)

    const totalPages = Math.ceil(totalCount / RATINGS_PER_PAGE)

    const fetchRatings = useCallback(async (page: number) => {
        setIsLoading(true)
        const from = (page - 1) * RATINGS_PER_PAGE
        const to = from + RATINGS_PER_PAGE - 1

        const { data, count, error } = await supabase
            .from('coin_ratings')
            .select('id, rating, updated_at, user_id', { count: 'exact' })
            .eq('coin_id', coinId)
            .order('updated_at', { ascending: false })
            .range(from, to)

        if (!error && data) {
            setRatings(data)
            setTotalCount(count ?? 0)
        }
        setIsLoading(false)
    }, [coinId])

    useEffect(() => {
        void fetchRatings(currentPage)
    }, [fetchRatings, currentPage])

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleDateString('de-AT', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })

    const renderStars = (rating: number) =>
        [1, 2, 3, 4, 5].map(s => (
            <span key={s} style={{ color: s <= rating ? '#f5c518' : 'rgba(255,255,255,0.15)', fontSize: '1rem' }}>★</span>
        ))

    if (isLoading) return <p className="section-info">Bewertungen werden geladen...</p>
    if (totalCount === 0) return <p className="section-info" style={{ color: '#475569' }}>Noch keine Bewertungen vorhanden.</p>

    return (
        <div className="community-ratings">
            <p className="community-ratings-meta">
                {totalCount} Bewertung{totalCount !== 1 ? 'en' : ''} insgesamt
            </p>

            <ul className="ratings-list">
                {ratings.map((row, idx) => (
                    <li key={row.id} className="ratings-list-item">
                        <div className="ratings-list-left">
                            <span className="ratings-user-avatar">
                                {String.fromCodePoint(0x1F464)}
                            </span>
                            <div className="ratings-user-info">
                                <span className="ratings-user-name">
                                    User #{(currentPage - 1) * RATINGS_PER_PAGE + idx + 1}
                                </span>
                                <span className="ratings-date">{fmtDate(row.updated_at)}</span>
                            </div>
                        </div>
                        <div className="ratings-stars">
                            {renderStars(row.rating)}
                            <span className="ratings-value">{row.rating}/5</span>
                        </div>
                    </li>
                ))}
            </ul>

            {totalPages > 1 && (
                <div className="ratings-pagination">
                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        ← Zurück
                    </button>

                    <div className="pagination-pages">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                className={`pagination-page-btn ${currentPage === page ? 'pagination-page-btn--active' : ''}`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </button>
                        ))}
                    </div>

                    <button
                        className="pagination-btn"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        Nächste →
                    </button>
                </div>
            )}
        </div>
    )
}

function CoinDetail() {
    const { id } = Route.useParams()
    const [coin, setCoin] = useState<Coin | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [historyPoints, setHistoryPoints] = useState<{ label: string; price: number }[] | null>(null)
    const [timeRange, setTimeRange] = useState<TimeRangeLabel>('1D')
    const [showRatings, setShowRatings] = useState(false)

    useEffect(() => {
        const controller = new AbortController()
        const load = async () => {
            setIsLoading(true)
            setError(null)
            try {
                const res = await fetch(`https://api.coinlore.net/api/ticker/?id=${id}`, {
                    signal: controller.signal,
                })
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const data: Coin[] = await res.json()
                if (!data || data.length === 0) throw new Error('Coin nicht gefunden')
                setCoin(data[0])
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') return
                setError('Coin-Daten konnten nicht geladen werden.')
            } finally {
                setIsLoading(false)
            }
        }
        void load()
        return () => controller.abort()
    }, [id])

    useEffect(() => {
        if (!coin) return
        const range = TIME_RANGES.find(r => r.label === timeRange)!
        const controller = new AbortController()
        setHistoryPoints(null)
        ;(async () => {
            try {
                const ytdStart = new Date(new Date().getFullYear(), 0, 1).getTime()
                const qs = range.label === 'YTD'
                    ? `startTime=${ytdStart}&endTime=${Date.now()}`
                    : `limit=${range.limit}`
                const res = await fetch(
                    `https://api.binance.com/api/v3/klines?symbol=${coin.symbol}USDT&interval=${range.interval}&${qs}`,
                    { signal: controller.signal },
                )
                if (!res.ok) throw new Error()
                const raw: [number, string, string, string, string][] = await res.json()
                if (!raw?.length) throw new Error()
                const fmt: Intl.DateTimeFormatOptions =
                    range.interval === '15m' ? { hour: '2-digit', minute: '2-digit' }
                    : range.interval === '1w' ? { month: 'short', year: '2-digit' }
                    : { day: 'numeric', month: 'short' }
                setHistoryPoints(raw.map(k => ({
                    label: new Date(k[0]).toLocaleDateString('de-AT', fmt),
                    price: Number(k[4]),
                })))
            } catch {
                setHistoryPoints(null)
            }
        })()
        return () => controller.abort()
    }, [coin?.symbol, timeRange])

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
        <div className="coin-detail-page">
            <div className="coin-detail-back">
                <Link to="/liste" className="back-link">← Zurück zur Liste</Link>
            </div>

            {isLoading && <p className="section-info">Coin-Daten werden geladen...</p>}
            {!isLoading && error && <p className="liste-error">{error}</p>}

            {!isLoading && !error && coin && (
                <div className="coin-detail-full">
                    <div className="coin-detail-header">
                        <div className="coin-detail-title">
                            <span className="coin-detail-rank">#{coin.rank}</span>
                            <h1>{coin.name}</h1>
                            <span className="coin-detail-symbol">{coin.symbol}</span>
                        </div>
                        <div className="coin-detail-price">
                            <span className="coin-price-big">{fmt(coin.price_usd, 4)}</span>
                            <span className={`coin-change-badge ${chgClass(coin.percent_change_24h)}`}>
                                {Number(coin.percent_change_24h) >= 0 ? '▲' : '▼'}{' '}
                                {Math.abs(Number(coin.percent_change_24h)).toFixed(2)}% (24h)
                            </span>
                        </div>
                    </div>

                    <div className="coin-chart-wrap coin-chart-wrap--full">
                        <div className="coin-chart-header">
                            <div className="coin-chart-title">Preisverlauf {historyPoints ? '' : '(simuliert)'}</div>
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
                        <MiniChart coin={coin} historyPoints={historyPoints ?? undefined} />
                    </div>

                    {/* Community Bewertung */}
                    <div className="coin-detail-rating-section">
                        <div className="coin-detail-rating-header">
                            <h2 className="coin-detail-section-title">Community Bewertung</h2>
                            <button
                                className="show-ratings-btn"
                                onClick={() => setShowRatings(prev => !prev)}
                            >
                                {showRatings ? 'Bewertungen ausblenden ▲' : 'Alle Bewertungen anzeigen ▼'}
                            </button>
                        </div>
                        <div className="coin-detail-rating-wrap">
                            <StarRating coinId={coin.id} coinName={coin.name} size="large" />
                        </div>

                        {showRatings && (
                            <div className="ratings-section-expanded">
                                <CommunityRatings coinId={coin.id} />
                            </div>
                        )}
                    </div>

                    <div className="coin-changes-grid">
                        {[
                            { label: '1 Stunde', val: coin.percent_change_1h },
                            { label: '24 Stunden', val: coin.percent_change_24h },
                            { label: '7 Tage', val: coin.percent_change_7d },
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
                            <span className="coin-stat-value">{fmt(coin.market_cap_usd, 0)}</span>
                        </div>
                        <div className="coin-stat-card">
                            <span className="coin-stat-label">24h Volumen</span>
                            <span className="coin-stat-value">{fmt(coin.volume24, 0)}</span>
                        </div>
                        <div className="coin-stat-card">
                            <span className="coin-stat-label">Umlaufmenge</span>
                            <span className="coin-stat-value">{fmtNum(coin.csupply)} {coin.symbol}</span>
                        </div>
                        {coin.msupply && (
                            <div className="coin-stat-card">
                                <span className="coin-stat-label">Max. Angebot</span>
                                <span className="coin-stat-value">{fmtNum(coin.msupply)} {coin.symbol}</span>
                            </div>
                        )}
                        <div className="coin-stat-card">
                            <span className="coin-stat-label">Gesamtangebot</span>
                            <span className="coin-stat-value">{fmtNum(coin.tsupply)} {coin.symbol}</span>
                        </div>
                        <div className="coin-stat-card">
                            <span className="coin-stat-label">Rang</span>
                            <span className="coin-stat-value">#{coin.rank}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}