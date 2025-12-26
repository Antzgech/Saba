// File: src/App.jsx
// Example integration of Telegram WebApp with your React app

import { useEffect, useState } from 'react';
import telegramService from './utils/telegram';

const API_URL = import.meta.env.VITE_API_URL || 'https://your-backend.vercel.app';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('🚀 Initializing SABA app...');
      
      // Step 1: Initialize Telegram WebApp
      const telegramInitialized = telegramService.init();
      
      if (!telegramInitialized) {
        setError('Please open this app inside Telegram');
        setIsLoading(false);
        return;
      }

      // Step 2: Check for stored authentication
      const storedAuth = telegramService.getStoredAuth();
      
      if (storedAuth) {
        console.log('✅ Found stored authentication');
        setUser(storedAuth.user);
        setIsLoading(false);
        return;
      }

      // Step 3: Authenticate with backend
      console.log('🔐 Authenticating with backend...');
      const authData = await telegramService.authenticateWithBackend(API_URL);
      
      setUser(authData.user);
      console.log('✅ Authentication complete');
      
    } catch (error) {
      console.error('❌ Initialization error:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    telegramService.clearAuth();
    setUser(null);
    telegramService.close();
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Loading SABA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <h2>⚠️ Error</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="error-screen">
        <h2>👤 No User Data</h2>
        <p>Unable to get user information</p>
        <button onClick={initializeApp}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="user-info">
          {user.photo_url && (
            <img 
              src={user.photo_url} 
              alt={user.first_name}
              className="user-avatar"
            />
          )}
          <div>
            <h2>Welcome, {user.first_name}!</h2>
            {user.username && <p>@{user.username}</p>}
          </div>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <main className="app-main">
        <div className="stats-card">
          <h3>Your Stats</h3>
          <div className="stat-item">
            <span className="stat-label">Points:</span>
            <span className="stat-value">{user.points || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Level:</span>
            <span className="stat-value">{user.level || 1}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Streak:</span>
            <span className="stat-value">{user.streak || 0} days</span>
          </div>
        </div>

        <div className="game-section">
          <h3>🎮 Daily Challenge</h3>
          <button 
            className="play-button"
            onClick={() => {
              telegramService.hapticFeedback('medium');
              // Navigate to game
            }}
          >
            Play Now
          </button>
        </div>
      </main>

      <style jsx>{`
        .app {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a5490 0%, #2874a6 100%);
          color: white;
          font-family: Arial, sans-serif;
        }

        .app-header {
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .user-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .logout-btn {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid white;
          border-radius: 8px;
          color: white;
          cursor: pointer;
        }

        .app-main {
          padding: 20px;
        }

        .stats-card {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-weight: normal;
          opacity: 0.8;
        }

        .stat-value {
          font-weight: bold;
          font-size: 1.2em;
        }

        .game-section {
          text-align: center;
          margin-top: 30px;
        }

        .play-button {
          background: white;
          color: #1a5490;
          border: none;
          border-radius: 12px;
          padding: 15px 40px;
          font-size: 1.2em;
          font-weight: bold;
          cursor: pointer;
          margin-top: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .play-button:active {
          transform: scale(0.95);
        }

        .loading-screen,
        .error-screen {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background: linear-gradient(135deg, #1a5490 0%, #2874a6 100%);
          color: white;
        }

        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        button {
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
}

export default App;
