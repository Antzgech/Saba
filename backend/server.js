const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Your actual bot token
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8471878133:AAHHxTHp4_gKm8bx3FkpljPc9vZH9YQT3UU';
const JWT_SECRET = process.env.JWT_SECRET || 'axum-secret-key-change-in-production-12345';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://saba-hbhv.vercel.app';

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// In-memory database
const users = new Map();
const tasks = new Map();

// Initialize default tasks
const defaultTasks = [
  { id: '1', type: 'youtube', title: 'Subscribe to SABA YouTube Channel', points: 50, url: 'https://youtube.com/@saba', icon: '▶️' },
  { id: '2', type: 'telegram', title: 'Join Official Telegram Group', points: 30, url: 'https://t.me/axumgame', icon: '✈️' },
  { id: '3', type: 'facebook', title: 'Follow SABA on Facebook', points: 40, url: 'https://facebook.com/saba', icon: '👍' },
  { id: '4', type: 'tiktok', title: 'Follow on TikTok', points: 40, url: 'https://tiktok.com/@saba', icon: '🎵' },
  { id: '5', type: 'invite', title: 'Invite 5 Friends', points: 100, url: null, icon: '👥' }
];

defaultTasks.forEach(task => tasks.set(task.id, task));

// Verify Telegram authentication
const verifyTelegramAuth = (data) => {
  const { hash, ...authData } = data;
  
  // In demo mode (if hash is 'demo_hash'), allow it
  if (hash === 'demo_hash') {
    console.log('✅ Demo mode authentication');
    return true;
  }

  try {
    const secret = crypto
      .createHash('sha256')
      .update(TELEGRAM_BOT_TOKEN)
      .digest();

    const checkString = Object.keys(authData)
      .sort()
      .map(key => `${key}=${authData[key]}`)
      .join('\n');

    const hmac = crypto
      .createHmac('sha256', secret)
      .update(checkString)
      .digest('hex');

    const isValid = hmac === hash;
    console.log('🔐 Telegram auth verification:', isValid ? '✅ Valid' : '❌ Invalid');
    return isValid;
  } catch (error) {
    console.error('❌ Verification error:', error);
    return false;
  }
};

// Get or create user
const getOrCreateUser = (telegramData) => {
  const userId = telegramData.id.toString();
  
  if (!users.has(userId)) {
    const newUser = {
      id: userId,
      telegramId: telegramData.id,
      username: telegramData.username || telegramData.first_name || 'User',
      first_name: telegramData.first_name || 'User',
      photo_url: telegramData.photo_url || '',
      points: 0,
      currentLevel: 1,
      badges: [],
      completedTasks: [],
      invitedFriends: 0,
      levelScores: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
      createdAt: new Date(),
      lastActive: new Date()
    };
    
    users.set(userId, newUser);
    console.log('✅ Created new user:', userId, newUser.username);
  } else {
    const user = users.get(userId);
    user.lastActive = new Date();
    users.set(userId, user);
    console.log('✅ Existing user logged in:', userId, user.username);
  }
  
  return users.get(userId);
};

// Middleware: Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// ROUTES

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Axum backend is running',
    users: users.size,
    timestamp: new Date().toISOString()
  });
});

// POST /api/auth/telegram
app.post('/api/auth/telegram', (req, res) => {
  try {
    console.log('📨 Telegram auth request received:', req.body);
    
    const telegramData = req.body;
    
    // Verify authentication
    const isValid = verifyTelegramAuth(telegramData);
    
    if (!isValid) {
      console.log('❌ Invalid Telegram authentication');
      return res.status(401).json({ error: 'Invalid Telegram authentication' });
    }

    // Create or get user
    const user = getOrCreateUser(telegramData);

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, telegramId: user.telegramId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    console.log('✅ Auth successful, sending response');

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        first_name: user.first_name,
        photo_url: user.photo_url,
        points: user.points,
        currentLevel: user.currentLevel,
        badges: user.badges
      }
    });
  } catch (error) {
    console.error('❌ Auth error:', error);
    res.status(500).json({ error: 'Authentication failed: ' + error.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    photo_url: user.photo_url,
    points: user.points,
    currentLevel: user.currentLevel,
    badges: user.badges
  });
});

// GET /api/user/stats
app.get('/api/user/stats', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const allUsers = Array.from(users.values()).sort((a, b) => b.points - a.points);
  const globalRank = allUsers.findIndex(u => u.id === user.id) + 1;
  const levelProgress = Math.min(100, (user.levelScores[user.currentLevel] / 1000) * 100);

  const requirements = {
    friends: user.invitedFriends >= 5,
    subscriptions: user.completedTasks.filter(t => ['youtube', 'facebook', 'tiktok'].includes(tasks.get(t)?.type)).length >= 3,
    follows: user.completedTasks.filter(t => tasks.get(t)?.type === 'telegram').length >= 1
  };

  res.json({
    currentLevel: user.currentLevel,
    totalPoints: user.points,
    globalRank,
    badges: user.badges,
    levelProgress,
    requirements,
    requiredFriends: 5,
    requiredSubscriptions: 3,
    requiredFollows: 1,
    recentActivity: [
      { icon: '🎮', text: 'Joined Axum', time: '1 hour ago' },
      { icon: '⚔️', text: `Earned ${user.points} points`, time: '30 min ago' }
    ]
  });
});

