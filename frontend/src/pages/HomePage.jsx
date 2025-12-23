import { useEffect } from "react";
import "./HomePage.css";

const API_URL = import.meta.env.VITE_API_URL;
const BOT_USERNAME = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || "sabawians_bot";

export default function HomePage({ setUser }) {
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const raw = tg?.initDataUnsafe?.user;

    if (raw) {
      const user = {
        id: raw.id,
        first_name: raw.first_name,
        username: `ANTZ${raw.id}`,
        photo_url: raw.photo_url || ""
      };

      fetch(`${API_URL}/api/auth/telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(user),
      })
        .then((res) => res.json())
        .then((data) => {
          localStorage.setItem("token", data.token);
          setUser(data.user);
        })
        .catch((err) => console.error("Auto-login failed:", err));

      return;
    }

    window.onTelegramAuth = async (rawUser) => {
      const tgUser = {
        id: rawUser.id,
        first_name: rawUser.first_name,
        username: `ANTZ${rawUser.id}`,
        photo_url: rawUser.photo_url || ""
      };

      try {
        const response = await fetch(`${API_URL}/api/auth/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(tgUser),
        });

        const data = await response.json();
        localStorage.setItem("token", data.token);
        setUser(data.user);
      } catch (err) {
        console.error("Telegram auth error:", err);
      }
    };

    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", BOT_USERNAME);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "8");
    script.setAttribute("data-request-access", "write");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    script.async = true;

    const container = document.getElementById("telegram-login-container");
    if (container) {
      container.innerHTML = "";
      container.appendChild(script);
    }

    return () => {
      window.onTelegramAuth = null;
    };
  }, [setUser]);

  const tg = window.Telegram?.WebApp;
  const telegramUser = tg?.initDataUnsafe?.user;

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
              courage through challenges, earn rewards, and compete for the
              honor of joining her quest.
            </p>
          </div>

          {!telegramUser && (
            <div className="login-section">
              <div className="login-card">
                <h2 className="login-title">Begin Your Journey</h2>
                <p className="login-text">
                  Login with your Telegram account to enter the realm of Axum
                </p>

                <div
                  id="telegram-login-container"
                  className="telegram-login"
                ></div>
              </div>
            </div>
          )}

          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">🎮</span>
              <h3 className="feature-title">6 Epic Levels</h3>
              <p className="feature-text">
                Progress through challenges that test your dedication and skill.
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">👑</span>
              <h3 className="feature-title">Compete & Rise</h3>
              <p className="feature-text">
                Climb the leaderboard and become one of the finalists.
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">💎</span>
              <h3 className="feature-title">Win Rewards</h3>
              <p className="feature-text">
                Earn points, badges, and exclusive sponsor benefits.
              </p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">📜</span>
              <h3 className="feature-title">Complete Tasks</h3>
              <p className="feature-text">
                Subscribe, follow, share, and invite to gather points.
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
