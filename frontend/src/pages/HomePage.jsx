.home-page {
  min-height: 100vh;
  width: 100%;
  padding: 0;
  margin: 0;
}

.home-hero {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow: hidden;
}

.hero-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 30% 20%, rgba(212, 175, 55, 0.15) 0%, transparent 50%),
    radial-gradient(circle at 70% 80%, rgba(30, 95, 62, 0.15) 0%, transparent 50%),
    linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%);
  z-index: 0;
}

.hero-background::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 100px,
      rgba(212, 175, 55, 0.02) 100px,
      rgba(212, 175, 55, 0.02) 102px
    );
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  text-align: center;
  animation: fadeIn 1s ease-out;
}

.hero-icon-large {
  font-size: 5rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 30px var(--gold-primary));
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.hero-title {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.title-line {
  font-size: 1.5rem;
  font-weight: 600;
  letter-spacing: 0.3em;
  color: var(--gold-light);
  opacity: 0;
  animation: slideInLeft 0.8s ease-out 0.3s forwards;
}

.title-main {
  font-size: 5rem;
  font-weight: 900;
  letter-spacing: 0.2em;
  background: linear-gradient(135deg, var(--gold-primary) 0%, var(--gold-light) 50%, var(--gold-primary) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 0 40px rgba(212, 175, 55, 0.5);
  opacity: 0;
  animation: slideInRight 0.8s ease-out 0.5s forwards;
}

.hero-subtitle {
  font-family: var(--font-body);
  font-size: 1.5rem;
  font-style: italic;
  color: var(--neutral-light);
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeIn 0.8s ease-out 0.7s forwards;
}

.hero-description {
  max-width: 700px;
  margin: 0 auto 3rem;
  padding: 2rem;
  background: rgba(26, 26, 26, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  opacity: 0;
  animation: fadeIn 0.8s ease-out 0.9s forwards;
}

.hero-description p {
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--neutral-light);
  margin: 0;
}

.login-section {
  margin: 3rem 0;
  opacity: 0;
  animation: fadeIn 0.8s ease-out 1.1s forwards;
}

.login-card {
  background: linear-gradient(135deg, rgba(26, 26, 26, 0.9) 0%, rgba(45, 45, 45, 0.9) 100%);
  backdrop-filter: blur(20px);
  border: 2px solid var(--gold-primary);
  border-radius: var(--radius-lg);
  padding: 2.5rem;
  box-shadow: 0 8px 32px rgba(212, 175, 55, 0.2);
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: 
    radial-gradient(circle at 50% 0%, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.login-title {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--gold-primary);
}

.login-text {
  font-size: 1.125rem;
  color: var(--neutral-light);
  margin-bottom: 2rem;
}

.telegram-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
  margin-top: 4rem;
  opacity: 0;
  animation: fadeIn 0.8s ease-out 1.3s forwards;
}

.feature-card {
  background: rgba(26, 26, 26, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-lg);
  padding: 2rem 1.5rem;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, transparent, var(--gold-primary), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  border-color: var(--gold-primary);
  box-shadow: 0 8px 24px rgba(212, 175, 55, 0.3);
}

.feature-card:hover::before {
  opacity: 1;
}

.feature-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 10px var(--gold-primary));
}

.feature-title {
  font-size: 1.25rem;
  margin-bottom: 0.75rem;
  color: var(--gold-primary);
}

.feature-text {
  font-size: 1rem;
  color: var(--neutral-light);
  line-height: 1.6;
}

.sponsors-preview {
  width: 100%;
  padding: 4rem 2rem;
  background: rgba(26, 26, 26, 0.6);
  border-top: 2px solid rgba(212, 175, 55, 0.2);
}

.sponsors-container {
  max-width: 1200px;
  margin: 0 auto;
  text-align: center;
}

.sponsors-title {
  font-size: 2rem;
  margin-bottom: 2rem;
  color: var(--gold-primary);
}

.sponsors-logos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 2rem;
  align-items: center;
  justify-items: center;
}

.sponsor-placeholder {
  padding: 2rem;
  background: rgba(45, 45, 45, 0.8);
  border: 1px solid rgba(212, 175, 55, 0.2);
  border-radius: var(--radius-md);
  font-family: var(--font-display);
  font-size: 1.125rem;
  color: var(--gold-primary);
  width: 100%;
  max-width: 250px;
  transition: all 0.3s ease;
}

.sponsor-placeholder:hover {
  border-color: var(--gold-primary);
  box-shadow: 0 4px 16px rgba(212, 175, 55, 0.2);
  transform: translateY(-4px);
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-content {
    padding: 1rem;
  }

  .hero-icon-large {
    font-size: 3.5rem;
  }

  .title-line {
    font-size: 1.125rem;
  }

  .title-main {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.125rem;
  }

  .hero-description {
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .hero-description p {
    font-size: 1rem;
  }

  .login-card {
    padding: 2rem 1.5rem;
  }

  .login-title {
    font-size: 1.5rem;
  }

  .login-text {
    font-size: 1rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .feature-card {
    padding: 1.5rem 1rem;
  }

  .sponsors-logos {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}

@media (max-width: 480px) {
  .home-hero {
    padding: 1rem;
  }

  .hero-icon-large {
    font-size: 2.5rem;
  }

  .title-line {
    font-size: 1rem;
    letter-spacing: 0.2em;
  }

  .title-main {
    font-size: 2.5rem;
    letter-spacing: 0.15em;
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .login-card {
    padding: 1.5rem 1rem;
  }

  .sponsors-preview {
    padding: 3rem 1rem;
  }
}
