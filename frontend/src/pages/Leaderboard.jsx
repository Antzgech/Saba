import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Leaderboard = () => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use the API URL from your environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'https://your-railway-backend.app';

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/leaderboard`);
        setPlayers(response.data);
      } catch (error) {
        console.error("Error loading leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [API_URL]);

  if (loading) return <div className="text-center p-10">Loading Realms...</div>;

  return (
    <div className="leaderboard-container p-4">
      <h1 className="text-2xl font-bold mb-6 text-gold">Hall of Fame</h1>
      <div className="space-y-4">
        {players.map((player, index) => (
          <div key={index} className="flex items-center justify-between bg-dark-card p-4 rounded-lg border-l-4 border-gold">
            <div className="flex items-center gap-4">
              <span className="text-xl font-bold text-gray-400">#{index + 1}</span>
              <img src={player.photo_url || '/default-avatar.png'} alt="avatar" className="w-10 h-10 rounded-full" />
              <div>
                <p className="font-semibold text-white">{player.first_name}</p>
                <p className="text-xs text-gray-400">Level {player.level}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-gold font-bold">{player.points} pts</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Leaderboard;
