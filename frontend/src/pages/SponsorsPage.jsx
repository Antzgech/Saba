import "./SponsorsPage.css";

export default function SponsorsPage() {
  const sponsors = [
    { name: "SABA Company", logo: "⚜️", url: "https://saba.com", tier: "platinum" },
    { name: "Sponsor A", logo: "🏛️", url: "#", tier: "gold" },
    { name: "Sponsor B", logo: "💼", url: "#", tier: "gold" },
    { name: "Sponsor C", logo: "🌟", url: "#", tier: "silver" },
    { name: "Sponsor D", logo: "🎯", url: "#", tier: "silver" },
    { name: "Sponsor E", logo: "🚀", url: "#", tier: "bronze" }
  ];

  return (
    <div className="sponsors-page">
      <div className="sponsors-header">
        <h1 className="sponsors-title">Our Partners</h1>
        <p className="sponsors-subtitle">
          Supporting Queen Makeda's quest with generous contributions
        </p>
      </div>

      <div className="sponsors-container">
        <div className="platinum-sponsors">
          <h2 className="tier-title">Platinum Partners</h2>
          <div className="sponsors-grid platinum-grid">
            {sponsors
              .filter((s) => s.tier === "platinum")
              .map((sponsor, i) => (
                <a
                  key={i}
                  href={sponsor.url}
                  className="sponsor-card platinum-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sponsor-logo-large">{sponsor.logo}</span>
                  <h3 className="sponsor-name">{sponsor.name}</h3>
                  <p className="sponsor-tier">Platinum Partner</p>
                </a>
              ))}
          </div>
        </div>

        <div className="gold-sponsors">
          <h2 className="tier-title">Gold Partners</h2>
          <div className="sponsors-grid gold-grid">
            {sponsors
              .filter((s) => s.tier === "gold")
              .map((sponsor, i) => (
                <a
                  key={i}
                  href={sponsor.url}
                  className="sponsor-card gold-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sponsor-logo">{sponsor.logo}</span>
                  <h3 className="sponsor-name">{sponsor.name}</h3>
                </a>
              ))}
          </div>
        </div>

        <div className="other-sponsors">
          <h2 className="tier-title">Supporting Partners</h2>
          <div className="sponsors-grid support-grid">
            {sponsors
              .filter((s) => s.tier === "silver" || s.tier === "bronze")
              .map((sponsor, i) => (
                <a
                  key={i}
                  href={sponsor.url}
                  className="sponsor-card support-card"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sponsor-logo-small">{sponsor.logo}</span>
                  <p className="sponsor-name-small">{sponsor.name}</p>
                </a>
              ))}
          </div>
        </div>
      </div>

      <div className="become-sponsor">
        <h2>Become a Partner</h2>
        <p>
          Join us in supporting Queen Makeda's quest and reach thousands of
          engaged participants
        </p>
        <button className="btn btn-primary">Contact Us</button>
      </div>
    </div>
  );
}
