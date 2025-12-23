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
      process.env.FRONTEND_URL,
      "http://localhost:5173"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());

const users = new Map();

const getDevUser = () => {
  const userId = "1";

  if (!users.has(userId)) {
    users.set(userId, {
      id: userId,
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

  return users.get(userId);
};

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/telegram", (req, res) => {
  const user = getDevUser();

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET || "axum-secret-key",
    { expiresIn: "30d" }
  );

  res.json({ token, user });
});

app.get("/api/auth/me", (req, res) => {
  const user = getDevUser();
  res.json(user);
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

module.exports = app;
