import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { gameAPI, leaderboardAPI } from '../services/api';
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

  const displayName = user?.firstName || user?.username || "Traveler";

  return (
    <div className="min-h-screen px-4 py-6 bg-gradient-to-b from-[#0A1A2F] to-[#0D0D0D] text-white">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gold-400">
          Welcome, {displayName}
        </h1>
        <p className="text-gray-300 mt-1">
          Your journey with the Queen begins today.
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-5 mb-8 shadow-lg">
        <div className="flex items-center gap-4">
          <img
            src={user?.photoUrl || "/avatar-placeholder.png"}
            alt="avatar"
            className="w-16 h-16 rounded-xl object-cover border border-[#D4A857]/30"
          />

          <div>
            <div className="text-lg font-bold text-gold-400">{displayName}</div>
            <div className="text-sm text-gray-300">Rank: #{userRank?.rank || "-"}</div>
            <div className="text-sm text-gray-300">Level: {user?.currentLevel || 1}</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-xl p-4">
          <div className="text-sm text-gray-300">Total Points</div>
          <div className="text-2xl font-bold text-gold-400">{user?.totalPoints || 0}</div>
        </div>

        <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-xl p-4">
          <div className="text-sm text-gray-300">Referrals</div>
          <div className="text-2xl font-bold text-gold-400">{user?.referralCount || 0}</div>
        </div>
      </div>

      {/* Daily Challenge */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gold-400 mb-2">Daily Challenge</h2>
        <p className="text-gray-300 mb-4">
          Collect coins and earn the Queen’s favor.
        </p>

        {canPlay ? (
          <Link
            to="/game"
            className="block text-center bg-gold-400 text-black font-semibold py-3 rounded-xl"
          >
            Play Now
          </Link>
        ) : (
          <div className="text-yellow-400 font-medium">
            You have completed today’s challenge. Return tomorrow.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gold-400 mb-4">Quick Actions</h2>

        <div className="flex flex-col gap-3">
          <Link to="/social" className="bg-[#1A2A3A] py-3 rounded-xl text-center border border-[#D4A857]/20">
            Social Tasks
          </Link>

          <Link to="/referrals" className="bg-[#1A2A3A] py-3 rounded-xl text-center border border-[#D4A857]/20">
            Invite Friends
          </Link>

          <Link to="/leaderboard" className="bg-[#1A2A3A] py-3 rounded-xl text-center border border-[#D4A857]/20">
            Leaderboard
          </Link>
        </div>
      </div>

      {/* Leaderboard Snapshot */}
      <div className="bg-[#112233]/40 border border-[#D4A857]/20 rounded-2xl p-6">
        <h2 className="text-xl font-semibold text-gold-400 mb-4">Top Players</h2>

        {stats?.top3?.length ? (
          <div className="space-y-3">
            {stats.top3.map((p, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#1A2A3A] rounded-lg flex items-center justify-center text-gold-400 font-bold">
                    {i + 1}
                  </div>
                  <div>
                    <div className="font-medium">{p.firstName || p.username}</div>
                    <div className="text-xs text-gray-400">#{p.rank}</div>
                  </div>
                </div>

                <div className="text-gold-400 font-semibold">{p.totalPoints}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-400">Loading...</div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
