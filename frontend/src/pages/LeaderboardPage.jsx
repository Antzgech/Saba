import { useState, useEffect } from "react";
import "./LeaderboardPage.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function LeaderboardPage() {
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedLevel]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/leaderboard?level=${selectedLevel}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setLeaderboardData(data);
      }
    } catch (error) {
      console.error("Leaderboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-header">
        <h1 className="leaderboard-title">Hall of Fame</h1>
        <p className="leaderboard-subtitle">The greatest Runners of the Realms</p>
      </div>

      <div className="leaderboard-list">
        {loading ? (
          <p>Gathering rankings...</p>
        ) : (
          leaderboardData.map((player, index) => (
            <div key={index} className="leaderboard-item">
              <span className="rank">#{index + 1}</span>
              <img src={player.photo_url || "/default-avatar.png"} className="avatar" alt="" />
              <div className="player-info">
                <span className="player-name">{player.username || player.first_name}</span>
                <span className="player-level">Level {player.level}</span>
              </div>
              <span className="player-points">{player.points.toLocaleString()} pts</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
