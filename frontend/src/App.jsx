import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Changed to /api/user to match backend database route
          const response = await fetch(`${API_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem("token");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  if (loading) return <div className="loading">⚜️ Loading Axum...</div>;

  return (
    <Router>
      <div className="app">
        {user && <Navbar user={user} />}
        <Routes>
          <Route path="/" element={!user ? <HomePage setUser={setUser} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/" />} />
          <Route path="/leaderboard" element={user ? <LeaderboardPage /> : <Navigate to="/" />} />
        </Routes>
        {user && <Footer />}
      </div>
    </Router>
  );
}
