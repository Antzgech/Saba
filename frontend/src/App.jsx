import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuth();
    loadTelegramWidget();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch('https://saba-hbhv.vercel.app/api/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      }
    }
    setLoading(false);
  }

  function loadTelegramWidget() {
    // Define callback BEFORE loading script
    window.onTelegramAuth = async (telegramUser) => {
      console.log('✅ Telegram login received:', telegramUser);
      
      try {
        const res = await fetch('https://saba-hbhv.vercel.app/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(telegramUser)
        });

        console.log('Response status:', res.status);

        if (res.ok) {
          const data = await res.json();
          console.log('✅ Login successful:', data);
          localStorage.setItem('token', data.token);
          setUser(data.user);
        } else {
          const errorData = await res.json();
          console.error('❌ Login failed:', errorData);
          setError('Login failed: ' + errorData.error);
        }
      } catch (err) {
        console.error('❌ Network error:', err);
        setError('Cannot connect to server');
      }
    };

    // Load Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'SABA_axumBot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;

    const container = document.getElementById('telegram-login');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
    }
  }

  async function handleDemoLogin() {
    console.log('🎮 Demo login clicked');
    
    const demoUser = {
      id: Date.now(),
      first_name: 'Demo User',
      username: 'demo_' + Date.now(),
      hash: 'demo_hash'
    };

    try {
      const res = await fetch('https://saba-hbhv.vercel.app/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoUser)
      });

      if (res.ok) {
        const data = await res.json();
        console.log('✅ Demo login successful');
        localStorage.setItem('token', data.token);
        setUser(data.user);
      } else {
        const errorData = await res.json();
        console.error('❌ Demo login failed:', errorData);
        setError('Demo login failed: ' + errorData.error);
      }
    } catch (err) {
      console.error('❌ Network error:', err);
      setError('Cannot connect to server');
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-box">
          <h1>⚜️ AXUM</h1>
          <h2>Welcome to Queen Makeda's Quest</h2>
          
          {error && (
            <div className="error-box">
              ⚠️ {error}
            </div>
          )}

          <div className="login-methods">
            <div className="telegram-section">
              <p className="login-label">Login with Telegram:</p>
              <div id="telegram-login"></div>
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            <button onClick={handleDemoLogin} className="demo-btn">
              🎮 Try Demo Mode
            </button>
          </div>

          <p className="help-text">
            Don't see Telegram button? Check console (F12) for errors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="header">
        <h1>⚜️ AXUM</h1>
        <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>

      <div className="user-card">
        <div className="avatar">
          {user.photo_url ? (
            <img src={user.photo_url} alt={user.username} />
          ) : (
            <div className="avatar-placeholder">
              {user.first_name[0]}
            </div>
          )}
        </div>
        
        <h2>Welcome, {user.first_name}!</h2>
        <p className="username">@{user.username}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-value">{user.points || 0}</div>
          <div className="stat-label">Points</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-value">{user.level || 1}</div>
          <div className="stat-label">Level</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🏆</div>
          <div className="stat-value">#1</div>
          <div className="stat-label">Rank</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎖️</div>
          <div className="stat-value">0</div>
          <div className="stat-label">Badges</div>
        </div>
      </div>

      <div className="info-section">
        <h3>📊 Your Telegram Information</h3>
        <div className="info-grid">
          <div className="info-row">
            <span className="info-label">Telegram ID:</span>
            <span className="info-value">{user.id}</span>
          </div>
          <div className="info-row">
            <span className="info-label">First Name:</span>
            <span className="info-value">{user.first_name}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Username:</span>
            <span className="info-value">@{user.username}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Photo URL:</span>
            <span className="info-value">{user.photo_url || 'None'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Joined:</span>
            <span className="info-value">
              {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString() : 'Today'}
            </span>
          </div>
        </div>
      </div>

      <div className="debug-section">
        <h4>🔧 Debug Info</h4>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;
