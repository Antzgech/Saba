const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

// In-memory storage
const users = new Map();
const tasks = new Map();

// Default tasks
const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to SABA YouTube Channel', points: 50, url: 'https://youtube.com/@saba', icon: '▶️' },
  { id: '2', type: 'telegram', title: 'Join Official Telegram Group', points: 30, url: 'https://t.me/axumgame', icon: '✈️' },
  { id: '3', type: 'facebook', title: 'Follow SABA on Facebook', points: 40, url: 'https://facebook.com/saba', icon: '👍' },
  { id: '4', type: 'tiktok', title: 'Follow on TikTok', points: 40, url: 'https://tiktok.com/@saba', icon: '🎵' },
  { id: '5', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥' }
];
defaultTasks.forEach(task => tasks.set(task.id, task));

// Ensure dev user Antz exists
const ensureDevUser = () => {
  const id = "1";
  if (!users.has(id)) {
    users.set(id, {
      id,
      telegramId: 1,
      username: "Antz",
      first_name: "Antz",
      photo_url: "",
      points: 0,
      currentLevel: 1,
      badges: [],
      completedTasks: [],
      invitedFriends: 0,
      levelScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      createdAt: new Date(),
      lastActive: new Date(),
    });
  }
  return users.get(id);
};

// Auth middleware (dev-friendly)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = { userId: "1" };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'axum-secret-key', (err, user) => {
    if (err) {
      req.user = { userId: "1" };
      return next();
    }
    req.user = user;
    next();
  });
};

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Dev auth endpoint: always return Antz
app.post("/api/auth/telegram", (req, res) => {
  try {
    const user = ensureDevUser();

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
  const userId = req.user?.userId || "1";
  const user = users.get(userId) || ensureDevUser();
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

app.get("/api/tasks", (req, res) => {
  res.json(Array.from(tasks.values()));
});

app.post("/api/user/add-points", authenticateToken, (req, res) => {
  const userId = req.user?.userId || "1";
  const user = users.get(userId) || ensureDevUser();
  const { points = 0 } = req.body;
  user.points = (user.points || 0) + Number(points);
  user.lastActive = new Date();
  users.set(userId, user);
  res.json({ success: true, points: user.points });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

module.exports = app;
