import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const res = await fetch('http://localhost:5000/api/user', {
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

  async function handleLogin() {
    const demoUser = {
      id: Date.now(),
      first_name: 'Demo User',
      username: 'demo_' + Date.now(),
      hash: 'demo_hash'
    };

    try {
      const res = await fetch('http://localhost:5000/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demoUser)
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setUser(data.user);
      } else {
        alert('Login failed');
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Cannot connect to server');
    }
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
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
          <button onClick={handleLogin} className="login-btn">
            🎮 Login with Demo
          </button>
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
          <div className="stat-value">{user.points}</div>
          <div className="stat-label">Points</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⚔️</div>
          <div className="stat-value">{user.level}</div>
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
        <h3>📊 Your Information</h3>
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
            <span className="info-label">Joined:</span>
            <span className="info-value">{new Date(user.joinedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
