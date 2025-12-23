import { useState, useEffect } from "react";
import "./GamePage.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function GamePage() {
  const [levels, setLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/levels`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLevels(data.levels);
      }
    } catch (error) {
      console.error("Failed to fetch levels:", error);

      setLevels([
        { id: 1, name: "The Awakening", unlocked: true, completed: false, dueDate: "2025-01-15", score: 0, maxScore: 1000 },
        { id: 2, name: "The Journey Begins", unlocked: false, completed: false, dueDate: "2025-01-30", score: 0, maxScore: 1500 },
        { id: 3, name: "Trials of Wisdom", unlocked: false, completed: false, dueDate: "2025-02-14", score: 0, maxScore: 2000 },
        { id: 4, name: "The Sacred Path", unlocked: false, completed: false, dueDate: "2025-02-28", score: 0, maxScore: 2500 },
        { id: 5, name: "Champions Rise", unlocked: false, completed: false, dueDate: "2025-03-15", score: 0, maxScore: 3000 },
        { id: 6, name: "Jerusalem Awaits", unlocked: false, completed: false, dueDate: "2025-03-30", score: 0, maxScore: 5000 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayLevel = (level) => {
    if (!level.unlocked) {
      alert("Complete requirements to unlock this level!");
      return;
    }
    setSelectedLevel(level);
  };

  if (loading) {
    return (
      <div className="game-loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-header">
        <h1 className="game-title">Queen Makeda's Challenge</h1>
        <p className="game-subtitle">Complete all 6 levels to join the final tournament</p>
      </div>

      <div className="levels-container">
        {levels.map((level) => (
          <div
            key={level.id}
            className={`level-card ${level.unlocked ? "unlocked" : "locked"} ${level.completed ? "completed" : ""}`}
          >
            <div className="level-number">Level {level.id}</div>

            <div className="level-content">
              <h3 className="level-name">{level.name}</h3>

              {level.unlocked ? (
                <>
                  <div className="level-stats">
                    <div className="stat">
                      <span className="stat-label">Your Score</span>
                      <span className="stat-value">{level.score}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Max Score</span>
                      <span className="stat-value">{level.maxScore}</span>
                    </div>
                  </div>

                  <div className="level-deadline">
                    <span className="deadline-icon">⏰</span>
                    <span>Due: {level.dueDate}</span>
                  </div>

                  <button className="btn btn-primary" onClick={() => handlePlayLevel(level)}>
                    {level.completed ? "Replay Level" : "Play Now"} →
                  </button>
                </>
              ) : (
                <div className="locked-overlay">
                  <span className="lock-icon">🔒</span>
                  <p>Complete Level {level.id - 1} requirements</p>
                  <p className="unlock-date">Unlocks: {level.dueDate}</p>
                </div>
              )}
            </div>

            {level.completed && (
              <div className="completion-badge">
                <span>✅ Completed</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="game-info-section">
        <div className="info-card">
          <h3 className="info-title">How It Works</h3>
          <ul className="info-list">
            <li>Each level unlocks every 2 weeks</li>
            <li>Complete requirements (invites, subscriptions, follows) before playing</li>
            <li>Top 10 players per level earn rewards</li>
            <li>Top 5 become finalists (30 total finalists)</li>
            <li>Players can replay levels for higher scores</li>
            <li>Cannot re-enter top 10 in the same level once rewarded</li>
          </ul>
        </div>

        <div className="info-card">
          <h3 className="info-title">Finalist Selection</h3>
          <p>
            The top 5 players from each of the 6 levels become finalists. If you qualify in multiple levels, you'll be assigned to your highest level automatically, ensuring 30 unique champions compete in the final tournament!
          </p>
        </div>
      </div>
    </div>
  );
}
