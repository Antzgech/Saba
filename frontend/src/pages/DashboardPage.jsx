import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./DashboardPage.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function DashboardPage({ user }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Dashboard error:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return <div className="loading">Syncing stats...</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h2 className="title-greeting">Welcome Back,</h2>
        <h1 className="title-name">{stats?.first_name || "Runner"}</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Points</span>
          <span className="stat-value text-gold">{stats?.points || 0}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Current Level</span>
          <span className="stat-value">Level {stats?.level || 1}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Streak</span>
          <span className="stat-value">{stats?.streak || 0} Days</span>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/game" className="btn-primary">Continue Journey</Link>
        <Link to="/tasks" className="btn-secondary">Earn More Points</Link>
      </div>
    </div>
  );
}
