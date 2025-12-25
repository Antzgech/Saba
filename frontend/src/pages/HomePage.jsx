import React, { useEffect, useState } from "react";
import "./HomePage.css";

function HomePage({ setUser }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // 1. Check if Telegram WebApp exists
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
      const telegramUser = tg.initDataUnsafe.user;

      console.log("Telegram WebApp user detected:", telegramUser);

      authenticateTelegramUser(telegramUser);
    } else {
      console.log("Not inside Telegram WebApp — showing normal homepage");
      setLoading(false);
    }
  }, []);

  // 2. Send Telegram user to backend
  const authenticateTelegramUser = async (telegramUser) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://saba-hbhv.vercel.app/api/auth/telegram",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(telegramUser),
        }
      );

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("axum_token", data.token);
        setUser(data.user);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Authentication failed");
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  // 3. Demo login fallback
  const handleDemoLogin = () => {
    const demoUser = {
      id: "demo-" + Date.now(),
      username: "DemoUser",
      first_name: "Demo",
      points: 0,
      currentLevel: 1,
    };

    localStorage.setItem("axum_token", "demo-token");
    setUser(demoUser);
  };

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-background"></div>

        <div className="hero-content">
          <div className="hero-icon-large">⚜️</div>

          <h1 className="hero-title">
            <span className="title-line">WELCOME TO</span>
            <span className="title-main">AXUM</span>
          </h1>

          <p className="hero-subtitle">
            Join Queen Makeda's quest to find the wisest and most courageous
          </p>

          <div className="hero-description">
            <p>
              In the ancient land of Saba, Queen Makeda seeks worthy companions
              for her legendary journey to Jerusalem. Prove your wisdom and
              courage through challenges, earn divine rewards, and compete for
              the honor of joining her quest.
            </p>
          </div>

          <div className="login-section">
            <div className="login-card">
              <h2 className="login-title">Begin Your Journey</h2>

              {loading && (
                <div className="loading-spinner-small">
                  <div className="spinner"></div>
                  <p>Authenticating...</p>
                </div>
              )}

              {!loading && (
                <>
                  {error && (
                    <div className="error-message">
                      <p>⚠️ {error}</p>
                    </div>
                  )}

                  <div className="login-divider">
                    <span>OR</span>
                  </div>

                  <button
                    className="btn btn-secondary demo-login-btn"
                    onClick={handleDemoLogin}
                  >
                    🎮 Try Demo Mode
                  </button>

                  <p className="demo-notice">
                    <small>Demo mode lets you explore without Telegram</small>
                  </p>
                </>
              )}
            </div>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🎮</span>
              <h3 className="feature-title">6 Epic Levels</h3>
              <p className="feature-text">
                Progress through challenges that test your dedication and skill
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">👑</span>
              <h3 className="feature-title">Compete & Rise</h3>
              <p className="feature-text">
                Climb the leaderboard and become one of the chosen 30 finalists
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">💎</span>
              <h3 className="feature-title">Win Rewards</h3>
              <p className="feature-text">
                Earn cash, points, badges, and exclusive sponsor benefits
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">📜</span>
              <h3 className="feature-title">Complete Tasks</h3>
              <p className="feature-text">
                Subscribe, follow, share, and invite to gather points
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="sponsors-preview">
        <div className="sponsors-container">
          <h2 className="sponsors-title">Supported By</h2>
          <div className="sponsors-logos">
            <div className="sponsor-placeholder">SABA Company</div>
            <div className="sponsor-placeholder">Partner 1</div>
            <div className="sponsor-placeholder">Partner 2</div>
            <div className="sponsor-placeholder">Partner 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
