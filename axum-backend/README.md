# Axum Backend API

Complete backend server for the Axum gamification platform with Telegram authentication, task management, leaderboards, and rewards system.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd axum-backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server runs on `http://localhost:5000`

---

## 📡 API Endpoints

### Authentication

#### POST `/api/auth/telegram`
Authenticate user via Telegram Web Login

**Request Body:**
```json
{
  "id": 123456789,
  "first_name": "John",
  "username": "john_doe",
  "photo_url": "https://...",
  "auth_date": 1703260800,
  "hash": "abc123..."
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "123456789",
    "username": "john_doe",
    "first_name": "John",
    "photo_url": "https://...",
    "points": 0,
    "currentLevel": 1,
    "badges": []
  }
}
```

#### GET `/api/auth/me`
Get current authenticated user

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "123456789",
  "username": "john_doe",
  "points": 150,
  "currentLevel": 1,
  "badges": [...]
}
```

---

### User Stats

#### GET `/api/user/stats`
Get user statistics for dashboard

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "currentLevel": 1,
  "totalPoints": 150,
  "globalRank": 42,
  "badges": [...],
  "levelProgress": 15,
  "requirements": {
    "friends": false,
    "subscriptions": true,
    "follows": true
  },
  "recentActivity": [...]
}
```

---

### Game Levels

#### GET `/api/levels`
Get all levels with user progress

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "levels": [
    {
      "id": 1,
      "name": "The Awakening",
      "unlocked": true,
      "completed": false,
      "dueDate": "2025-01-15",
      "score": 150,
      "maxScore": 1000
    },
    ...
  ]
}
```

---

### Tasks

#### GET `/api/tasks`
Get all available tasks

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "tasks": [
    {
      "id": "1",
      "type": "youtube",
      "title": "Subscribe to SABA YouTube Channel",
      "points": 50,
      "url": "https://youtube.com/@saba",
      "icon": "▶️",
      "completed": false
    },
    ...
  ]
}
```

#### POST `/api/tasks/:id/complete`
Mark a task as completed

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "points": 50,
  "totalPoints": 200,
  "badges": [...]
}
```

---

### Leaderboard

#### GET `/api/leaderboard?level=all`
Get leaderboard rankings

**Query Params:**
- `level`: `all` | `1` | `2` | `3` | `4` | `5` | `6`

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "rankings": [
    {
      "rank": 1,
      "username": "solomon",
      "points": 5000,
      "level": 6,
      "badges": 12,
      "finalist": true
    },
    ...
  ],
  "finalists": [
    {
      "username": "makeda",
      "level": 6,
      "points": 4800
    },
    ...
  ]
}
```

---

### Rewards

#### GET `/api/rewards`
Get user rewards

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "rewards": [...],
  "totalCash": 250,
  "totalPoints": 5000,
  "badges": [...]
}
```

#### POST `/api/rewards/claim`
Claim a reward

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "rewardId": "reward123",
  "paymentDetails": {
    "name": "John Doe",
    "email": "john@example.com",
    "remitlyAccount": "john@remitly.com"
  }
}
```

---

### Invitations

#### POST `/api/invite`
Track friend invitation

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "invitedUserId": "987654321"
}
```

**Response:**
```json
{
  "success": true,
  "invitedFriends": 3,
  "bonusPoints": 20
}
```

---

## 🔐 Authentication Flow

1. User clicks Telegram login on frontend
2. Telegram widget sends user data to frontend
3. Frontend sends data to `/api/auth/telegram`
4. Backend verifies Telegram hash
5. Backend creates/updates user
6. Backend returns JWT token
7. Frontend stores token in localStorage
8. Frontend includes token in all subsequent requests

---

## 🗄️ Data Storage

**Current:** In-memory storage (resets on server restart)

**Production:** Replace with database:

### MongoDB Example
```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  telegramId: { type: Number, unique: true },
  username: String,
  points: { type: Number, default: 0 },
  currentLevel: { type: Number, default: 1 },
  badges: [{ name: String, icon: String }],
  completedTasks: [String],
  levelScores: {
    1: { type: Number, default: 0 },
    2: { type: Number, default: 0 },
    3: { type: Number, default: 0 },
    4: { type: Number, default: 0 },
    5: { type: Number, default: 0 },
    6: { type: Number, default: 0 }
  },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
