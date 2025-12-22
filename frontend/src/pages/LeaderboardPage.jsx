import React, { useState, useEffect } from 'react';
import './LeaderboardPage.css';

function LeaderboardPage() {
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [finalists, setFinalists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedLevel]);

  const fetchLeaderboard = async () => {
    try {
      const token = localStorage.getItem('axum_token');
      const response = await fetch(`/api/leaderboard?level=${selectedLevel}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data.rankings);
        setFinalists(data.finalists || []);
      } else {
        // Mock data
        setLeaderboardData([
          { rank: 1, username: 'Solomon', points: 5000, level: 6, badges: 12, finalist: true },
          { rank: 2, username: 'Makeda', points: 4800, level: 6, badges: 11, finalist: true },
          { rank: 3, username: 'David', points: 4500, level: 5, badges: 10, finalist: true },
          { rank: 4, username: 'Bathsheba', points: 4200, level: 5, badges: 9, finalist: true },
          { rank: 5, username: 'Nathan', points: 4000, level: 5, badges: 9, finalist: true }
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const levels = ['all', '1', '2', '3', '4', '5', '6'];

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">Hall of Champions</h1>
        <p className="leaderboard-subtitle">
          The mightiest warriors in Queen Makeda's quest
        </p>
      </div>

      <div className="level-selector">
        {levels.map(level => (
          <button
            key={level}
            className={`level-btn ${selectedLevel === level ? 'active' : ''}`}
            onClick={() => setSelectedLevel(level)}
          >
            {level === 'all' ? 'All Levels' : `Level ${level}`}
          </button>
        ))}
      </div>

      {finalists.length > 0 && (
        <div className="finalists-section">
          <h2 className="section-title">The 30 Finalists</h2>
          <p className="section-desc">These champions have proven themselves worthy</p>
          <div className="finalists-grid">
            {finalists.map((finalist, index) => (
              <div key={index} className="finalist-card">
                <span className="finalist-badge">🏆</span>
                <span className="finalist-name">{finalist.username}</span>
                <span className="finalist-level">Level {finalist.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rankings-section">
        <h2 className="section-title">Current Rankings</h2>
        
        {loading ? (
          <div className="loading-spinner"></div>
        ) : (
          <div className="rankings-table">
            <div className="table-header">
              <div className="header-cell rank-col">Rank</div>
              <div className="header-cell player-col">Player</div>
              <div className="header-cell points-col">Points</div>
              <div className="header-cell level-col">Level</div>
              <div className="header-cell badges-col">Badges</div>
              <div className="header-cell status-col">Status</div>
            </div>

            <div className="table-body">
              {leaderboardData.map((player) => (
                <div key={player.rank} className={`table-row ${player.finalist ? 'finalist-row' : ''}`}>
                  <div className="cell rank-col">
                    <span className={`rank-badge rank-${player.rank <= 3 ? player.rank : 'default'}`}>
                      {player.rank <= 3 ? ['🥇', '🥈', '🥉'][player.rank - 1] : `#${player.rank}`}
                    </span>
                  </div>
                  <div className="cell player-col">
                    <span className="player-name">{player.username}</span>
                  </div>
                  <div className="cell points-col">
                    <span className="points-value">{player.points.toLocaleString()}</span>
                  </div>
                  <div className="cell level-col">
                    <span className="level-badge">Level {player.level}</span>
                  </div>
                  <div className="cell badges-col">
                    <span className="badges-count">🏅 {player.badges}</span>
                  </div>
                  <div className="cell status-col">
                    {player.finalist && <span className="finalist-tag">Finalist</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="info-section">
        <div className="info-card">
          <h3>Top 10 Rewards</h3>
          <p>Every bi-weekly cycle, the top 10 players in each level receive rewards. Once rewarded, they cannot re-enter the top 10 for that specific level.</p>
        </div>
        <div className="info-card">
          <h3>Finalist Selection</h3>
          <p>The top 5 from each of the 6 levels (30 unique players) become finalists. If you qualify in multiple levels, you're assigned to your highest level.</p>
        </div>
      </div>
    </div>
  );
}

export default LeaderboardPage;
