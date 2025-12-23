import { useState, useEffect } from "react";
import "./RewardsPage.css";

const API_URL = import.meta.env.VITE_API_URL;

export default function RewardsPage() {
  const [rewards, setRewards] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/rewards`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    }
  };

  const handleClaimReward = (reward) => {
    if (reward.type === "cash") {
      setSelectedReward(reward);
      setShowPaymentForm(true);
    } else {
      alert(`${reward.name} claimed successfully!`);
    }
  };

  return (
    <div className="rewards-page">
      <div className="rewards-header">
        <h1 className="rewards-title">Your Rewards</h1>
        <p className="rewards-subtitle">Treasures earned on your journey</p>
      </div>

      <div className="rewards-grid">
        <div className="reward-card cash-reward">
          <span className="reward-icon">💰</span>
          <h3 className="reward-title">Cash Rewards</h3>
          <p className="reward-value">$250.00</p>
          <p className="reward-desc">Via Remitly transfer</p>
          <button
            className="btn btn-primary"
            onClick={() => handleClaimReward({ type: "cash", value: 250 })}
          >
            Claim Now
          </button>
        </div>

        <div className="reward-card points-reward">
          <span className="reward-icon">⚔️</span>
          <h3 className="reward-title">Total Points</h3>
          <p className="reward-value">{rewards?.points || 0}</p>
          <p className="reward-desc">Earned across all levels</p>
        </div>

        <div className="reward-card badges-reward">
          <span className="reward-icon">🏅</span>
          <h3 className="reward-title">Badges</h3>
          <p className="reward-value">{rewards?.badges?.length || 0}</p>
          <p className="reward-desc">Achievements unlocked</p>
        </div>

        <div className="reward-card sponsor-reward">
          <span className="reward-icon">🎁</span>
          <h3 className="reward-title">Sponsor Perks</h3>
          <p className="reward-value">3 Active</p>
          <p className="reward-desc">Exclusive benefits</p>
        </div>
      </div>

      {showPaymentForm && (
        <div className="payment-modal">
          <div className="modal-content">
            <button
              className="modal-close"
              onClick={() => setShowPaymentForm(false)}
            >
              ×
            </button>
            <h2>Enter Payment Details</h2>
            <form className="payment-form">
              <input type="text" placeholder="Full Name" required />
              <input type="email" placeholder="Email" required />
              <input type="text" placeholder="Remitly Account" required />
              <button type="submit" className="btn btn-primary">
                Submit & Claim
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="reward-history">
        <h2 className="section-title">Reward History</h2>
        <div className="history-list">
          <div className="history-item">
            <span className="history-icon">🏆</span>
            <div className="history-info">
              <p className="history-text">Level 1 Top 10 Reward</p>
              <span className="history-date">Dec 15, 2024</span>
            </div>
            <span className="history-value">+500 Points</span>
          </div>
        </div>
      </div>
    </div>
  );
}
