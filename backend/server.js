const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "https://telegram.org",
      "https://web.telegram.org",
      "https://t.me",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

const users = new Map();
const tasks = new Map();
const rewards = new Map();

const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to SABA YouTube Channel', points: 50, url: 'https://youtube.com/@saba', icon: '▶️' },
  { id: '2', type: 'telegram', title: 'Join Official Telegram Group', points: 30, url: 'https://t.me/axumgame', icon: '✈️' },
  { id: '3', type: 'facebook', title: 'Follow SABA on Facebook', points: 40, url: 'https://facebook.com/saba', icon: '👍' },
  { id: '4', type: 'tiktok', title: 'Follow on TikTok', points: 40, url: 'https://tiktok.com/@saba', icon: '🎵' },
  { id: '5', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥' }
];

defaultTasks.forEach(task => tasks.set(task.id, task));

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

const getOrCreateUser = (telegramData) => {
  const userId = telegramData.id.toString();

  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
      telegramId: telegramData.id,
      username: `ANTZ${telegramData.id}`,
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Axum backend is running" });
});

app.post("/api/auth/telegram", (req, res) => {
  try {
    const telegramData = req.body;

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