// GET /api/levels
app.get('/api/levels', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const levels = [
    { id: 1, name: 'The Awakening', unlocked: true, completed: user.levelScores[1] >= 1000, dueDate: '2025-01-15', score: user.levelScores[1], maxScore: 1000 },
    { id: 2, name: 'The Journey Begins', unlocked: user.currentLevel >= 2, completed: user.levelScores[2] >= 1500, dueDate: '2025-01-30', score: user.levelScores[2], maxScore: 1500 },
    { id: 3, name: 'Trials of Wisdom', unlocked: user.currentLevel >= 3, completed: user.levelScores[3] >= 2000, dueDate: '2025-02-14', score: user.levelScores[3], maxScore: 2000 },
    { id: 4, name: 'The Sacred Path', unlocked: user.currentLevel >= 4, completed: user.levelScores[4] >= 2500, dueDate: '2025-02-28', score: user.levelScores[4], maxScore: 2500 },
    { id: 5, name: 'Champions Rise', unlocked: user.currentLevel >= 5, completed: user.levelScores[5] >= 3000, dueDate: '2025-03-15', score: user.levelScores[5], maxScore: 3000 },
    { id: 6, name: 'Jerusalem Awaits', unlocked: user.currentLevel >= 6, completed: user.levelScores[6] >= 5000, dueDate: '2025-03-30', score: user.levelScores[6], maxScore: 5000 }
  ];

  res.json({ levels });
});

// GET /api/tasks
app.get('/api/tasks', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const allTasks = Array.from(tasks.values()).map(task => ({
    ...task,
    completed: user.completedTasks.includes(task.id)
  }));

  res.json({ tasks: allTasks });
});

// POST /api/tasks/:id/complete
app.post('/api/tasks/:id/complete', authenticateToken, (req, res) => {
  const taskId = req.params.id;
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const task = tasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }

  if (user.completedTasks.includes(taskId)) {
    return res.status(400).json({ error: 'Task already completed' });
  }

  user.completedTasks.push(taskId);
  user.points += task.points;
  user.levelScores[user.currentLevel] += task.points;

  if (user.completedTasks.length === 1 && !user.badges.some(b => b.name === 'First Steps')) {
    user.badges.push({ name: 'First Steps', icon: '🏅' });
  }

  users.set(user.id, user);

  console.log(`✅ Task completed: ${task.title} by ${user.username}, +${task.points} points`);

  res.json({
    success: true,
    points: task.points,
    totalPoints: user.points,
    badges: user.badges
  });
});

// GET /api/leaderboard
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  const level = req.query.level || 'all';
  
  let rankings;
  
  if (level === 'all') {
    rankings = Array.from(users.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 50)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        points: user.points,
        level: user.currentLevel,
        badges: user.badges.length,
        finalist: index < 30
      }));
  } else {
    const levelNum = parseInt(level);
    rankings = Array.from(users.values())
      .filter(u => u.currentLevel >= levelNum)
      .sort((a, b) => b.levelScores[levelNum] - a.levelScores[levelNum])
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        username: user.username,
        points: user.levelScores[levelNum],
        level: user.currentLevel,
        badges: user.badges.length,
        finalist: index < 5
      }));
  }

  const finalists = [];
  for (let levelNum = 1; levelNum <= 6; levelNum++) {
    const levelFinalists = Array.from(users.values())
      .filter(u => u.currentLevel >= levelNum)
      .sort((a, b) => b.levelScores[levelNum] - a.levelScores[levelNum])
      .slice(0, 5)
      .map(u => ({
        username: u.username,
        level: levelNum,
        points: u.levelScores[levelNum]
      }));
    
    finalists.push(...levelFinalists);
  }

  res.json({
    rankings,
    finalists: finalists.slice(0, 30)
  });
});

// GET /api/rewards
app.get('/api/rewards', authenticateToken, (req, res) => {
  const user = users.get(req.user.userId);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    rewards: [],
    totalCash: 0,
    totalPoints: user.points,
    badges: user.badges
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  ⚜️  Axum Backend Server
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🚀 Server: http://localhost:${PORT}
  🌍 Environment: ${process.env.NODE_ENV || 'development'}
  📡 CORS: ${FRONTEND_URL}
  🤖 Telegram Bot: Configured
  👥 Users: ${users.size}
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

module.exports = app;
