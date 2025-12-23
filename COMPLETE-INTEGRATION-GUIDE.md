# Axum Complete Integration Guide

## 🎯 Overview

This guide walks you through connecting your **Axum frontend** with the **Axum backend** to create a fully functional gamification platform.

---

## 📦 What You Have

### Frontend (React + Vite)
- 8 complete pages
- Telegram login integration
- Ethiopian-inspired design
- Fully responsive

### Backend (Node.js + Express)
- Authentication API
- Task management
- Leaderboard system
- Rewards tracking
- All endpoints ready

---

## 🚀 Complete Setup (30 minutes)

### Part 1: Backend Setup (15 minutes)

#### 1.1 Install Backend
```bash
cd axum-backend
npm install
```

#### 1.2 Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
JWT_SECRET=axum-secret-key-12345-change-in-production
TELEGRAM_BOT_TOKEN=   # Leave empty for demo mode
```

#### 1.3 Start Backend
```bash
npm run dev
```

You should see:
```
⚜️  Axum Backend Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server running on port 5000
🌍 Environment: development
📡 CORS enabled for: http://localhost:5173
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

#### 1.4 Test Backend
Open new terminal:
```bash
curl http://localhost:5000/api/health
```

Expected: `{"status":"ok","message":"Axum backend is running"}`

---

### Part 2: Frontend Setup (15 minutes)

#### 2.1 Update Frontend Environment

In `axum-frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
VITE_TELEGRAM_BOT_USERNAME=   # Leave empty for demo mode
```

#### 2.2 Update HomePage for Vite

Replace `src/pages/HomePage.jsx` with this version that works with your backend:

**Key changes:**
- Uses `import.meta.env.VITE_API_URL` 
- Has demo mode fallback
- Connects to your local backend

#### 2.3 Start Frontend
```bash
cd axum-frontend
npm install  # if not already done
npm run dev
```

Frontend runs on: `http://localhost:5173`

---

## 🎮 Test the Complete Flow

### 1. Open Frontend
Visit: `http://localhost:5173`

### 2. Click "Try Demo Mode"
Since no Telegram bot is configured, you'll see a demo button.

### 3. Explore the App
- ✅ Dashboard with stats
- ✅ Game levels (6 levels)
- ✅ Leaderboard
- ✅ Tasks page
- ✅ Rewards
- ✅ Sponsors

### 4. Test Task Completion
1. Go to Tasks page
2. Click "Complete" on any task
3. Points should increase
4. Check dashboard for updated stats

---

## 🤖 Add Real Telegram Login

### Step 1: Create Telegram Bot

1. Open Telegram, search **@BotFather**
2. Send: `/newbot`
3. Name: **Axum Game Bot**
4. Username: **AxumGameBot** (must end in 'bot')
5. **Save the token**: `123456789:ABCdef...`

### Step 2: Configure Bot Domain

In BotFather:
```
/setdomain
```
- Select your bot
- For local: `localhost:5173`
- For production: `your-domain.vercel.app`

### Step 3: Update Backend .env
```env
TELEGRAM_BOT_TOKEN=123456789:ABCdef...
```

Restart backend:
```bash
# Press Ctrl+C then
npm run dev
```

### Step 4: Update Frontend .env
```env
VITE_TELEGRAM_BOT_USERNAME=AxumGameBot
```

Restart frontend:
```bash
# Press Ctrl+C then
npm run dev
```

### Step 5: Test Real Login
1. Visit `http://localhost:5173`
2. You'll see Telegram login button
3. Click and authenticate
4. You're logged in!

---

## ☁️ Deploy to Production

### Phase 1: Deploy Backend

#### Option A: Deploy to Vercel (Recommended)
```bash
cd axum-backend
npm install -g vercel
vercel login
vercel

# Set environment variables
vercel env add JWT_SECRET production
vercel env add TELEGRAM_BOT_TOKEN production
vercel env add FRONTEND_URL production

# Redeploy
vercel --prod
```

**Your backend URL:** `https://axum-backend-xxx.vercel.app`

#### Option B: Deploy to Railway
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select `axum-backend` repo
4. Add environment variables
5. Deploy!

---

### Phase 2: Deploy Frontend

```bash
cd axum-frontend

# Update .env for production
VITE_API_URL=https://axum-backend-xxx.vercel.app
VITE_TELEGRAM_BOT_USERNAME=AxumGameBot

# Deploy
vercel
vercel --prod
```

**Your frontend URL:** `https://axum-frontend-xxx.vercel.app`

---

### Phase 3: Update Telegram Bot Domain

In BotFather:
```
/setdomain
```
- Select your bot
- Enter: `axum-frontend-xxx.vercel.app`

---

### Phase 4: Update Backend CORS

Update backend environment variable:
```bash
vercel env add FRONTEND_URL production
# Enter: https://axum-frontend-xxx.vercel.app

vercel --prod  # Redeploy
```

---

## 🧪 Complete Testing Checklist

### Local Development
- [ ] Backend running on :5000
- [ ] Frontend running on :5173
- [ ] Health check returns OK
- [ ] Demo login works
- [ ] Can view dashboard
- [ ] Can see all 6 levels
- [ ] Leaderboard displays
- [ ] Tasks can be completed
- [ ] Points increase after tasks

### With Telegram
- [ ] Telegram bot created
- [ ] Bot token added to backend
- [ ] Bot username added to frontend
- [ ] Domain configured in BotFather
- [ ] Telegram login button appears
- [ ] Can authenticate via Telegram
- [ ] User data saves correctly

