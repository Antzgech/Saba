import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { gameAPI, leaderboardAPI } from '../services/api';
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

  const displayName = user?.firstName || user?.username || 'Fighter';

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#120000] to-[#1b0b0b] text-white px-4 py-8">
      {/* Arena glow styles */}
      <style>{`
        .arena-title {
          letter-spacing: 6px;
          text-shadow:
            0 0 8px rgba(255,80,0,0.9),
            0 0 24px rgba(255,40,0,0.6),
            0 6px 30px rgba(0,0,0,0.8);
        }
        .glow-card {
          background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
          border: 1px solid rgba(255,80,0,0.12);
          box-shadow: 0 8px 30px rgba(255,40,0,0.06), inset 0 -6px 20px rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
        }
        .pulse {
          animation: pulseGlow 2.2s infinite;
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 0 8px rgba(255,80,0,0.12); transform: translateY(0); }
          50% { box-shadow: 0 0 28px rgba(255,120,0,0.18); transform: translateY(-3px); }
          100% { box-shadow: 0 0 8px rgba(255,80,0,0.12); transform: translateY(0); }
        }
        .arena-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background-image: radial-gradient(circle at 20% 10%, rgba(255,40,0,0.06), transparent 8%),
                            radial-gradient(circle at 80% 90%, rgba(255,120,0,0.03), transparent 12%);
          pointer-events: none;
        }
      `}</style>

      <div className="relative max-w-7xl mx-auto z-10">
        <div className="arena-bg" />

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-5xl md:text-6xl font-extrabold arena-title">
              ARENA REWARDS
            </h1>
            <p className="text-sm text-gray-300 mt-2">
              Welcome, <span className="text-yellow-300 font-semibold">{displayName}</span> — enter the arena and fight for the top.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="glow-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-[#2b0000] to-[#3a0a0a] flex items-center justify-center border border-red-700/20">
                <img
                  src={user?.photoUrl || '/avatar-placeholder.png'}
                  alt="avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-300">Fighter</div>
                <div className="text-lg font-bold">{displayName}</div>
                <div className="text-xs text-yellow-300">#{userRank?.rank || '-'}</div>
              </div>
            </div>

            <div className="glow-card rounded-xl p-4 text-center w-36 pulse">
              <div className="text-xs text-gray-300">Points</div>
              <div className="text-2xl font-extrabold text-yellow-300">{user?.totalPoints || 0}</div>
            </div>
          </div>
        </header>

        {/* Stat cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
          <div className="glow-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#2a0b00] rounded-xl border border-red-700/10">
                <Trophy className="w-6 h-6 text-yellow-300" />
              </div>
              <div>
                <div className="text-xs text-gray-300">Total Points</div>
                <div className="text-2xl font-bold">{user?.totalPoints || 0}</div>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#001a2a] rounded-xl border border-blue-700/10">
                <TrendingUp className="w-6 h-6 text-blue-300" />
              </div>
              <div>
                <div className="text-xs text-gray-300">Current Level</div>
                <div className="text-2xl font-bold">Level {user?.currentLevel || 1}</div>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#002a1a] rounded-xl border border-green-700/10">
                <Users className="w-6 h-6 text-green-300" />
              </div>
              <div>
                <div className="text-xs text-gray-300">Rank</div>
                <div className="text-2xl font-bold">#{userRank?.rank || '-'}</div>
              </div>
            </div>
          </div>

          <div className="glow-card rounded-2xl p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[#2a003a] rounded-xl border border-purple-700/10">
                <Gift className="w-6 h-6 text-purple-300" />
              </div>
              <div>
                <div className="text-xs text-gray-300">Referrals</div>
                <div className="text-2xl font-bold">{user?.referralCount || 0}</div>
              </div>
            </div>
          </div>
        </section>

        {/* Main content */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Arena Panel */}
          <div className="lg:col-span-2 glow-card rounded-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Daily Challenge</h2>
              <div className="text-sm text-gray-300">Win points, climb the ranks</div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <p className="text-gray-300 mb-4">
                  Enter the arena and play the daily game. Each win grants points and increases your chance to be in the top 10.
                </p>

                {canPlay ? (
                  <Link to="/game" className="inline-block bg-gradient-to-r from-red-500 to-yellow-400 text-black font-bold px-6 py-3 rounded-lg shadow-lg">
                    ENTER ARENA
                  </Link>
                ) : (
                  <div className="text-yellow-300 font-semibold">Come back tomorrow to play again!</div>
                )}
              </div>

              <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-[#2b0000] to-[#3a0a0a] flex items-center justify-center border border-red-700/20">
                <div className="text-center">
                  <div className="text-xs text-gray-300">Win Streak</div>
                  <div className="text-3xl font-extrabold text-yellow-300">{stats?.winStreak || 0}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions / leaderboard snapshot */}
          <aside className="glow-card rounded-3xl p-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>

            <div className="flex flex-col gap-3 mb-6">
              <Link to="/social" className="block text-center py-2 rounded-md bg-[#111] border border-red-700/10">Complete Social Tasks</Link>
              <Link to="/referrals" className="block text-center py-2 rounded-md bg-[#111] border border-red-700/10">Invite Friends</Link>
              <Link to="/leaderboard" className="block text-center py-2 rounded-md bg-[#111] border border-red-700/10">View Leaderboard</Link>
            </div>

            <div>
              <h4 className="text-sm text-gray-300 mb-2">Leaderboard Snapshot</h4>
              <div className="space-y-2">
                {stats?.top3?.length ? (
                  stats.top3.map((p, i) => (
                    <div key={p.id || i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs">{i + 1}</div>
                        <div>
                          <div className="font-semibold">{p.firstName || p.username}</div>
                          <div className="text-xs text-gray-400">#{p.rank}</div>
                        </div>
                      </div>
                      <div className="text-yellow-300 font-bold">{p.totalPoints}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-400 text-sm">Leaderboard loading...</div>
                )}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
