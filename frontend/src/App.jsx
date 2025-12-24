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
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Check localStorage for onboarding completion
      const onboardingComplete = localStorage.getItem('axum_onboarding_complete');
      setHasSeenOnboarding(!!onboardingComplete);

      // Check for existing session
      const token = localStorage.getItem('axum_token');
      
      if (token) {
        // Validate token with backend
        try {
          const response = await fetch('https://saba-hbhv.vercel.app/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            console.log('✅ User authenticated:', userData);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('axum_token');
            console.log('❌ Invalid token, cleared');
          }
        } catch (error) {
          console.error('Token validation failed:', error);
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('axum_onboarding_complete', 'true');
    setHasSeenOnboarding(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('axum_token');
    localStorage.removeItem('axum_onboarding_complete');
    setUser(null);
    setHasSeenOnboarding(false);
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
        {/* Only show navbar if user is logged in AND has seen onboarding */}
        {user && hasSeenOnboarding && <Navbar onLogout={handleLogout} />}
        
        <main className="main-content">
          <Routes>
            <Route 
              path="/" 
              element={
                !user ? (
                  <HomePage setUser={setUser} />
                ) : !hasSeenOnboarding ? (
                  <Navigate to="/onboarding" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )
              } 
            />
            
            <Route 
              path="/onboarding" 
              element={
                user && !hasSeenOnboarding ? (
                  <OnboardingPage onComplete={handleOnboardingComplete} />
                ) : user && hasSeenOnboarding ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                user && hasSeenOnboarding ? (
                  <DashboardPage user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route 
              path="/game" 
              element={
                user && hasSeenOnboarding ? (
                  <GamePage user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route 
              path="/leaderboard" 
              element={
                user && hasSeenOnboarding ? (
                  <LeaderboardPage />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route 
              path="/rewards" 
              element={
                user && hasSeenOnboarding ? (
                  <RewardsPage user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route 
              path="/tasks" 
              element={
                user && hasSeenOnboarding ? (
                  <TasksPage user={user} />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route 
              path="/sponsors" 
              element={
                user && hasSeenOnboarding ? (
                  <SponsorsPage />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        {/* Only show footer if user is logged in AND has seen onboarding */}
        {user && hasSeenOnboarding && <Footer />}
      </div>
    </Router>
  );
}

export default App;
