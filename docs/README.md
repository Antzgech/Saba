# Telegram Rewards App - Complete Documentation

A production-ready gamified reward system for Telegram Web App, inspired by Hamster Kombat. Users earn points through gaming, social media engagement, and referrals, with bi-weekly cash rewards for top performers.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Database Schema](#database-schema)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Cron Jobs](#cron-jobs)
- [Security](#security)

## ✨ Features

### Core Features
- **Telegram Authentication**: Seamless login via Telegram Web App
- **Daily Gaming**: 10-minute HTML5 game with point rewards
- **Social Media Tasks**: Automated verification for YouTube, TikTok, Facebook, Telegram
- **Referral System**: Shareable links with bonus points
- **Real-time Leaderboard**: WebSocket-powered live updates
- **Level System**: 3 progressive levels with cumulative rewards
- **Automated Rewards**: Cron job distributes prizes every 15 days
- **Admin Dashboard**: Complete management interface

### Reward Structure
- **Level 1**: Top 10 users receive $3
- **Level 2**: Top 10 users receive $8 (cumulative: $3 + $5)
- **Level 3**: Top 10 users receive $18 (cumulative: $3 + $5 + $10)

### Points System
- Welcome bonus: 100 points
- Daily game completion: Variable (based on score)
- Social subscriptions: 100 points each
- Friend referral: 500 points
- Points deducted if user unsubscribes (level preserved)

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Sequelize ORM
- **Authentication**: JWT + Telegram Web App validation
- **Real-time**: Socket.IO
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate limiting
- **Cron**: node-cron

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **Real-time**: Socket.IO Client
- **Animations**: Framer Motion
- **Notifications**: React Hot Toast

## 🏗 Architecture

```
telegram-rewards-app/
├── backend/
│   ├── config/
│   │   └── database.js          # PostgreSQL configuration
│   ├── controllers/
│   │   ├── authController.js    # Authentication logic
│   │   ├── gameController.js    # Game session management
│   │   ├── socialController.js  # Social media verification
│   │   ├── leaderboardController.js
│   │   ├── referralController.js
│   │   └── adminController.js   # Admin panel logic
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── validation.js        # Request validation
│   ├── models/
│   │   ├── User.js
│   │   ├── PointTransaction.js
│   │   ├── GameSession.js
│   │   ├── Reward.js
│   │   ├── SocialChannel.js
│   │   └── index.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── game.js
│   │   ├── social.js
│   │   ├── leaderboard.js
│   │   ├── referrals.js
│   │   └── admin.js
│   ├── scripts/
│   │   └── rewardsCron.js       # Automated reward distribution
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Game.jsx         # HTML5 game component
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   └── Login.jsx
│   │   ├── services/
│   │   │   └── api.js           # API client
│   │   ├── store/
│   │   │   └── index.js         # Zustand stores
│   │   ├── styles/
│   │   │   └── index.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── docs/
    └── README.md
```

## 📦 Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Telegram Bot (create via @BotFather)
- npm or yarn

### Backend Setup

1. **Clone and navigate to backend**:
```bash
cd telegram-rewards-app/backend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create environment file**:
```bash
cp .env.example .env
```

4. **Configure .env** (see Configuration section)

5. **Create PostgreSQL database**:
```sql
CREATE DATABASE telegram_rewards;
```

6. **Run database migrations**:
```bash
npm run migrate
```

7. **Start development server**:
```bash
npm run dev
```

Server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend**:
```bash
cd ../frontend
```

2. **Install dependencies**:
```bash
npm install
```

3. **Create environment file**:
```bash
echo "VITE_API_URL=http://localhost:5000/api" > .env
```

4. **Start development server**:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## ⚙️ Configuration

### Backend Environment Variables (.env)

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=telegram_rewards
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_BOT_USERNAME=your_bot_username

# Social Media APIs
YOUTUBE_API_KEY=your_youtube_api_key
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
TIKTOK_CLIENT_KEY=your_tiktok_client_key
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret

# Rewards
REWARD_INTERVAL_DAYS=15
LEVEL_1_REWARD=3
LEVEL_2_REWARD=5
LEVEL_3_REWARD=10

# CORS
FRONTEND_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Obtaining API Keys

#### Telegram Bot Token
1. Open Telegram and search for @BotFather
2. Send `/newbot` and follow instructions
3. Copy the bot token
4. Configure webhook or use Web App

#### YouTube API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project
3. Enable YouTube Data API v3
4. Create credentials (API key)

#### Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create new app
3. Add Facebook Login product
4. Get App ID and App Secret

#### TikTok API
1. Go to [TikTok Developers](https://developers.tiktok.com/)
2. Create new app
3. Get Client Key and Client Secret

## 🗄 Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  telegram_id VARCHAR UNIQUE NOT NULL,
  username VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  photo_url VARCHAR,
  total_points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  last_game_played_at TIMESTAMP,
  games_played_count INTEGER DEFAULT 0,
  youtube_subscribed BOOLEAN DEFAULT false,
  tiktok_subscribed BOOLEAN DEFAULT false,
  facebook_subscribed BOOLEAN DEFAULT false,
  telegram_channel_joined BOOLEAN DEFAULT false,
  referral_code VARCHAR UNIQUE NOT NULL,
  referred_by UUID REFERENCES users(id),
  referral_count INTEGER DEFAULT 0,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Point Transactions Table
```sql
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  points INTEGER NOT NULL,
  type ENUM('CREDIT', 'DEBIT'),
  reason VARCHAR NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Game Sessions Table
```sql
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  score INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  duration_seconds INTEGER NOT NULL,
  completed_at TIMESTAMP,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Rewards Table
```sql
CREATE TABLE rewards (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  level INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  rank INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status ENUM('PENDING', 'PROCESSING', 'PAID', 'FAILED'),
  paid_at TIMESTAMP,
  payment_reference VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Social Channels Table
```sql
CREATE TABLE social_channels (
  id UUID PRIMARY KEY,
  platform ENUM('YOUTUBE', 'TIKTOK', 'FACEBOOK', 'TELEGRAM'),
  channel_id VARCHAR NOT NULL,
  channel_name VARCHAR NOT NULL,
  channel_url VARCHAR NOT NULL,
  points_reward INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  verification_method ENUM('API', 'MANUAL', 'BOT'),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📡 API Documentation

### Authentication Endpoints

#### POST /api/auth/telegram
Authenticate user via Telegram
```json
Request:
{
  "telegramId": "123456789",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "photoUrl": "https://...",
  "authData": "{...}",
  "referralCode": "REF123" // optional
}

Response:
{
  "success": true,
  "data": {
    "token": "jwt_token",
    "user": { ... }
  }
}
```

#### GET /api/auth/me
Get current user profile (Requires: Authentication)

### Game Endpoints

#### GET /api/game/can-play
Check if user can play today (Requires: Authentication)

#### POST /api/game/start
Start new game session (Requires: Authentication)

#### POST /api/game/complete
Complete game and award points (Requires: Authentication)
```json
Request:
{
  "score": 1250,
  "durationSeconds": 580
}

Response:
{
  "success": true,
  "data": {
    "pointsEarned": 145,
    "totalPoints": 1245,
    "currentLevel": 2
  }
}
```

#### GET /api/game/history
Get game history (Requires: Authentication)

#### GET /api/game/stats
Get game statistics (Requires: Authentication)

### Social Media Endpoints

#### GET /api/social/channels
Get all active social channels

#### POST /api/social/verify
Verify social media subscription (Requires: Authentication)
```json
Request:
{
  "platform": "YOUTUBE",
  "channelId": "UC...",
  "proof": "optional_proof"
}
```

#### GET /api/social/status
Get subscription status (Requires: Authentication)

### Leaderboard Endpoints

#### GET /api/leaderboard/global
Get global leaderboard

#### GET /api/leaderboard/level/:level
Get leaderboard for specific level (1, 2, or 3)

#### GET /api/leaderboard/user-rank
Get current user's rank (Requires: Authentication)

#### GET /api/leaderboard/all-levels
Get top 10 from all levels

### Referral Endpoints

#### GET /api/referrals/stats
Get referral statistics (Requires: Authentication)

#### GET /api/referrals/link
Get referral link (Requires: Authentication)

#### GET /api/referrals/leaderboard
Get referral leaderboard

#### POST /api/referrals/validate
Validate referral code

### Admin Endpoints (All require Authentication + Admin role)

#### POST /api/admin/channels
Create new social channel

#### PUT /api/admin/channels/:id
Update social channel

#### DELETE /api/admin/channels/:id
Delete social channel

#### GET /api/admin/users
Get all users with pagination

#### PUT /api/admin/users/:id
Update user

#### GET /api/admin/stats
Get admin dashboard statistics

#### GET /api/admin/rewards
Get all reward distributions

#### PUT /api/admin/rewards/:id/status
Update reward status

## 🚀 Deployment

### Backend Deployment (Production)

#### Using PM2

1. **Install PM2 globally**:
```bash
npm install -g pm2
```

2. **Create ecosystem file**:
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'telegram-rewards-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

3. **Start application**:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Using Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

```bash
docker build -t telegram-rewards-api .
docker run -p 5000:5000 --env-file .env telegram-rewards-api
```

### Frontend Deployment

#### Build for production:
```bash
npm run build
```

#### Deploy to Vercel:
```bash
npm install -g vercel
vercel --prod
```

#### Deploy to Netlify:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## ⏰ Cron Jobs

### Reward Distribution

The system automatically distributes rewards every 15 days using node-cron.

#### Manual Execution:
```bash
cd backend
node scripts/rewardsCron.js
```

#### Scheduled Execution:
Automatically runs when server starts (production mode only).

#### Customizing Interval:
Set `REWARD_INTERVAL_DAYS` in `.env` file.

### Cron Expression:
- Default: `0 0 */15 * *` (Every 15 days at midnight)
- Testing: `*/5 * * * *` (Every 5 minutes)

## 🔒 Security

### Implemented Security Measures

1. **JWT Authentication**: Secure token-based auth with expiration
2. **Helmet.js**: HTTP header security
3. **CORS**: Configured for frontend origin only
4. **Rate Limiting**: 100 requests per 15 minutes per IP
5. **Input Validation**: Joi schemas for all inputs
6. **SQL Injection Protection**: Sequelize ORM with parameterized queries
7. **XSS Protection**: React escapes output by default
8. **HTTPS**: Recommended for production
9. **Environment Variables**: Sensitive data not in code
10. **Password Hashing**: bcrypt for any password fields

### Production Checklist

- [ ] Change all default secrets and keys
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Configure PostgreSQL with SSL
- [ ] Set up database backups
- [ ] Enable logging and monitoring
- [ ] Configure firewall rules
- [ ] Set up error tracking (Sentry)
- [ ] Regular security updates
- [ ] Implement rate limiting per user

## 📊 Monitoring

### Recommended Tools

- **Application**: PM2 monitoring, New Relic, or DataDog
- **Database**: pgAdmin, PostgreSQL logs
- **Errors**: Sentry or Rollbar
- **Uptime**: UptimeRobot or Pingdom
- **Analytics**: Custom dashboard or Grafana

## 🧪 Testing

### Backend Tests (Future Enhancement)

```bash
npm install --save-dev jest supertest
npm test
```

### Frontend Tests (Future Enhancement)

```bash
npm install --save-dev @testing-library/react vitest
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues or questions:
- Create an issue on GitHub
- Contact: your-email@example.com

## 🎯 Future Enhancements

- [ ] Mobile native apps (React Native)
- [ ] More game types
- [ ] Dynamic level system (beyond 3 levels)
- [ ] Automated payment integration (Stripe, PayPal)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Push notifications
- [ ] Seasons/competitions
- [ ] NFT rewards
- [ ] Web3 integration

---

**Built with ❤️ for the Telegram community**
