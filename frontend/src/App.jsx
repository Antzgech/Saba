import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';
import Game from './components/Game';
import Social from './pages/Social';
import Referrals from './pages/Referrals';
import Profile from './pages/Profile';

// Layout
import Navbar from './components/Navbar';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/" />;
};

// Layout wrapper for all authenticated pages
const ArenaLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />
      <div className="pb-20">{children}</div> {/* space for bottom nav */}
    </div>
  );
};

function App() {
  const loginWithToken = useAuthStore(state => state.loginWithToken);

  useEffect(() => {
    setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (token) {
        loginWithToken(token);
      }
    }, 300);
  }, [loginWithToken]);

  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ArenaLayout>
                <Dashboard />
              </ArenaLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/game"
          element={
            <ProtectedRoute>
              <ArenaLayout>
                <Game />
              </ArenaLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <ArenaLayout>
                <Leaderboard />
              </ArenaLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/social"
          element={
            <ProtectedRoute>
              <ArenaLayout>
                <Social />
              </ArenaLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/referrals"
          element={
            <ProtectedRoute>
              <ArenaLayout>
                <Referrals />
              </ArenaLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ArenaLayout>
                <Profile />
              </ArenaLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
