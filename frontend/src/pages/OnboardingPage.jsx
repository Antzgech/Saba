import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingPage.css';

function OnboardingPage({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const storySteps = [
    {
      title: "The Land of Saba",
      content: "Once upon a time, in the land of Saba (959 BC), there ruled a wise and beloved queen named Makeda. She was so intelligent and just that her people adored her, and even neighboring kingdoms admired her rule. Word spread that no ruler was wiser than Makeda.",
      icon: "👑",
      background: "radial-gradient(circle at 30% 50%, rgba(212, 175, 55, 0.2) 0%, transparent 70%)"
    },
    {
      title: "The Quest for Wisdom",
      content: "But Makeda heard of another king — Solomon of Jerusalem, famed for his unmatched wisdom. Curious and determined to learn from him, she prepared a great journey to Jerusalem. Yet she would not travel alone.",
      icon: "✨",
      background: "radial-gradient(circle at 70% 50%, rgba(30, 95, 62, 0.2) 0%, transparent 70%)"
    },
    {
      title: "The Royal Challenge",
      content: "She called upon her people of Saba to prove themselves worthy of joining her. Makeda announced: 'Only the smartest and most courageous among you will accompany me. To prove yourselves, you must complete daily tasks and challenges. These will test your loyalty, wisdom, and strength.'",
      icon: "⚔️",
      background: "radial-gradient(circle at 50% 30%, rgba(139, 26, 26, 0.2) 0%, transparent 70%)"
    },
    {
      title: "The Path to Glory",
      content: "The challenges included: playing games for points, subscribing to channels, following and joining communities, inviting friends, and sharing posts. Every action earned points, and every 15 days, the top 10 players were rewarded. But only the top 5 of each level would be chosen as finalists to continue the journey.",
      icon: "🎮",
      background: "radial-gradient(circle at 20% 70%, rgba(212, 175, 55, 0.2) 0%, transparent 70%)"
    },
    {
      title: "The Final Tournament",
      content: "Across six levels, 30 unique finalists would be chosen. They would then compete in a final tournament to determine the champion — the one worthy of joining Queen Makeda herself on her journey to Jerusalem.",
      icon: "🏆",
      background: "radial-gradient(circle at 80% 40%, rgba(212, 175, 55, 0.25) 0%, transparent 70%)"
    },
    {
      title: "Your Journey Begins",
      content: "Now it is your turn to prove yourself. Will you rise through the ranks and become one of the chosen few? The path to Jerusalem awaits those brave enough to take it.",
      icon: "🚀",
      background: "radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.3) 0%, transparent 80%)"
    }
  ];

  const handleNext = () => {
    if (currentStep < storySteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    navigate('/dashboard');
  };

  const currentStory = storySteps[currentStep];

  return (
    <div className="onboarding-page">
      <div className="onboarding-container">
        <div 
          className="story-background"
          style={{ background: currentStory.background }}
        ></div>

        <div className="story-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${((currentStep + 1) / storySteps.length) * 100}%` }}
            ></div>
          </div>
          <p className="progress-text">
            {currentStep + 1} of {storySteps.length}
          </p>
        </div>

        <div className="story-card">
          <div className="story-icon">{currentStory.icon}</div>
          
          <h1 className="story-title">{currentStory.title}</h1>
          
          <div className="story-content">
            <p>{currentStory.content}</p>
          </div>

          <div className="story-navigation">
            <button
              className={`btn btn-secondary ${currentStep === 0 ? 'disabled' : ''}`}
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              ← Previous
            </button>

            {currentStep < storySteps.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={handleNext}
              >
                Next →
              </button>
            ) : (
              <button
                className="btn btn-primary btn-complete"
                onClick={handleComplete}
              >
                Begin Quest ⚔️
              </button>
            )}
          </div>
        </div>

        <div className="story-dots">
          {storySteps.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              onClick={() => setCurrentStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default OnboardingPage;
