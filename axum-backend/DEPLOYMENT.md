# Backend Deployment Guide

## 🚀 Quick Local Setup (5 minutes)

### Step 1: Install Dependencies
```bash
cd axum-backend
npm install
```

### Step 2: Create Environment File
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your-super-secret-jwt-key-change-me
TELEGRAM_BOT_TOKEN=your-bot-token-from-botfather
```

### Step 3: Start Server
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

### Step 4: Test
```bash
# Health check
curl http://localhost:5000/api/health
```

You should see: `{"status":"ok","message":"Axum backend is running"}`

---

## ☁️ Deploy to Vercel (10 minutes)

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
cd axum-backend
vercel
```

4. **Set Environment Variables**
```bash
# JWT Secret
vercel env add JWT_SECRET production
# Enter: your-super-secret-key-here

# Telegram Bot Token (from @BotFather)
vercel env add TELEGRAM_BOT_TOKEN production
# Enter: 123456:ABC-DEF...

# Frontend URL (your deployed frontend)
vercel env add FRONTEND_URL production
# Enter: https://your-frontend.vercel.app
```

5. **Redeploy with Environment Variables**
```bash
vercel --prod
```

6. **Get Your Backend URL**
```
✅ Production: https://axum-backend.vercel.app
```

### Option 2: GitHub Integration

1. **Push to GitHub**
```bash
cd axum-backend
git init
git add .
git commit -m "Initial backend commit"
git remote add origin https://github.com/yourusername/axum-backend.git
git push -u origin main
```

