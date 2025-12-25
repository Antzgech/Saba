import React, { useEffect, useState } from 'react';
import './HomePage.css';

function HomePage({ setUser }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load Telegram Login Widget Script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'SABA_axumBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-request-access', 'write');

    // Correct callback syntax
    script.setAttribute('data-onauth', 'window.onTelegramAuth(user)');
    script.async = true;

    const container = document.getElementById('telegram-login-container');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }

    // Define global callback
    window.onTelegramAuth = async (telegramUser) => {
      console.log('Telegram auth received:', telegramUser);
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('https://saba-hbhv.vercel.app/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramUser),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('axum_token', data.token);
          setUser(data.user);
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Authentication failed');
        }
      } catch (err) {
        console.error('Auth error:', err);
        setError('Failed to connect to server. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    return () => {
      window.onTelegramAuth = null;
    };
  }, [setUser]);

  // Demo login for testing without Telegram
  const handleDemoLogin = async () => {
    setLoading(true);
    setError(null);

    const demoUser = {
      id: Math.floor(Math.random() * 1000000),
      first_name: 'Demo User',
      username: 'demo_user_' + Date.now(),
      auth_date: Math.floor(Date.now() / 1000),
      hash: 'demo_hash'
    };

    try {
      const response = await fetch('https://saba-hbhv.vercel.app/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoUser),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('axum_token', data.token);
        setUser(data.user);
      } else {
        // Local fallback session
        localStorage.setItem('axum_token', 'demo_token_' + demoUser.id);
        setUser({
          id: demoUser.id.toString(),
          username: demoUser.username,
          first_name: demoUser.first_name,
          points: 0,
          currentLevel: 1,
          badges: []
        });
      }
    } catch (err) {
      console.error('Demo login error:', err);
      localStorage.setItem('axum_token', 'demo_token_' + demoUser.id);
      setUser({
        id: demoUser.id.toString(),
        username: demoUser.username,
        first_name: demoUser.first_name,
        points: 0,
        currentLevel: 1,
        badges: []
      });
    } finally {
      setLoading(false);
    }
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
              for her legendary journey to Jerusalem. Prove your wisdom and courage
              through challenges, earn divine rewards, and compete for the honor
              of joining her quest.
            </p>
          </div>

          <div className="login-section">
            <div className="login-card">
              <h2 className="login-title">Begin Your Journey</h2>
              <p className="login-text">
                Connect your Telegram account to enter the realm of Axum
              </p>

              {error && (
                <div className="error-message">
                  <p>⚠️ {error}</p>
                </div>
              )}

              {loading ? (
                <div className="loading-spinner-small">
                  <div className="spinner"></div>
                  <p>Authenticating...</p>
                </div>
              ) : (
                <>
                  <div id="telegram-login-container" className="telegram-login"></div>

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