### Production
- [ ] Backend deployed and accessible
- [ ] Frontend deployed and accessible
- [ ] CORS configured correctly
- [ ] Environment variables set
- [ ] Telegram login works in production
- [ ] HTTPS enabled
- [ ] All API endpoints working
- [ ] No console errors

---

## 🔍 Debugging Common Issues

### Issue: "Network Error" in Frontend

**Symptoms:** API calls fail, nothing loads

**Solutions:**
1. Check backend is running: `curl http://localhost:5000/api/health`
2. Verify VITE_API_URL in frontend .env
3. Check browser console for CORS errors
4. Ensure backend FRONTEND_URL matches frontend URL

### Issue: "Username Invalid"

**Symptoms:** Telegram login shows error

**Solutions:**
1. Use demo mode: Remove `VITE_TELEGRAM_BOT_USERNAME` from .env
2. Check bot username ends in 'bot'
3. Verify domain is set in BotFather
4. Restart both servers after .env changes

### Issue: "Unauthorized" (401)

**Symptoms:** Can't access protected routes

**Solutions:**
1. Check JWT_SECRET is set in backend
2. Verify token is being sent in requests
3. Clear localStorage and login again
4. Check token hasn't expired (30 days)

### Issue: CORS Errors

**Symptoms:** "Access-Control-Allow-Origin" errors

**Solutions:**
1. Backend .env: `FRONTEND_URL=http://localhost:5173`
2. Ensure no trailing slash in URLs
3. Restart backend after changes
4. Check browser network tab for actual error

---

## 📊 Architecture Overview

```
┌─────────────────┐
│  Telegram Bot   │
│   @AxumGameBot  │
└────────┬────────┘
         │
         │ Auth Data
         │
┌────────▼────────────────────────┐
│      Frontend (Vite/React)       │
│  http://localhost:5173           │
│                                  │
│  • Home (Telegram Login)         │
│  • Onboarding (Story)            │
│  • Dashboard                     │
│  • Game (6 Levels)               │
│  • Leaderboard                   │
│  • Tasks                         │
│  • Rewards                       │
│  • Sponsors                      │
└──────────┬──────────────────────┘
           │
           │ API Calls (JWT Token)
           │
┌──────────▼──────────────────────┐
│      Backend (Node/Express)      │
│  http://localhost:5000           │
│                                  │
│  POST /api/auth/telegram         │
│  GET  /api/auth/me               │
│  GET  /api/user/stats            │
│  GET  /api/levels                │
│  GET  /api/tasks                 │
│  POST /api/tasks/:id/complete    │
│  GET  /api/leaderboard           │
│  GET  /api/rewards               │
│  POST /api/invite                │
└──────────┬──────────────────────┘
           │
           │ Store Data
           │
┌──────────▼──────────────────────┐
│   In-Memory Storage              │
│   (Replace with MongoDB/         │
│    PostgreSQL in production)     │
└──────────────────────────────────┘
```

---

## 🗂️ File Structure

```
project/
├── axum-frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── OnboardingPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── GamePage.jsx
│   │   │   ├── LeaderboardPage.jsx
│   │   │   ├── RewardsPage.jsx
│   │   │   ├── TasksPage.jsx
│   │   │   └── SponsorsPage.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env
│   ├── package.json
│   └── vite.config.js
│
└── axum-backend/
    ├── server.js
    ├── .env
    ├── package.json
    └── vercel.json
```

---

## 🎯 Next Steps

### Immediate (Development)
1. ✅ Get both servers running locally
2. ✅ Test demo mode login
3. ✅ Explore all pages
4. ✅ Complete a task

### Short Term (This Week)
1. 🤖 Create Telegram bot
2. 🔐 Set up real authentication
3. ☁️ Deploy to production
4. 🧪 Test end-to-end

### Medium Term (This Month)
1. 💾 Add database (MongoDB/PostgreSQL)
2. 📧 Add email notifications
3. 💰 Integrate Remitly for rewards
4. 📊 Add analytics tracking

### Long Term (Scaling)
1. 🔄 Add Redis caching
2. 📱 Create mobile apps
3. 🌍 Add i18n support
4. 🎮 Gamify further

---

## 📚 Documentation Links

- **Frontend README:** `axum-frontend/README.md`
- **Backend README:** `axum-backend/README.md`
- **Frontend Deployment:** `axum-frontend/DEPLOYMENT.md`
- **Backend Deployment:** `axum-backend/DEPLOYMENT.md`
- **Quick Start:** `axum-frontend/QUICKSTART.md`

---

## 🆘 Get Help

**Issues?**
1. Check the debugging section above
2. Review console logs (backend and frontend)
3. Verify environment variables
4. Test each component separately

**Still stuck?**
- Email: support@saba.com
- GitHub Issues: [Create issue]
- Telegram: @AxumSupport

---

## ✅ Success Checklist

Complete setup when you can:
- [ ] Login with Telegram (or demo)
- [ ] See your username in dashboard
- [ ] View 6 game levels
- [ ] Complete a task
- [ ] See points increase
- [ ] View leaderboard
- [ ] Check rewards page
- [ ] Invite friends feature works

---

**You're ready to launch Queen Makeda's quest! ⚜️**

May your players find wisdom and courage on their journey to Jerusalem!
