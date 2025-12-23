import "./OnboardingPage.css";

export default function OnboardingPage({ onComplete }) {
  const handleFinish = () => {
    // Save onboarding completion using the correct key
    localStorage.setItem("onboarding_complete", "true");

    // Notify App.jsx that onboarding is done
    onComplete();
  };

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <h1 className="onboarding-title">Begin Your Journey</h1>

        <p className="onboarding-text">
          Before joining Queen Makeda’s quest, complete this short introduction
          to understand your mission and the challenges ahead.
        </p>

        <div className="onboarding-card">
          <h2 className="onboarding-step-title">Your Mission</h2>
          <p className="onboarding-step-text">
            Earn points, complete tasks, rise through the levels, and prove your
            wisdom and courage. Only the most dedicated will reach Jerusalem.
          </p>
        </div>

        <div className="onboarding-card">
          <h2 className="onboarding-step-title">How It Works</h2>
          <p className="onboarding-step-text">
            You’ll complete challenges, compete on the leaderboard, and unlock
            rewards as you progress through the Axum experience.
          </p>
        </div>

        <button className="onboarding-button" onClick={handleFinish}>
          Begin Journey
        </button>
      </div>
    </div>
  );
}
