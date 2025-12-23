const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust Railway proxy (important for HTTPS)
app.set("trust proxy", 1);

// CORS — allow Vercel + Telegram + Local Dev
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,            // Your Vercel frontend
      "https://telegram.org",              // Telegram widget
      "https://web.telegram.org",          // Telegram browser
      "https://t.me",                      // Telegram deep links
      "http://localhost:5173"              // Local Vite dev
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// Parse JSON
app.use(express.json());

// In-memory database (temporary)
const users = new Map();
const tasks = new Map();
const rewards = new Map();

// Default tasks
const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to SABA YouTube Channel', points: 50, url: 'https://youtube.com/@saba', icon: '▶️' },
  { id: '2', type: 'telegram', title: 'Join Official Telegram Group', points: 30, url: 'https://t.me/axumgame', icon: '✈️' },
  { id: '3', type: 'facebook', title: 'Follow SABA on Facebook', points: 40, url: 'https://facebook.com/saba', icon: '👍' },
  { id: '4', type: 'tiktok', title: 'Follow on TikTok', points: 40, url: 'https://tiktok.com/@saba', icon: '🎵' },
  { id: '5', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥' }
];

defaultTasks.forEach(task => tasks.set(task.id, task));

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, process.env.JWT_SECRET || 'axum-secret-key', (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Telegram login verification
const verifyTelegramAuth = (data) => {
  const { hash, ...authData } = data;

  if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.log("⚠️ WARNING: TELEGRAM_BOT_TOKEN missing — running in demo mode");
    return true;
  }

  const secret = crypto
    .createHash("sha256")
    .update(process.env.TELEGRAM_BOT_TOKEN)
    .digest();

  const checkString = Object.keys(authData)
    .sort()
    .map(key => `${key}=${authData[key]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  return hmac === hash;
};

// Create or get user
const getOrCreateUser = (telegramData) => {
  const userId = telegramData.id.toString();

  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      telegramId: telegramData.id,
      username: telegramData.username || telegramData.first_name || "User",
      first_name: telegramData.first_name || "User",
      photo_url: telegramData.photo_url || "",
      points: 0,
      currentLevel: 1,
      badges: [],
      completedTasks: [],
      invitedFriends: 0,
      levelScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      createdAt: new Date(),
      lastActive: new Date(),
    });
  } else {
    const user = users.get(userId);
    user.lastActive = new Date();
    users.set(userId, user);
  }

  return users.get(userId);
};

// ROUTES -----------------------------------------------------

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Axum backend is running" });
});

// Telegram login
app.post("/api/auth/telegram", (req, res) => {
  try {
    const telegramData = req.body;

    const isValid = verifyTelegramAuth(telegramData);
    if (!isValid && process.env.NODE_ENV === "production") {
      return res.status(401).json({ error: "Invalid Telegram authentication" });
    }

    const user = getOrCreateUser(telegramData);

    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId },
      process.env.JWT_SECRET || "axum-secret-key",
      { expiresIn: "30d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        photo_url: user.photo_url,
        points: user.points,
        currentLevel: user.currentLevel,
        badges: user.badges,
      },
    });
  } catch (err) {
    console.error("Auth error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Get current user
app.get("/api/auth/me", authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  res.json({
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    photo_url: user.photo_url,
    points: user.points,
    currentLevel: user.currentLevel,
    badges: user.badges,
  });
});

// ------------------------------------------------------------
// (All your other routes: tasks, leaderboard, rewards, etc.)
// ------------------------------------------------------------

// Start server
app.listen(PORT, () => {
  console.log(`
  ⚜️ Axum Backend Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Running on port ${PORT}
  🌍 Environment: ${process.env.NODE_ENV || "development"}
  📡 Allowed Frontend: ${process.env.FRONTEND_URL}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;
