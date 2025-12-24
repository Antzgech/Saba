import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'https://saba-hbhv.vercel.app';
const BOT_USERNAME = 'sabawians_bot';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('🚀 App starting...');
    console.log('API URL:', API_URL);
    console.log('Bot:', BOT_USERNAME);
    checkAuth();
    loadTelegramWidget();
  }, []);

  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('📝 Found existing token, checking...');
      try {
        const res = await fetch(`${API_URL}/api/user`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log('Response status:', res.status);
        
        if (res.ok) {
          const data = await res.json();
          console.log('✅ User authenticated:', data);
          setUser(data);
        } else {
          console.log('❌ Token invalid, clearing');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('❌ Auth check error:', err);
      }
    } else {
      console.log('ℹ️ No existing token');
    }
    setLoading(false);
  }

  function loadTelegramWidget() {
    console.log('📱 Loading Telegram widget...');
    
    // Define callback BEFORE loading script
    window.onTelegramAuth = async (telegramUser) => {
      console.log('✅ Telegram callback fired!');
      console.log('Telegram user data:', telegramUser);
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('📤 Sending to backend:', `${API_URL}/api/auth/telegram`);
        
        const res = await fetch(`${API_URL}/api/auth/telegram`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(telegramUser)
        });

        console.log('📥 Response status:', res.status);
        console.log('Response headers:', res.headers);

        const data = await res.json();
        console.log('📥 Response data:', data);

        if (res.ok) {
          console.log('✅ Login successful!');
          localStorage.setItem('token', data.token);
          setUser(data.user);
        } else {
          console.error('❌ Login failed:', data);
          setError(`Login failed: ${data.error || 'Unknown error'}`);
        }
      } catch (err) {
        console.error('❌ Network error:', err);
        console.error('Error details:', err.message);
        setError(`Cannot connect to server: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    // Load Telegram widget script
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', BOT_USERNAME);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Telegram widget script loaded');
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Telegram widget script');
      setError('Failed to load Telegram widget');
    };

    const container = document.getElementById('telegram-login');
    if (container) {
      container.innerHTML = '';
      container.appendChild(script);
      console.log('📱 Telegram widget script added to page');
    } else {
      console.error('❌ telegram-login container not found!');
    }
  }

  async function handleDemoLogin() {
    console.log('🎮 Demo login clicked');
    setLoading(true);
    setError(null);
    
    const demoUser = {
      id: Date.now(),
      first_name: 'Demo User',
      username: 'demo_' + Date.now(),
      hash: 'demo_hash'
    };

    console.log('Demo user:', demoUser);

    try {
      console.log('📤 Sending demo login to:', `${API_URL}/api/auth/telegram`);
      
      const res = await fetch(`${API_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(demoUser)
      });

      console.log('📥 Demo response status:', res.status);
      
      const data = await res.json();
      console.log('📥 Demo response data:', data);

      if (res.ok) {
        console.log('✅ Demo login successful!');
        localStorage.setItem('token', data.token);
        setUser(data.user);
      } else {
        console.error('❌ Demo login failed:', data);
        setError(`Demo login failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('❌ Demo login error:', err);
      console.error('Error details:', err.message);
      setError(`Cannot connect to server: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function testBackend() {
    console.log('🧪 Testing backend connection...');
    try {
      const res = await fetch(`${API_URL}/api/health`);
      console.log('Health check status:', res.status);
      const data = await res.json();
      console.log('Health check data:', data);
      alert(`Backend is ${data.status}! Users: ${data.users || 0}`);
    } catch (err) {
      console.error('Health check failed:', err);
      alert(`Backend check failed: ${err.message}`);
    }
  }

  function handleLogout() {
    console.log('👋 Logging out...');
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    );
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
              <p className="bot-info">Bot: @{BOT_USERNAME}</p>
            </div>

            <div className="divider">
              <span>OR</span>
            </div>

            <button onClick={handleDemoLogin} className="demo-btn">
              🎮 Try Demo Mode
            </button>

            <button onClick={testBackend} className="test-btn">
              🧪 Test Backend Connection
            </button>
          </div>

          <div className="debug-info">
            <p>🔧 Debug Info:</p>
            <p>Backend: {API_URL}</p>
            <p>Bot: @{BOT_USERNAME}</p>
            <p>Open console (F12) for details</p>
          </div>
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
        <h4>🔧 Full User Object</h4>
        <pre>{JSON.stringify(user, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;