2. **Import to Vercel**
- Go to [vercel.com/new](https://vercel.com/new)
- Click "Import Project"
- Select your GitHub repository

3. **Configure**
- Framework Preset: `Other`
- Build Command: (leave empty)
- Output Directory: (leave empty)

4. **Add Environment Variables**
In Vercel dashboard → Settings → Environment Variables:

```
JWT_SECRET = your-super-secret-key
TELEGRAM_BOT_TOKEN = 123456:ABC-DEF...
FRONTEND_URL = https://your-frontend.vercel.app
```

5. **Deploy**
Click "Deploy" and wait for completion!

---

## 🔗 Connect Frontend to Backend

### Update Frontend .env

After deploying backend, update your frontend `.env`:

```env
VITE_API_URL=https://axum-backend.vercel.app
VITE_TELEGRAM_BOT_USERNAME=YourBotUsername
```

Redeploy frontend:
```bash
cd axum-frontend
vercel --prod
```

---

## 🌐 Alternative Deployment Options

### Deploy to Railway

1. **Sign up at [railway.app](https://railway.app)**

2. **Create New Project**
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your backend repository

3. **Add Environment Variables**
```
JWT_SECRET=your-secret
TELEGRAM_BOT_TOKEN=your-token
FRONTEND_URL=https://your-frontend.vercel.app
```

4. **Deploy**
Railway will automatically deploy!

5. **Get URL**
```
https://axum-backend.up.railway.app
```

### Deploy to Render

1. **Sign up at [render.com](https://render.com)**

2. **New Web Service**
- Connect GitHub repository
- Name: `axum-backend`
- Environment: `Node`
- Build Command: `npm install`
- Start Command: `npm start`

3. **Add Environment Variables**
```
JWT_SECRET=your-secret
TELEGRAM_BOT_TOKEN=your-token
FRONTEND_URL=https://your-frontend.vercel.app
```

4. **Create Web Service**
Render will deploy automatically!

### Deploy to Heroku

1. **Install Heroku CLI**
```bash
brew install heroku/brew/heroku  # macOS
# or download from heroku.com
```

2. **Login**
```bash
heroku login
```

3. **Create App**
```bash
cd axum-backend
heroku create axum-backend
```

4. **Set Environment Variables**
```bash
heroku config:set JWT_SECRET=your-secret
heroku config:set TELEGRAM_BOT_TOKEN=your-token
heroku config:set FRONTEND_URL=https://your-frontend.vercel.app
```

5. **Deploy**
```bash
git push heroku main
```

---

## 🔧 Get Your Telegram Bot Token

### Step 1: Create Bot

1. Open Telegram and search for **@BotFather**
2. Send: `/newbot`
3. Choose name: **Axum Game Bot**
4. Choose username: **AxumGameBot** (must end in `bot`)
5. **Save the token** - looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

### Step 2: Configure Bot

Still in BotFather:

```
/setdomain
```
- Select: **@AxumGameBot**
- Enter domain: **your-frontend.vercel.app**

### Step 3: Set Bot Commands (Optional)

```
/setcommands
```

Then paste:
```
start - Begin your quest
help - Get help
leaderboard - View rankings
```

---

## 🧪 Testing Your Deployed Backend

### 1. Health Check
```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{"status":"ok","message":"Axum backend is running"}
```

### 2. Test Authentication (Demo)
```bash
curl -X POST https://your-backend.vercel.app/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"id":123456,"first_name":"Test","username":"test_user"}'
```

Expected response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "123456",
    "username": "test_user",
    ...
  }
}
```

### 3. Test Protected Endpoint
```bash
# Replace YOUR_TOKEN with token from step 2
curl https://your-backend.vercel.app/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔄 Update Workflow

### After Making Changes

**Vercel (Auto-deploy):**
```bash
git add .
git commit -m "Update backend"
git push origin main
# Vercel deploys automatically
```

**Manual Redeploy:**
```bash
vercel --prod
```

---

## 📊 Monitor Your Backend

### Vercel Dashboard
- Real-time logs
- Function invocations
- Error tracking
- Performance metrics

**Access:** [vercel.com/dashboard](https://vercel.com/dashboard)

### Add Error Tracking (Optional)

Install Sentry:
```bash
npm install @sentry/node
```

In `server.js`:
```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 🗄️ Add Database (Production Ready)

### MongoDB Atlas (Free Tier)

1. **Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)**

2. **Create Cluster**
- Choose free tier
- Select region
- Create cluster

3. **Get Connection String**
```
mongodb+srv://username:password@cluster.mongodb.net/axum
```

4. **Add to Environment Variables**
```bash
vercel env add MONGODB_URI production
# Enter your connection string
```

5. **Update Code**

Install MongoDB driver:
```bash
npm install mongodb mongoose
```

In `server.js`:
```javascript
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err));
```

---

## ⚠️ Common Issues

### CORS Errors
**Problem:** Frontend can't connect to backend

**Solution:**
1. Verify `FRONTEND_URL` in backend .env
2. Ensure it matches your actual frontend URL
3. Redeploy: `vercel --prod`

### 401 Unauthorized
**Problem:** Token authentication fails

**Solution:**
1. Check JWT_SECRET is set in production
2. Verify token is being sent in Authorization header
3. Check token hasn't expired (30 days)

### 500 Internal Server Error
**Problem:** Server crashes

**Solution:**
1. Check Vercel logs: `vercel logs`
2. Look for error messages
3. Verify all environment variables are set

---

## 📈 Performance Optimization

### Add Caching (Redis)

For high traffic:

1. **Add Redis** (Upstash free tier)
```bash
npm install ioredis
```

2. **Cache Leaderboards**
```javascript
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

app.get('/api/leaderboard', async (req, res) => {
  const cached = await redis.get('leaderboard:all');
  if (cached) return res.json(JSON.parse(cached));
  
  // Generate leaderboard
  const data = generateLeaderboard();
  
  // Cache for 5 minutes
  await redis.setex('leaderboard:all', 300, JSON.stringify(data));
  
  res.json(data);
});
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] Backend deployed to Vercel/Railway/Render
- [ ] Environment variables configured
- [ ] CORS set to frontend URL
- [ ] Telegram bot created and configured
- [ ] Frontend connected to backend
- [ ] Health check endpoint working
- [ ] Authentication tested
- [ ] Database connected (if using one)
- [ ] Error monitoring set up
- [ ] Logs accessible
- [ ] HTTPS enabled
- [ ] Rate limiting added (recommended)

---

## 🎯 Next Steps

1. **Test locally** with frontend
2. **Deploy backend** to Vercel
3. **Configure Telegram bot**
4. **Update frontend** with backend URL
5. **Test end-to-end** authentication
6. **Add database** for persistence
7. **Monitor** and optimize

---

**Your backend is ready to power Queen Makeda's quest! ⚜️**
