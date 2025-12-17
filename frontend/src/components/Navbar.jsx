import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store';
import { Trophy, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated) return null;

  return (
    <nav className="bg-dark-800 border-b border-dark-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-bold text-xl">
            <Trophy className="w-6 h-6 text-primary-500" />
            <span className="gradient-text">Rewards</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/leaderboard" className="text-gray-300 hover:text-white transition-colors">
              Leaderboard
            </Link>
            <Link to="/game" className="text-gray-300 hover:text-white transition-colors">
              Play
            </Link>
            
            <div className="flex items-center gap-3 pl-6 border-l border-dark-700">
              <div className="text-right">
                <div className="text-sm font-semibold">{user?.firstName || user?.username}</div>
                <div className="text-xs text-primary-500">{user?.totalPoints} pts</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-dark-700 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
