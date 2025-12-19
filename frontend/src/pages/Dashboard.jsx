import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import { gameAPI, leaderboardAPI } from '../services/api';
import { Crown, Zap, TrendingUp, Users, Gift, Sparkles, Gamepad2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user, updateUser } = useAuthStore();
  const [tapCount, setTapCount] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const [maxEnergy] = useState(1000);
  const [pointsPerTap] = useState(1);
  const [showFloatingPoints, setShowFloatingPoints] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [stats, setStats] = useState(null);
  const [queenPosition, setQueenPosition] = useState({ x: 50, y: 50 });
  const [canPlayDaily, setCanPlayDaily] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rankData, gameStats, playStatus] = await Promise.all([
          leaderboardAPI.getUserRank(),
          gameAPI.getStats(),
          gameAPI.canPlay(),
        ]);
        setUserRank(rankData.data.data);
        setStats(gameStats.data.data);
        setCanPlayDaily(playStatus.data.data.canPlay);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };
    fetchData();

    // Energy regeneration (1 per second)
    const energyInterval = setInterval(() => {
      setEnergy(prev => Math.min(prev + 1, maxEnergy));
    }, 1000);

    return () => clearInterval(energyInterval);
  }, [maxEnergy]);

  const handleTap = (e) => {
    if (energy < pointsPerTap) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Add points
    const newPoints = user.totalPoints + pointsPerTap;
    updateUser({ totalPoints: newPoints });
    setTapCount(prev => prev + 1);
    setEnergy(prev => Math.max(0, prev - pointsPerTap));

    // Floating point animation
    const id = Date.now();
    setShowFloatingPoints(prev => [...prev, { id, x, y, points: pointsPerTap }]);
    setTimeout(() => {
      setShowFloatingPoints(prev => prev.filter(p => p.id !== id));
    }, 1000);

    // Move queen slightly
    setQueenPosition({
      x: 50 + (Math.random() - 0.5) * 10,
      y: 50 + (Math.random() - 0.5) * 10
    });
  };

  const energyPercentage = (energy / maxEnergy) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 pb-20">
      {/* Header Stats */}
      <div className="bg-black/30 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-purple-300 mb-1">Your Kingdom</div>
              <div className="text-2xl font-bold text-white flex items-center gap-2">
                <Crown className="w-6 h-6 text-yellow-400" />
                {user?.firstName || user?.username}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-purple-300 mb-1">Rank</div>
              <div className="text-2xl font-bold text-yellow-400">
                #{userRank?.rank || '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Points Display */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full px-8 py-4 shadow-2xl border-4 border-yellow-300/50">
            <Crown className="w-10 h-10 text-white animate-pulse" />
            <div>
              <div className="text-sm text-yellow-100 font-semibold">Journey to King Solomon</div>
              <div className="text-4xl font-black text-white">
                {(user?.totalPoints || 0).toLocaleString()}
              </div>
            </div>
            <Sparkles className="w-10 h-10 text-white animate-pulse" />
          </div>
        </motion.div>

        {/* Dual Game Modes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Tap to Earn */}
          <div className="bg-gradient-to-b from-purple-800/40 to-blue-900/40 rounded-3xl border-4 border-purple-400/30 p-6 backdrop-blur-sm shadow-2xl overflow-hidden">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center mb-4"
            >
              <div className="text-yellow-300 font-bold text-lg mb-1 flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Tap the Queen!
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-purple-300 text-sm">Quick points anytime</div>
            </motion.div>

            {/* Queen Character */}
            <div className="relative h-[280px] flex items-center justify-center">
              <motion.div
                onClick={handleTap}
                animate={{
                  x: queenPosition.x - 50 + '%',
                  y: queenPosition.y - 50 + '%',
                }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer select-none"
                style={{ width: '200px', height: '200px' }}
              >
                <motion.div
                  animate={{
                    boxShadow: [
                      '0 0 40px rgba(251, 191, 36, 0.5)',
                      '0 0 80px rgba(251, 191, 36, 0.8)',
                      '0 0 40px rgba(251, 191, 36, 0.5)',
                    ],
                  }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-full h-full rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 flex items-center justify-center border-8 border-yellow-300/50 shadow-2xl"
                >
                  <div className="text-center">
                    <div className="text-7xl mb-2">👸</div>
                    <div className="text-white font-bold text-lg bg-black/30 rounded-full px-4 py-1">
                      TAP ME!
                    </div>
                  </div>
                </motion.div>

                <AnimatePresence>
                  {showFloatingPoints.map(point => (
                    <motion.div
                      key={point.id}
                      initial={{ opacity: 1, y: 0, scale: 1 }}
                      animate={{ opacity: 0, y: -100, scale: 1.5 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1 }}
                      className="absolute text-3xl font-black text-yellow-300"
                      style={{
                        left: point.x - 20,
                        top: point.y - 20,
                        textShadow: '0 0 10px rgba(0,0,0,0.8)',
                      }}
                    >
                      +{point.points}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Energy Bar */}
            <div className="mt-4 bg-black/40 rounded-2xl p-4 backdrop-blur-sm border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-400" />
                  <span className="text-white font-semibold text-sm">Energy</span>
                </div>
                <span className="text-purple-300 font-bold text-sm">
                  {energy} / {maxEnergy}
                </span>
              </div>
              <div className="relative h-4 bg-purple-900/50 rounded-full overflow-hidden border-2 border-purple-500/30">
                <motion.div
                  animate={{ width: `${energyPercentage}%` }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 rounded-full"
                  style={{
                    boxShadow: '0 0 20px rgba(251, 191, 36, 0.5)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Mario-Style Adventure Game */}
          <div className="bg-gradient-to-b from-blue-800/40 to-cyan-900/40 rounded-3xl border-4 border-cyan-400/30 p-6 backdrop-blur-sm shadow-2xl overflow-hidden">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="text-center mb-4"
            >
              <div className="text-cyan-300 font-bold text-lg mb-1 flex items-center justify-center gap-2">
                <Gamepad2 className="w-5 h-5" />
                Coin Quest Adventure!
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div className="text-cyan-200 text-sm">Daily platformer challenge</div>
            </motion.div>

            {/* Game Preview/Icon */}
            <div className="relative h-[280px] flex items-center justify-center bg-gradient-to-b from-sky-400 to-sky-600 rounded-2xl border-4 border-yellow-400">
              <div className="text-center">
                <motion.div
                  animate={{ y: [0, -20, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-8xl mb-4"
                >
                  👸
                </motion.div>
                <div className="text-white font-bold text-2xl mb-2">Queen's Quest</div>
                <div className="text-yellow-300 text-sm mb-4">
                  Jump, collect coins, avoid enemies!
                </div>
                <div className="flex gap-2 justify-center text-2xl">
                  <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }}>
                    🪙
                  </motion.span>
                  <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}>
                    🪙
                  </motion.span>
                  <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}>
                    🪙
                  </motion.span>
                </div>
              </div>
            </div>

            {/* Play Button */}
            <div className="mt-4">
              {canPlayDaily ? (
                <Link
                  to="/game"
                  className="block w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all text-center border-4 border-green-300/50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Gamepad2 className="w-6 h-6" />
                    <span>Play Daily Adventure!</span>
                  </div>
                </Link>
              ) : (
                <div className="w-full bg-gray-600/50 text-gray-300 font-bold py-4 px-6 rounded-2xl text-center border-4 border-gray-500/50">
                  <div className="flex items-center justify-center gap-2">
                    <span>⏰ Come back tomorrow!</span>
                  </div>
                  <div className="text-sm mt-1">Next game available in 24 hours</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-2xl p-4 border border-purple-400/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-purple-300 text-sm">Level</span>
            </div>
            <div className="text-3xl font-black text-white">{user?.currentLevel || 1}</div>
          </div>

          <div className="bg-gradient-to-br from-pink-600/30 to-purple-600/30 rounded-2xl p-4 border border-pink-400/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              <span className="text-purple-300 text-sm">Taps</span>
            </div>
            <div className="text-3xl font-black text-white">{tapCount}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-600/30 to-cyan-600/30 rounded-2xl p-4 border border-blue-400/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-cyan-400" />
              <span className="text-purple-300 text-sm">Referrals</span>
            </div>
            <div className="text-3xl font-black text-white">{user?.referralCount || 0}</div>
          </div>

          <div className="bg-gradient-to-br from-orange-600/30 to-yellow-600/30 rounded-2xl p-4 border border-orange-400/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-orange-400" />
              <span className="text-purple-300 text-sm">Games</span>
            </div>
            <div className="text-3xl font-black text-white">{stats?.totalGames || 0}</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Link
            to="/social"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all text-center border-4 border-purple-300/50"
          >
            <div className="text-2xl mb-1">✨</div>
            <div>Social Quests</div>
          </Link>

          <Link
            to="/referrals"
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all text-center border-4 border-blue-300/50"
          >
            <div className="text-2xl mb-1">👥</div>
            <div>Invite Friends</div>
          </Link>

          <Link
            to="/leaderboard"
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg transform hover:scale-105 transition-all text-center border-4 border-orange-300/50"
          >
            <div className="text-2xl mb-1">🏆</div>
            <div>Leaderboard</div>
          </Link>
        </div>

        {/* Progress to Next Level */}
        {user?.currentLevel < 3 && (
          <div className="bg-black/40 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/30">
            <div className="flex items-center justify-between mb-3">
              <span className="text-purple-300 font-semibold">Journey to Next Level</span>
              <span className="text-white font-bold">
                {user?.totalPoints || 0} / {user?.currentLevel === 1 ? 1000 : 5000}
              </span>
            </div>
            <div className="relative h-4 bg-purple-900/50 rounded-full overflow-hidden border-2 border-purple-500/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.min(
                    100,
                    ((user?.totalPoints || 0) /
                      (user?.currentLevel === 1 ? 1000 : 5000)) *
                      100
                  )}%`,
                }}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg border-t border-purple-500/30">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-around">
            <Link to="/dashboard" className="flex flex-col items-center gap-1 text-yellow-400">
              <Crown className="w-6 h-6" />
              <span className="text-xs font-semibold">Home</span>
            </Link>
            <Link to="/game" className="flex flex-col items-center gap-1 text-purple-300 hover:text-purple-100">
              <Gamepad2 className="w-6 h-6" />
              <span className="text-xs font-semibold">Play</span>
            </Link>
            <Link to="/leaderboard" className="flex flex-col items-center gap-1 text-purple-300 hover:text-purple-100">
              <TrendingUp className="w-6 h-6" />
              <span className="text-xs font-semibold">Leaders</span>
            </Link>
            <Link to="/referrals" className="flex flex-col items-center gap-1 text-purple-300 hover:text-purple-100">
              <Gift className="w-6 h-6" />
              <span className="text-xs font-semibold">Earn</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
