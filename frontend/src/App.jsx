import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import GamePage from './pages/GamePage';
import LeaderboardPage from './pages/LeaderboardPage';
import RewardsPage from './pages/RewardsPage';
import TasksPage from './pages/TasksPage';
import SponsorsPage from './pages/SponsorsPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check for Telegram auth and existing session
    const checkAuth = async () => {
      try {
        // Check localStorage for onboarding completion
        const onboardingComplete = localStorage.getItem('axum_onboarding_complete');
        setHasSeenOnboarding(!!onboardingComplete);

        // Check for existing session
        const token = localStorage.getItem('axum_token');
        if (token) {
          // Validate token and fetch user data
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('axum_token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem('axum_onboarding_complete', 'true');
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
            <Route path="/" element={
              !user ? <HomePage setUser={setUser} /> : 
              !hasSeenOnboarding ? <Navigate to="/onboarding" /> :
              <Navigate to="/dashboard" />
            } />
            
            <Route path="/onboarding" element={
              user && !hasSeenOnboarding ? 
              <OnboardingPage onComplete={handleOnboardingComplete} /> : 
              <Navigate to={user ? "/dashboard" : "/"} />
            } />
            
            <Route path="/dashboard" element={
              user && hasSeenOnboarding ? 
              <DashboardPage user={user} /> : 
              <Navigate to="/" />
            } />
            
            <Route path="/game" element={
              user && hasSeenOnboarding ? 
              <GamePage user={user} /> : 
              <Navigate to="/" />
            } />
            
            <Route path="/leaderboard" element={
              user && hasSeenOnboarding ? 
              <LeaderboardPage /> : 
              <Navigate to="/" />
            } />
            
            <Route path="/rewards" element={
              user && hasSeenOnboarding ? 
              <RewardsPage user={user} /> : 
              <Navigate to="/" />
            } />
            
            <Route path="/tasks" element={
              user && hasSeenOnboarding ? 
              <TasksPage user={user} /> : 
              <Navigate to="/" />
            } />
            
            <Route path="/sponsors" element={
              user && hasSeenOnboarding ? 
              <SponsorsPage /> : 
              <Navigate to="/" />
            } />
          </Routes>
        </main>
        
        {user && hasSeenOnboarding && <Footer />}
      </div>
    </Router>
  );
}

export default App;
