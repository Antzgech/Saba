import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import GamePage from "./pages/GamePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import RewardsPage from "./pages/RewardsPage";
import TasksPage from "./pages/TasksPage";
import SponsorsPage from "./pages/SponsorsPage";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const onboardingComplete = localStorage.getItem("onboarding_complete");
        setHasSeenOnboarding(!!onboardingComplete);

        const token = localStorage.getItem("token");
        if (token) {
          // Fetch real user data from PostgreSQL via Railway
          const response = await fetch(`${API_URL}/api/user`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem("token");
          }
        }
      } catch (error) {
        console.error("Auth sync error:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  if (loading) return <div className="loading-screen">⚜️ Loading Axum...</div>;

  return (
    <Router>
      <div className="app-container">
        {user && hasSeenOnboarding && <Navbar user={user} />}
        <main className="main-content">
          <Routes>
            <Route path="/" element={!user ? <HomePage setUser={setUser} /> : <Navigate to="/dashboard" />} />
            <Route path="/onboarding" element={user && !hasSeenOnboarding ? <OnboardingPage setHasSeenOnboarding={setHasSeenOnboarding} /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/" />} />
            <Route path="/game" element={user ? <GamePage user={user} /> : <Navigate to="/" />} />
            <Route path="/leaderboard" element={user ? <LeaderboardPage /> : <Navigate to="/" />} />
            <Route path="/rewards" element={user ? <RewardsPage user={user} /> : <Navigate to="/" />} />
            <Route path="/tasks" element={user ? <TasksPage user={user} /> : <Navigate to="/" />} />
            <Route path="/sponsors" element={<SponsorsPage />} />
          </Routes>
        </main>
        {user && hasSeenOnboarding && <Footer />}
      </div>
    </Router>
  );
}
