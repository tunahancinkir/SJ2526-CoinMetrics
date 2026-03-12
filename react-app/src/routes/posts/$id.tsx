// src/routes/posts/$id.tsx
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { StarRating } from '../../components/StarRating'

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

    const w = 600
    const h = 160
    const pad = { top: 12, right: 16, bottom: 32, left: 16 }
    const chartW = w - pad.left - pad.right
    const chartH = h - pad.top - pad.bottom

    const toX = (i: number) => pad.left + (i / (points.length - 1)) * chartW
    const toY = (price: number) => pad.top + chartH - ((price - min) / range) * chartH

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.price)}`).join(' ')
    const areaD = `${pathD} L ${toX(points.length - 1)} ${h - pad.bottom} L ${toX(0)} ${h - pad.bottom} Z`

    const isPositive = Number(coin.percent_change_7d) >= 0
    const color = isPositive ? '#4ade80' : '#f87171'
    const gradId = `grad-detail-${coin.id}`

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="coin-chart-svg coin-chart-svg--large" aria-label={`Preisverlauf ${coin.name}`}>
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75, 1].map(t => (
                <line
                    key={t}
                    x1={pad.left} y1={pad.top + chartH * (1 - t)}
                    x2={pad.left + chartW} y2={pad.top + chartH * (1 - t)}
                    stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                />
            ))}
            <path d={areaD} fill={`url(#${gradId})`} />
            <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
                <circle key={i} cx={toX(i)} cy={toY(p.price)} r={i === points.length - 1 ? 5 : 3} fill={color} opacity={i === points.length - 1 ? 1 : 0.5} />
            ))}
            {points.map((p, i) => (
                <text key={i} x={toX(i)} y={h - 8} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.4)">
                    {p.label}
                </text>
            ))}
        </svg>
    )
}

function CoinDetail() {
    const { id } = Route.useParams()
    const [coin, setCoin] = useState<Coin | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
                        <div className="coin-chart-title">Preisverlauf (simuliert)</div>
                        <MiniChart coin={coin} />
                    </div>

                    <div className="coin-detail-rating-section">
                        <h2 className="coin-detail-section-title">Community Bewertung</h2>
                        <div className="coin-detail-rating-wrap">
                            <StarRating coinId={coin.id} coinName={coin.name} size="large" />
                        </div>
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