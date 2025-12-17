import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { gameAPI, socialAPI, referralAPI, leaderboardAPI } from '../services/api';
import { Trophy, Users, Gift, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuthStore();
  const [canPlay, setCanPlay] = useState(false);
  const [stats, setStats] = useState(null);
  const [userRank, setUserRank] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [playStatus, gameStats, rankData] = await Promise.all([
          gameAPI.canPlay(),
          gameAPI.getStats(),
          leaderboardAPI.getUserRank(),
        ]);
        
        setCanPlay(playStatus.data.data.canPlay);
        setStats(gameStats.data.data);
        setUserRank(rankData.data.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold mb-2">
          Welcome, {user?.firstName || user?.username}!
        </h1>
        <p className="text-gray-400">Ready to earn more rewards?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-600/20 rounded-xl">
              <Trophy className="w-6 h-6 text-primary-500" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Total Points</div>
              <div className="text-2xl font-bold">{user?.totalPoints || 0}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-600/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Current Level</div>
              <div className="text-2xl font-bold">Level {user?.currentLevel || 1}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-600/20 rounded-xl">
              <Users className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Rank</div>
              <div className="text-2xl font-bold">#{userRank?.rank || '-'}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-600/20 rounded-xl">
              <Gift className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Referrals</div>
              <div className="text-2xl font-bold">{user?.referralCount || 0}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-xl font-display font-bold mb-4">Daily Challenge</h3>
          <p className="text-gray-400 mb-4">Play the daily game to earn points!</p>
          {canPlay ? (
            <Link to="/game" className="btn-primary inline-block text-center">
              Play Now
            </Link>
          ) : (
            <div className="text-yellow-500">Come back tomorrow to play again!</div>
          )}
        </div>

        <div className="card">
          <h3 className="text-xl font-display font-bold mb-4">Quick Actions</h3>
          <div className="flex flex-col gap-3">
            <Link to="/social" className="btn-secondary text-center">
              Complete Social Tasks
            </Link>
            <Link to="/referrals" className="btn-secondary text-center">
              Invite Friends
            </Link>
            <Link to="/leaderboard" className="btn-secondary text-center">
              View Leaderboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
