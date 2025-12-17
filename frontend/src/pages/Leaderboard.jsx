import React, { useEffect, useState } from 'react';
import { leaderboardAPI } from '../services/api';
import { Trophy, Medal } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboards, setLeaderboards] = useState({});
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboards = async () => {
      try {
        const response = await leaderboardAPI.getAllLevels();
        setLeaderboards(response.data.data);
      } catch (error) {
        console.error('Error fetching leaderboards:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboards();
  }, []);

  const getRankColor = (rank) => {
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-orange-400';
    return 'text-gray-400';
  };

  const getRankIcon = (rank) => {
    if (rank <= 3) return <Trophy className={`w-5 h-5 ${getRankColor(rank)}`} />;
    return <Medal className="w-5 h-5 text-gray-500" />;
  };

  const currentLeaderboard = leaderboards[`level${selectedLevel}`] || [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-display font-bold mb-8 gradient-text">🏆 Leaderboard</h1>

      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map(level => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-6 py-3 rounded-xl font-semibold transition-all ${
              selectedLevel === level
                ? 'bg-primary-600 text-white'
                : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
            }`}
          >
            Level {level}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="space-y-3">
            {currentLeaderboard.map((user) => (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 bg-dark-700 rounded-xl hover:bg-dark-600 transition-colors"
              >
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(user.rank)}
                </div>
                <div className="flex-shrink-0">
                  {user.photoUrl ? (
                    <img
                      src={user.photoUrl}
                      alt={user.username}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold">
                      {(user.firstName || user.username || 'U')[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">
                    {user.firstName || user.username || 'Anonymous'}
                  </div>
                  <div className="text-sm text-gray-400">
                    {user.totalPoints} points
                  </div>
                </div>
                <div className={`text-2xl font-bold ${getRankColor(user.rank)}`}>
                  #{user.rank}
                </div>
              </div>
            ))}
            
            {currentLeaderboard.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No users in this level yet
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 card bg-primary-600/10 border-primary-600/20">
        <h3 className="font-semibold text-primary-400 mb-2">🎁 Rewards</h3>
        <p className="text-sm text-gray-300">
          Top 10 users in each level receive rewards every 15 days!
        </p>
        <div className="mt-3 space-y-1 text-sm">
          <div>• Level 1: $3</div>
          <div>• Level 2: $8 (cumulative)</div>
          <div>• Level 3: $18 (cumulative)</div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
