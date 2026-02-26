import '../App.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-content">
          <h3>CoinMetrics</h3>
          <p className="footer-description">
            Echtzeit-Daten des Kryptowährungsmarkts mit Informationen zur Marktkapitalisierung, 24h-Volumen und Kursveränderungen.
          </p>
          <p className="footer-info">
            <strong>Datenquelle:</strong> CoinLore Cryptocurrency API (api.coinlore.net)
          </p>
        </div>
        <div className="footer-bottom">
          <p>Unterrichtsprojekt — © {currentYear} CoinMetrics. Alle Rechte vorbehalten.</p>
          <p className="footer-small">Diese Website wird zu Bildungszwecken bereitgestellt.</p>
        </div>
      </div>
    </footer>
  )
}