```

### PostgreSQL Example
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username VARCHAR(255),
  points INTEGER DEFAULT 0,
  current_level INTEGER DEFAULT 1,
  badges JSONB DEFAULT '[]',
  completed_tasks TEXT[],
  level_scores JSONB DEFAULT '{"1":0,"2":0,"3":0,"4":0,"5":0,"6":0}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🚢 Deployment

### Deploy to Vercel

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Deploy:
```bash
vercel
```

3. Set environment variables:
```bash
vercel env add JWT_SECRET production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add FRONTEND_URL production
```

4. Redeploy:
```bash
vercel --prod
```

### Deploy to Railway/Render

1. Create new project
2. Connect GitHub repository
3. Add environment variables
4. Deploy automatically

---

## 🔧 Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `PORT` | Server port | No | `5000` |
| `NODE_ENV` | Environment | No | `production` |
| `FRONTEND_URL` | Frontend URL for CORS | Yes | `https://axum.vercel.app` |
| `JWT_SECRET` | JWT signing secret | Yes | `your-secret-key` |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | Yes | `123456:ABC-DEF...` |
| `MONGODB_URI` | MongoDB connection | Optional | `mongodb://...` |

---

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:5000/api/health

# Demo login
curl -X POST http://localhost:5000/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"id":123,"first_name":"Demo","username":"demo"}'
```

### Automated Tests
```bash
npm test
```

---

## 📊 Game Mechanics Implementation

### Level Unlocking Logic
```javascript
// Levels unlock every 2 weeks
// Check requirements:
// - Invited friends >= 5
// - Completed subscriptions >= 3
// - Joined Telegram >= 1
```

### Top 10 Rewards
```javascript
// Every bi-weekly cycle:
// 1. Get top 10 players per level
// 2. Award rewards
// 3. Mark players as "rewarded"
// 4. Exclude from next cycle's top 10
// 5. New top 10 emerges
```

### Finalist Selection
```javascript
// Top 5 from each level (30 total)
// If player qualifies in multiple levels:
// - Assign to highest level
// - Ensure 30 unique finalists
```

---

## 🔌 Social Media Integration

### YouTube Verification (Optional)
```javascript
const { google } = require('googleapis');

const verifyYouTubeSubscription = async (channelId, userId) => {
  const youtube = google.youtube('v3');
  const response = await youtube.subscriptions.list({
    key: process.env.YOUTUBE_API_KEY,
    part: 'snippet',
    channelId: channelId,
    mine: true
  });
  // Check if subscribed
};
```

### Manual Verification
For now, tasks are marked complete when user clicks "Complete" button. In production, implement API verification or require proof (screenshot upload).

---

## 🐛 Troubleshooting

### CORS Errors
- Verify `FRONTEND_URL` in .env matches your frontend
- Check CORS configuration in server.js

### Authentication Fails
- Verify `TELEGRAM_BOT_TOKEN` is correct
- Check Telegram hash validation logic
- Test in demo mode first (no token required)

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

---

## 📈 Scaling Considerations

### Current Limits
- In-memory storage (not persistent)
- Single server instance
- No caching layer

### Production Improvements
1. **Database:** MongoDB/PostgreSQL for persistence
2. **Redis:** Cache frequently accessed data
3. **Load Balancer:** Multiple server instances
4. **Queue System:** Bull/RabbitMQ for background tasks
5. **Monitoring:** Sentry, LogRocket, DataDog

---

## 🔒 Security Best Practices

- ✅ JWT tokens with expiration
- ✅ Telegram auth verification
- ✅ CORS configuration
- ✅ Input validation
- ⚠️ Add rate limiting in production
- ⚠️ Add request sanitization
- ⚠️ Use HTTPS only
- ⚠️ Implement database connection pooling

---

## 📞 Support

For issues or questions:
- Email: dev@saba.com
- GitHub Issues: [repo link]

---

**Built with ⚜️ for Queen Makeda's Quest**
