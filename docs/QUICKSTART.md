# Quick Start Guide - Telegram Rewards App

## 🚀 Get Started in 5 Minutes

### Step 1: Prerequisites
Ensure you have installed:
- Node.js 18+ ([Download](https://nodejs.org/))
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Git ([Download](https://git-scm.com/))

### Step 2: Create Telegram Bot
1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow instructions to name your bot
4. Copy the **bot token** (e.g., `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)
5. Copy the **bot username** (e.g., `YourRewardsBot`)

### Step 3: Setup Database
```bash
# Start PostgreSQL
# On Mac: brew services start postgresql
# On Linux: sudo service postgresql start
# On Windows: Use pgAdmin

# Create database
psql postgres
CREATE DATABASE telegram_rewards;
\q
```

### Step 4: Backend Setup
```bash
# Clone project (or extract zip)
cd telegram-rewards-app/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env with your values
# Required fields:
# - TELEGRAM_BOT_TOKEN=your_bot_token
# - TELEGRAM_BOT_USERNAME=your_bot_username
# - DB_PASSWORD=your_postgres_password
# - JWT_SECRET=any_random_string_at_least_32_chars

# Start server
npm run dev
```

Backend will start at `http://localhost:5000`

### Step 5: Frontend Setup
```bash
# Open new terminal
cd telegram-rewards-app/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will start at `http://localhost:3000`

### Step 6: Configure Telegram Bot
1. Go to @BotFather in Telegram
2. Send `/setmenubutton` and select your bot
3. Send the menu button text: "Play & Earn"
4. Send your web app URL: `https://your-domain.com` (for now use ngrok)

#### Using ngrok for testing:
```bash
# Install ngrok: https://ngrok.com/download
ngrok http 3000

# Copy the https URL (e.g., https://abc123.ngrok.io)
# Use this URL in Telegram bot settings
```

### Step 7: Test the App
1. Open your bot in Telegram
2. Click "Start" or the menu button
3. Web app should open
4. Login with your Telegram account
5. Explore dashboard, play game, check leaderboard

## ⚙️ Minimal Configuration

### Backend .env (Minimum Required)
```env
PORT=5000
NODE_ENV=development
DB_NAME=telegram_rewards
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=create_a_long_random_string_here_minimum_32_characters
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_BOT_USERNAME=YourRewardsBot
FRONTEND_URL=http://localhost:3000
```

### Frontend .env
```env
VITE_API_URL=http://localhost:5000/api
```

## 🎮 First Time User Flow

1. **Login**: User opens bot → Web app opens → Auto-login with Telegram
2. **Welcome**: New user gets 100 bonus points
3. **Dashboard**: See stats, play game, complete tasks
4. **Play Game**: Click "Play Now" → 10-minute circle-clicking game
5. **Earn Points**: Complete game → Points awarded based on score
6. **Level Up**: Accumulate 1000 points → Reach Level 2
7. **Leaderboard**: Check ranking and see top players
8. **Referrals**: Share referral link → Get 500 points per friend

## 🔧 Troubleshooting

### Backend won't start
- Check PostgreSQL is running
- Verify database exists: `psql -U postgres -l`
- Check all required .env variables are set
- View logs for specific errors

### Frontend won't start
- Clear node_modules: `rm -rf node_modules && npm install`
- Check port 3000 is not in use
- Verify backend is running first

### Telegram login not working
- Verify TELEGRAM_BOT_TOKEN is correct
- Check bot username matches in .env
- Ensure FRONTEND_URL is correct in backend .env
- Try in Telegram mobile app (not desktop initially)

### Database connection failed
- Check PostgreSQL is running
- Verify credentials in .env
- Check firewall isn't blocking port 5432
- Try: `psql -U postgres -d telegram_rewards` to test connection

## 📱 Testing on Mobile

### Option 1: ngrok (Recommended for testing)
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend
cd frontend && npm run dev

# Terminal 3: Expose frontend
ngrok http 3000

# Use ngrok HTTPS URL in bot settings
```

### Option 2: Local Network
1. Get your local IP: `ifconfig` (Mac/Linux) or `ipconfig` (Windows)
2. Update frontend .env: `VITE_API_URL=http://YOUR_IP:5000/api`
3. Update backend .env: `FRONTEND_URL=http://YOUR_IP:3000`
4. Access from mobile on same network: `http://YOUR_IP:3000`

## 🎯 Next Steps

1. **Add Social Channels**: Use admin panel to add YouTube/TikTok channels
2. **Customize Rewards**: Edit LEVEL_X_REWARD values in backend .env
3. **Brand Customization**: Update colors in frontend/tailwind.config.js
4. **Add Admin User**: Set your Telegram ID in ADMIN_TELEGRAM_IDS
5. **Configure Cron**: Set REWARD_INTERVAL_DAYS (default: 15)

## 📚 Key Endpoints to Test

Once running, test these endpoints:

```bash
# Health check
curl http://localhost:5000/health

# Get leaderboard (no auth required)
curl http://localhost:5000/api/leaderboard/global

# Get channels (no auth required)
curl http://localhost:5000/api/social/channels
```

## 🆘 Getting Help

- Read full documentation: `docs/README.md`
- Check API responses for error messages
- Review backend logs in terminal
- Verify all environment variables are set correctly

## 🎉 You're Ready!

Your Telegram Rewards app is now running! Users can:
- Play daily games
- Complete social tasks
- Invite friends
- Compete on leaderboards
- Win real prizes

Remember to deploy to production before launching publicly!
