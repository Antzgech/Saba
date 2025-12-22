import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DashboardPage.css';

function DashboardPage({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('axum_token');
        const response = await fetch('/api/user/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading your journey...</p>
      </div>
    );
  }

  const currentLevel = stats?.currentLevel || 1;
  const totalPoints = stats?.totalPoints || 0;
  const rank = stats?.globalRank || '--';
  const badges = stats?.badges || [];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="title-greeting">Welcome back,</span>
            <span className="title-name">{user?.username || 'Traveler'}</span>
          </h1>
          <p className="dashboard-subtitle">
            Continue your journey in Queen Makeda's quest
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-primary">
          <div className="stat-icon">⚔️</div>
          <div className="stat-content">
            <h3 className="stat-value">{totalPoints.toLocaleString()}</h3>
            <p className="stat-label">Total Points</p>
          </div>
        </div>

        <div className="stat-card stat-secondary">
          <div className="stat-icon">🎮</div>
          <div className="stat-content">
            <h3 className="stat-value">Level {currentLevel}</h3>
            <p className="stat-label">Current Progress</p>
          </div>
        </div>

        <div className="stat-card stat-tertiary">
          <div className="stat-icon">👑</div>
          <div className="stat-content">
            <h3 className="stat-value">#{rank}</h3>
            <p className="stat-label">Global Rank</p>
          </div>
        </div>

        <div className="stat-card stat-quaternary">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <h3 className="stat-value">{badges.length}</h3>
            <p className="stat-label">Badges Earned</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="content-main">
          <div className="current-level-card pattern-border">
            <div className="pattern-border-content">
              <div className="level-header">
                <h2 className="level-title">Your Current Level</h2>
                <span className="level-badge">Level {currentLevel} of 6</span>
              </div>
              
              <div className="level-progress">
                <div className="progress-info">
                  <span>Progress to Next Level</span>
                  <span>{stats?.levelProgress || 0}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${stats?.levelProgress || 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="level-requirements">
                <h3 className="requirements-title">Requirements to Unlock</h3>
                <ul className="requirements-list">
                  <li className={stats?.requirements?.friends ? 'completed' : ''}>
                    <span className="req-icon">{stats?.requirements?.friends ? '✅' : '⭕'}</span>
                    <span>Invite {stats?.requiredFriends || 5} friends</span>
                  </li>
                  <li className={stats?.requirements?.subscriptions ? 'completed' : ''}>
                    <span className="req-icon">{stats?.requirements?.subscriptions ? '✅' : '⭕'}</span>
                    <span>Complete {stats?.requiredSubscriptions || 3} subscription tasks</span>
                  </li>
                  <li className={stats?.requirements?.follows ? 'completed' : ''}>
                    <span className="req-icon">{stats?.requirements?.follows ? '✅' : '⭕'}</span>
                    <span>Follow {stats?.requiredFollows || 4} channels</span>
                  </li>
                </ul>
              </div>

              <Link to="/game" className="btn btn-primary btn-large">
                Enter Level {currentLevel} →
              </Link>
            </div>
          </div>

          <div className="quick-actions-grid">
            <Link to="/tasks" className="action-card">
              <span className="action-icon">📜</span>
              <h3 className="action-title">Complete Tasks</h3>
              <p className="action-desc">Earn points through social actions</p>
            </Link>

            <Link to="/leaderboard" className="action-card">
              <span className="action-icon">👑</span>
              <h3 className="action-title">View Leaderboard</h3>
              <p className="action-desc">See top players and finalists</p>
            </Link>

            <Link to="/rewards" className="action-card">
              <span className="action-icon">💎</span>
              <h3 className="action-title">Check Rewards</h3>
              <p className="action-desc">View your earned rewards</p>
            </Link>
          </div>
        </div>

        <div className="content-sidebar">
          <div className="badges-card card">
            <h3 className="card-title">Your Badges</h3>
            {badges.length > 0 ? (
              <div className="badges-grid">
                {badges.map((badge, index) => (
                  <div key={index} className="badge-item" title={badge.name}>
                    <span className="badge-icon">{badge.icon}</span>
                    <span className="badge-name">{badge.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="empty-state">
                No badges yet. Complete tasks to earn your first badge!
              </p>
            )}
          </div>

          <div className="recent-activity-card card">
            <h3 className="card-title">Recent Activity</h3>
            {stats?.recentActivity?.length > 0 ? (
              <ul className="activity-list">
                {stats.recentActivity.map((activity, index) => (
                  <li key={index} className="activity-item">
                    <span className="activity-icon">{activity.icon}</span>
                    <div className="activity-info">
                      <p className="activity-text">{activity.text}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-state">
                No recent activity. Start completing tasks!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
