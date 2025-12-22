import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

function HomePage({ setUser }) {
  const navigate = useNavigate();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    // Automatic login inside Telegram WebApp
    if (tg?.initDataUnsafe?.user) {
      const telegramUser = tg.initDataUnsafe.user;

      (async () => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telegramUser),
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('axum_token', data.token);
            setUser(data.user);
            navigate('/dashboard');
          } else {
            console.error('Auto-login failed');
          }
        } catch (error) {
          console.error('Auto-login error:', error);
        }
      })();
    } else {
      // Fallback login widget
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.setAttribute(
        'data-telegram-login',
        process.env.REACT_APP_TELEGRAM_BOT_USERNAME || 'sabawians_bot'
      );
      script.setAttribute('data-size', 'large');
      script.setAttribute('data-radius', '8');
      script.setAttribute('data-request-access', 'write');
      script.setAttribute('data-onauth', 'onTelegramAuth(user)');
      script.async = true;

      const loginContainer = document.getElementById('telegram-login-container');
      if (loginContainer) {
        loginContainer.innerHTML = '';
        loginContainer.appendChild(script);
      }

      window.onTelegramAuth = async (user) => {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/telegram`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
          });

          if (response.ok) {
            const data = await response.json();
            localStorage.setItem('axum_token', data.token);
            setUser(data.user);
            navigate('/dashboard');
          } else {
            console.error('Widget login failed');
          }
        } catch (error) {
          console.error('Widget login error:', error);
        }
      };
    }

    return () => {
      window.onTelegramAuth = null;
    };
  }, [setUser, navigate]);

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
              <p className="login-text">
                Connect your Telegram account to enter the realm of Axum
              </p>
              <div id="telegram-login-container" className="telegram-login"></div>
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
