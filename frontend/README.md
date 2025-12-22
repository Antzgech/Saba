# Axum - Queen Makeda's Quest

A gamified Telegram-integrated web application for growing social media subscribers through an engaging narrative experience based on the legendary Queen Makeda of Saba.

## 🎮 Project Overview

Axum is a unique social media growth platform that combines:
- **Ethiopian Cultural Heritage**: Inspired by Queen Makeda's journey to Jerusalem
- **Gamification**: 6 progressive levels with challenges and rewards
- **Social Integration**: YouTube, Facebook, TikTok, and Telegram
- **Competitive Leaderboards**: Top players compete for finalist positions
- **Real Rewards**: Cash prizes, points, badges, and sponsor perks

## ✨ Key Features

### Authentication & Onboarding
- Telegram Web Login integration (auto-login)
- Immersive onboarding with Queen Makeda's story
- Seamless user journey from login to dashboard

### Game Mechanics
- **6 Levels**: Unlocking bi-weekly (every 2 weeks)
- **Requirements**: Invites, subscriptions, follows before playing
- **Top 10 Rewards**: Per level, updated every bi-weekly cycle
- **30 Finalists**: Top 5 from each level compete in final tournament
- **Uniqueness Rule**: Players assigned to highest qualifying level

### Pages & Components
1. **Home Page**: Welcome, login, features, sponsors
2. **Onboarding**: 6-step story narrative
3. **Dashboard**: User stats, current level, quick actions
4. **Game Page**: 6 levels with unlock status and deadlines
5. **Leaderboard**: Rankings per level + finalists showcase
6. **Rewards**: Cash (Remitly), points, badges, sponsor perks
7. **Tasks**: YouTube, Telegram, Facebook, TikTok integration
8. **Sponsors**: Partner logos and tiers

## 🎨 Design System

### Color Palette (Ethiopian-Inspired)
- **Gold Primary**: #D4AF37 (Royal gold)
- **Emerald**: #1E5F3E (Ethiopian green)
- **Deep Red**: #8B1A1A (Traditional red)
- **Neutral Dark**: #1A1A1A (Background)
- **Gold Light**: #F4E4B8 (Highlights)

### Typography
- **Display Font**: Cinzel (serif, regal, uppercase headers)
- **Body Font**: Cormorant Garamond (elegant, readable)

### Aesthetic Direction
- **Tone**: Refined minimalism with cultural richness
- **Motion**: Subtle animations, staggered reveals, hover states
- **Visual Details**: Gradient borders, drop shadows, gold glows
- **Layout**: Asymmetric cards, generous spacing, Ethiopian patterns

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- Backend API running (authentication, tasks, leaderboard)
- Telegram Bot setup for Web Login

### Installation

```bash
# Navigate to project directory
cd axum-frontend

# Install dependencies
npm install

# Set environment variables
# Create .env file:
REACT_APP_API_URL=http://localhost:5000
REACT_APP_TELEGRAM_BOT_USERNAME=YourBotUsername

# Start development server
npm start
```

The app will run on `http://localhost:3000`

### Build for Production

```bash
# Create optimized production build
npm run build

# The build folder is ready for deployment
```

## 📦 Deployment to Vercel

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd axum-frontend
vercel

# Follow prompts to link project
# Choose "React" framework preset
```

### Method 2: GitHub Integration

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Configure:
   - Framework: React
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Add environment variables:
   - `REACT_APP_API_URL`
   - `REACT_APP_TELEGRAM_BOT_USERNAME`
6. Deploy!

### Environment Variables in Vercel

Go to Project Settings → Environment Variables:
```
REACT_APP_API_URL=https://your-backend-api.com
REACT_APP_TELEGRAM_BOT_USERNAME=AxumGameBot
```

## 🔌 API Integration

The frontend expects these backend endpoints:

### Authentication
- `POST /api/auth/telegram` - Telegram login
- `GET /api/auth/me` - Get current user

### User Data
- `GET /api/user/stats` - Dashboard statistics
- `GET /api/levels` - Get all levels with status
- `GET /api/tasks` - Get available tasks
- `POST /api/tasks/:id/complete` - Mark task complete

### Leaderboard & Rewards
- `GET /api/leaderboard?level=X` - Get rankings
- `GET /api/rewards` - Get user rewards

### Request Headers
All authenticated requests require:
```
Authorization: Bearer <token>
```

## 📁 Project Structure

```
axum-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Navbar.css
│   │   ├── Footer.jsx
│   │   └── Footer.css
│   ├── pages/
│   │   ├── HomePage.jsx & .css
│   │   ├── OnboardingPage.jsx & .css
│   │   ├── DashboardPage.jsx & .css
│   │   ├── GamePage.jsx & .css
│   │   ├── LeaderboardPage.jsx & .css
│   │   ├── RewardsPage.jsx & .css
│   │   ├── TasksPage.jsx & .css
│   │   └── SponsorsPage.jsx & .css
│   ├── App.jsx
│   ├── App.css (Design system)
│   ├── index.jsx
│   └── index.css
├── package.json
└── README.md
```

## 🎯 Game Logic Implementation

### Level Unlocking
- Levels unlock every 2 weeks based on server date
- Players must complete requirements before playing:
  - Invite X friends
  - Subscribe to Y channels
  - Follow Z accounts

### Scoring & Rewards
- Each level has a max score
- Top 10 players earn rewards bi-weekly
- After earning reward, player exits that level's top 10
- New top 10 emerges for next cycle

### Finalist Selection
- Top 5 from each level = 30 finalists
- If player qualifies in multiple levels:
  - Automatically assigned to highest level
  - Ensures 30 unique finalists
- Finalists compete in final tournament

## 🎨 Customization

### Branding
Edit colors in `src/App.css`:
```css
:root {
  --gold-primary: #D4AF37;
  --emerald: #1E5F3E;
  /* ... */
}
```

### Sponsor Logos
Update `src/pages/SponsorsPage.jsx`:
```javascript
const sponsors = [
  { name: 'Your Sponsor', logo: '🏛️', url: 'https://...', tier: 'platinum' },
  // ...
];
```

### Story Content
Edit `src/pages/OnboardingPage.jsx`:
```javascript
const storySteps = [
  { title: "Your Title", content: "Your story...", icon: "🎨" },
  // ...
];
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage
```

## 📱 Mobile Responsiveness

The app is fully responsive with breakpoints:
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: < 768px

All components adapt gracefully to screen sizes.

## 🔒 Security Considerations

1. **Telegram Auth**: Validated on backend
2. **Token Storage**: localStorage (consider httpOnly cookies for production)
3. **API Calls**: Always use HTTPS in production
4. **Environment Variables**: Never commit .env to version control

## 🐛 Troubleshooting

### Telegram Login Not Working
- Verify bot username in environment variables
- Check bot settings in BotFather
- Ensure backend auth endpoint is accessible

### API Errors
- Check network tab for failed requests
- Verify API_URL environment variable
- Ensure backend is running and CORS is configured

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear cache: `npm cache clean --force`
- Check Node version: `node --version` (should be 16+)

## 📄 License

This project is proprietary software owned by SABA Company.

## 🤝 Contributing

For internal team members:
1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit PR for review

## 📞 Support

For questions or issues:
- Email: support@saba.com
- Telegram: @AxumSupport

---

**Built with ⚜️ by SABA Company**

*Walk in the footsteps of Queen Makeda*
