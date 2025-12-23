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
        // Check onboarding status
        const onboardingComplete = localStorage.getItem("onboarding_complete");
        setHasSeenOnboarding(!!onboardingComplete);

        // Check token
        const token = localStorage.getItem("token");
        if (token) {
          const response = await fetch(`${API_URL}/api/auth/me`, {
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
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("onboarding_complete", "true");
    setHasSeenOnboarding(true);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading Axum...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {user && hasSeenOnboarding && <Navbar />}

        <main className="main-content">
          <Routes>
            {/* HOME */}
            <Route
              path="/"
              element={
                !user ? (
                  <HomePage setUser={setUser} />
                ) : !hasSeenOnboarding ? (
                  <Navigate to="/onboarding" />
                ) : (
                  <Navigate to="/dashboard" />
                )
              }
            />

            {/* ONBOARDING */}
            <Route
              path="/onboarding"
              element={
                user && !hasSeenOnboarding ? (
                  <OnboardingPage onComplete={handleOnboardingComplete} />
                ) : (
                  <Navigate to={user ? "/dashboard" : "/"} />
                )
              }
            />

            {/* DASHBOARD */}
            <Route
              path="/dashboard"
              element={
                user && hasSeenOnboarding ? (
                  <DashboardPage user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* GAME */}
            <Route
              path="/game"
              element={
                user && hasSeenOnboarding ? (
                  <GamePage user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* LEADERBOARD */}
            <Route
              path="/leaderboard"
              element={
                user && hasSeenOnboarding ? (
                  <LeaderboardPage />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* REWARDS */}
            <Route
              path="/rewards"
              element={
                user && hasSeenOnboarding ? (
                  <RewardsPage user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* TASKS */}
            <Route
              path="/tasks"
              element={
                user && hasSeenOnboarding ? (
                  <TasksPage user={user} />
                ) : (
                  <Navigate to="/" />
                )
              }
            />

            {/* SPONSORS */}
            <Route
              path="/sponsors"
              element={
                user && hasSeenOnboarding ? (
                  <SponsorsPage />
                ) : (
                  <Navigate to="/" />
                )
              }
            />
          </Routes>
        </main>

        {user && hasSeenOnboarding && <Footer />}
      </div>
    </Router>
  );
}
