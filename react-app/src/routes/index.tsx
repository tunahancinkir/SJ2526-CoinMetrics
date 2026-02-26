// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
    component: Index,
})

function Index() {
    return (
        <div className="coins-container">
            <section className="hero-section">
                <h1>💰 CoinMetrics</h1>
                <p className="hero-subtitle">Echtzeit-Daten des Kryptowährungsmarkts</p>
                <p className="hero-description">
                    Verfolgen Sie die Top-Kryptowährungen mit aktuellen Preisen, Marktkapitalisierungen und 24h-Veränderungen.
                </p>
            </section>

            <section className="coins-section">
                <h2>Markt-Kryptowährungen</h2>
                <p className="section-info">Laden Sie einen Moment...</p>
                {/* Coin-Tabelle wird hier eingefügt */}
            </section>
        </div>
    )
}