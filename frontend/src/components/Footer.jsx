import "./Footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand">
            <span className="footer-icon">⚜️</span>
            <h3 className="footer-title">AXUM</h3>
            <p className="footer-tagline">Walk in the footsteps of Queen Makeda</p>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-quote">
            <p className="quote-text">
              "Only the smartest and most courageous will join the journey to Jerusalem"
            </p>
            <p className="quote-attribution">— Queen Makeda of Saba, 959 BC</p>
          </div>

          <div className="footer-divider"></div>

          <div className="footer-info">
            <p className="footer-text">
              A SABA Company Experience | Powered by Ethiopian Heritage
            </p>
            <p className="footer-copyright">
              © {currentYear} Axum. All rights reserved.
            </p>
          </div>
        </div>

        <div className="footer-pattern"></div>
      </div>
    </footer>
  );
}
