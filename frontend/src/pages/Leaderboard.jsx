import React, { useEffect, useState } from 'react';
import { leaderboardAPI } from '../services/api';
import { useAuthStore } from '../store';

const Leaderboard = () => {
  const { user } = useAuthStore();
  const [monthly, setMonthly] = useState([]);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const [monthlyRes, rankRes] = await Promise.all([
          leaderboardAPI.getMonthlyLeaderboard(),
          leaderboardAPI.getUserRank(),
        ]);

        setMonthly(monthlyRes.data.data || []);
        setUserRank(rankRes.data.data || null);
      } catch (err) {
        console.error("Failed to load leaderboard:", err);
      }
    };

    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-b from-[#0A1A2F] to-[#0D0D0D] text-white">

      {/* Header */}
      <h1 className="text-3xl font-semibold text-gold-400 mb-2">
        Tournament Ladder
      </h1>
      <p className="text-gray-300 mb-6">
        The Queen watches closely. Rise through the ranks.
      </p>

      {/* User Rank */}
      {userRank && (
        <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-5 mb-8 shadow-lg">
          <div className="text-sm text-gray-300 mb-1">Your Position</div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-lg font-semibold text-gold-400">
                {user?.firstName || user?.username}
              </div>
              <div className="text-gray-300 text-sm">Rank #{userRank.rank}</div>
            </div>

            <div className="text-gold-400 font-bold text-xl">
              {userRank.totalPoints} pts
            </div>
          </div>
        </div>
      )}

      {/* Monthly Leaderboard */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gold-400 mb-4">
          Monthly Top Players
        </h2>

        {monthly.length === 0 ? (
          <div className="text-gray-400">Loading leaderboard...</div>
        ) : (
          <div className="space-y-3">
            {monthly.map((player, i) => (
              <div
                key={i}
                className="flex justify-between items-center bg-[#1A2A3A] p-3 rounded-xl border border-[#D4A857]/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#0A1A2F] rounded-lg flex items-center justify-center text-gold-400 font-bold">
                    {i + 1}
                  </div>

                  <div>
                    <div className="font-medium">{player.firstName || player.username}</div>
                    <div className="text-xs text-gray-400">#{player.rank}</div>
                  </div>
                </div>

                <div className="text-gold-400 font-semibold">
                  {player.totalPoints} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Leaderboard;
