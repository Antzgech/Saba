const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;

// Configuration
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8471878133:AAHHxTHp4_gKm8bx3FkpljPc9vZH9YQT3UU';
const JWT_SECRET = process.env.JWT_SECRET || 'Saba1212';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://saba-hbhv.vercel.app';

require('dotenv').config(); // Load variables first
const { pool, initDb } = require('./db');
initDb(); // Initialize the database table
// In-memory storage
const users = new Map();

// Middleware - CORS FIRST!
app.use(cors({
  origin: [
    'https://saba-hbhv.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Verify Telegram hash
function verifyTelegram(data) {
  const { hash, ...authData } = data;
  
  // Allow demo mode
  if (hash === 'demo_hash') {
    console.log('✅ Demo mode allowed');
    return true;
  }
  
  try {
    const secret = crypto.createHash('sha256').update(BOT_TOKEN).digest();
    const checkString = Object.keys(authData)
      .sort()
      .map(k => `${k}=${authData[k]}`)
      .join('\n');
    const hmac = crypto.createHmac('sha256', secret).update(checkString).digest('hex');
    const isValid = hmac === hash;
    console.log('Telegram verification:', isValid ? '✅ Valid' : '❌ Invalid');
    return isValid;
  } catch (err) {
    console.error('Verification error:', err);
    return false;
  }
}

// Middleware: Verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

// ROUTES

// Root route
app.get('/api/user', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  console.log('✅ Health check');
  res.json({ 
    status: 'ok',
    message: 'Axum backend is running',
    users: users.size,
    timestamp: new Date().toISOString()
  });
});

// Login with Telegram
app.post('/api/auth/telegram', async (req, res) => {
  try {
    const telegramData = req.body;
    if (!verifyTelegram(telegramData)) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    const { id, first_name, username, photo_url } = telegramData;

    // Use SQL to insert new runner or update existing one
    const query = `
      INSERT INTO users (id, first_name, username, photo_url)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        username = EXCLUDED.username,
        photo_url = EXCLUDED.photo_url
      RETURNING *;
    `;
    
    const result = await pool.query(query, [id, first_name, username, photo_url]);
    const user = result.rows[0];

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});
    // Create or update user
    const userId = telegramData.id.toString();
    
    if (!users.has(userId)) {
      users.set(userId, {
        id: userId,
        first_name: telegramData.first_name,
        username: telegramData.username || telegramData.first_name,
        photo_url: telegramData.photo_url || '',
        points: 0,
        level: 1,
        joinedAt: new Date().toISOString()
      });
      console.log('✅ New user created:', userId);
    } else {
      console.log('✅ Existing user:', userId);
    }
    
    const user = users.get(userId);
    
    // Generate token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    
    console.log('✅ Login successful');
    
    res.json({
      token,
      user
    });
    
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// Get user data
app.get('/api/user', authenticateToken, (req, res) => {
  console.log('📥 Get user request');
  
  try {
    const user = users.get(req.user.userId);
    
    if (!user) {
      console.log('❌ User not found:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    
    console.log('✅ User data sent:', user.id);
    res.json(user);
    
  } catch (err) {
    console.error('❌ Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get all users (debug)
app.get('/api/users', (req, res) => {
  const allUsers = Array.from(users.values());
  res.json({
    count: allUsers.length,
    users: allUsers
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚜️  AXUM BACKEND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Server: http://localhost:${PORT}
🌍 Environment: ${process.env.NODE_ENV || 'development'}
📡 CORS: ${FRONTEND_URL}
🤖 Bot: sabawians_bot
👥 Users: ${users.size}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

// Export for Vercel
module.exports = app;
