import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../store';

const Navbar = () => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) return null; // Hide navbar on login page

  const navItems = [
    { path: "/dashboard", label: "Home", icon: "🏛️" },
    { path: "/game", label: "Game", icon: "🎮" },
    { path: "/social", label: "Tasks", icon: "📜" },
    { path: "/leaderboard", label: "Ranks", icon: "👑" },
    { path: "/profile", label: "Profile", icon: "⚔️" },
  ];

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#0A1A2F]/95 border-t border-[#D4A857]/20 backdrop-blur-lg z-50">
      <div className="flex justify-around py-3">

        {navItems.map((item, i) => (
          <NavLink
            key={i}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs transition ${
                isActive ? "text-gold-400" : "text-gray-300"
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="mt-1">{item.label}</span>
          </NavLink>
        ))}

      </div>
    </div>
  );
};

export default Navbar;
