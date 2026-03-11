// src/routes/about.tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
    component: About,
})

function About() {
    return (
        <div className="about-container">
            <div className="about-header">
                <h1>Impressum</h1>
                <p className="lead">Angaben gemäß § 5 TMG</p>
            </div>

            <section className="about-section">
                <h2>Projektverantwortliche</h2>
                <p>
                    Dieses Projekt wurde im Rahmen des Schulunterrichts entwickelt von:
                </p>
                <ul>
                    <li><strong>Duje Barukcic</strong></li>
                    <li><strong>Cinkir Tunahan</strong></li>
                    <li><strong>Hossain Nihad</strong></li>
                    <li><strong>Vamberger Maximilian</strong></li>
                </ul>
            </section>

            <section className="about-section">
                <h2>Über das Projekt</h2>
                <p>
                    <strong>CoinMetrics</strong> ist eine Webanwendung, die aktuelle und übersichtliche
                    Informationen über den Kryptowährungsmarkt bereitstellt. Die Idee entstand
                    spontan im Unterricht mit dem Ziel, Echtzeit-Marktdaten benutzerfreundlich
                    darzustellen.
                </p>
                <p>
                    Die Anwendung ruft Daten aus dem Kryptowährungsmarkt ab, bereitet sie auf
                    und stellt sie übersichtlich dar — inklusive Preisen, Marktkapitalisierungen
                    und Kursveränderungen.
                </p>
            </section>

            <section className="about-section">
                <h2>Funktionen</h2>
                <div className="features-list">
                    <div className="feature-item">
                        <h3>📊 Globale Marktübersicht</h3>
                        <p>
                            Anzeige der Gesamtmarktkapitalisierung und des 24h-Handelsvolumens,
                            damit der Nutzer sofort erkennt, ob der Markt gerade wächst oder fällt.
                        </p>
                    </div>
                    <div className="feature-item">
                        <h3>📋 Coin-Liste</h3>
                        <p>
                            Übersicht der Kryptowährungen, sortiert nach Marktkapitalisierung,
                            mit aktuellem Preis sowie Kursveränderungen der letzten Stunde,
                            24 Stunden und 7 Tage.
                        </p>
                    </div>
                    <div className="feature-item">
                        <h3>🔍 Suche & Sortierung</h3>
                        <p>
                            Suchfunktion nach Kryptowährungen sowie Sortierfunktion
                            nach Preis, Rang oder 24h-Veränderung.
                        </p>
                    </div>
                    <div className="feature-item">
                        <h3>🟢 Farbliche Kennzeichnung</h3>
                        <p>
                            Positive Kursveränderungen werden grün, negative rot
                            hervorgehoben — für eine schnelle visuelle Orientierung.
                        </p>
                    </div>
                </div>
            </section>

            <section className="about-section">
                <h2>Technologie & Datenquelle</h2>
                <h3>Verwendete API</h3>
                <p>
                    Als Datenquelle wird die kostenlose und öffentlich zugängliche{' '}
                    <strong>CoinLore Cryptocurrency API</strong> (<code>api.coinlore.net</code>)
                    verwendet. Diese API erfordert keine Registrierung oder einen API-Key und
                    liefert Daten zu über 14.000 Kryptowährungen und mehr als 300 Börsen.
                </p>
                <h3>Tech-Stack</h3>
                <ul>
                    <li><strong>React 19</strong> — UI-Framework</li>
                    <li><strong>TypeScript</strong> — Typsichere Entwicklung</li>
                    <li><strong>Vite</strong> — Build-Tool & Dev-Server</li>
                    <li><strong>TanStack Router</strong> — Clientseitiges Routing</li>
                    <li><strong>CoinLore API</strong> — Kryptodaten in Echtzeit</li>
                </ul>
            </section>

            <section className="about-section">
                <h2>Haftungsausschluss</h2>
                <p>
                    Diese Website wird ausschließlich zu <strong>Bildungszwecken</strong> im Rahmen
                    eines Schulprojekts bereitgestellt. Die dargestellten Daten stammen von der
                    CoinLore API und werden ohne Gewähr auf Richtigkeit oder Vollständigkeit
                    angezeigt.
                </p>
                <p>
                    Die Inhalte dieser Website stellen <strong>keine Finanz- oder Anlageberatung</strong> dar.
                    Entscheidungen auf Basis der hier angezeigten Daten erfolgen auf eigene Verantwortung.
                </p>
            </section>

            <section className="about-section">
                <h2>Urheberrecht</h2>
                <p>
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
                    unterliegen dem österreichischen Urheberrecht. Kryptowährungsdaten werden über die
                    CoinLore API bereitgestellt und sind Eigentum der jeweiligen Anbieter.
                </p>
            </section>
        </div>
    )
}