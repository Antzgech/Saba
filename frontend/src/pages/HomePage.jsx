// src/pages/HomePage.jsx
import { useEffect } from "react";
import "./HomePage.css";
import Antz from "../lib/Antz";
import Tasks from "../components/Tasks";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function HomePage({ setUser, user }) {
  useEffect(() => {
    try {
      localStorage.setItem("token", "dev-token-Antz");
      localStorage.setItem("user", JSON.stringify(Antz));
      setUser(Antz);

      if (API_URL) {
        fetch(`${API_URL}/api/auth/telegram`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        }).catch(() => {});
      }
    } catch (e) {
      console.error(e);
    }
  }, [setUser]);

  return (
    <div className="home-page">
      <div className="home-hero">
        <div className="hero-background"></div>

        <div className="hero-content">
          <div className="hero-icon-large">⚜️</div>

          <h1 className="hero-title">
            <span className="title-line">WELCOME TO</span>
            <span className="title-main">AXUM</span>
          </h1>

          <p className="hero-subtitle">
            Join Queen Makeda's quest to find the wisest and most courageous
          </p>

          <div className="hero-description">
            <p>
              In the ancient land of Saba, Queen Makeda seeks worthy companions
              for her legendary journey to Jerusalem. Prove your wisdom and
              courage through challenges, earn rewards, and compete for the
              honor of joining her quest.
            </p>
          </div>

          <Tasks user={user || Antz} setUser={setUser} />
        </div>
      </div>

      <div className="sponsors-preview">
        <div className="sponsors-container">
          <h2 className="sponsors-title">Supported By</h2>
          <div className="sponsors-logos">
            <div className="sponsor-placeholder">SABA Company</div>
            <div className="sponsor-placeholder">Partner 1</div>
            <div className="sponsor-placeholder">Partner 2</div>
            <div className="sponsor-placeholder">Partner 3</div>
          </div>
        </div>
      </div>
    </div>
  );
}
