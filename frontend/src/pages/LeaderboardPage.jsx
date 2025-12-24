import { useState, useEffect } from "react";
import "./LeaderboardPage.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          // Backend returns an array directly from pool.query
          setLeaderboardData(data);
        }
      } catch (error) {
        console.error("Leaderboard fetch failed:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="leaderboard-container">
      <h1>Hall of Fame</h1>
      {loading ? <p>Loading rankings...</p> : (
        leaderboardData.map((player, index) => (
          <div key={index} className="leader-row">
            <span>#{index + 1}</span>
            <span>{player.username || player.first_name}</span>
            <span>{player.points} pts</span>
          </div>
        ))
      )}
    </div>
  );
}
